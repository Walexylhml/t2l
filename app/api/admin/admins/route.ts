import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

// ---------------------------------------------------------------------------
// Admin management API - SUPER ADMINS ONLY.
// Lets a super admin list admins, add a new admin (creating their login), and
// revoke admin access, without anyone touching SQL. Uses the service role key
// (server-only) and verifies the caller's Supabase session on every request.
// ---------------------------------------------------------------------------

type Ctx =
  | { error: string; status: 401 | 403 }
  | { admin: ReturnType<typeof getSupabaseAdmin>; callerId: string }

async function requireSuperAdmin(req: Request): Promise<Ctx> {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "")
  if (!token) return { error: "Not signed in.", status: 401 }

  const admin = getSupabaseAdmin()
  const { data: userData, error } = await admin.auth.getUser(token)
  if (error || !userData.user) return { error: "Session is invalid or expired.", status: 401 }

  const { data: profile } = await admin
    .from("profiles")
    .select("is_super_admin")
    .eq("id", userData.user.id)
    .maybeSingle()

  if (!profile?.is_super_admin) return { error: "Super admins only.", status: 403 }
  return { admin, callerId: userData.user.id }
}

// GET - list every admin / super admin with their email.
export async function GET(req: Request) {
  const ctx = await requireSuperAdmin(req)
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  const { admin } = ctx

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, is_admin, is_super_admin")
    .or("is_admin.eq.true,is_super_admin.eq.true")

  const admins = []
  for (const p of profiles ?? []) {
    const { data: u } = await admin.auth.admin.getUserById(p.id)
    admins.push({
      id: p.id,
      email: u.user?.email ?? null,
      full_name: p.full_name,
      is_admin: p.is_admin,
      is_super_admin: p.is_super_admin,
    })
  }
  admins.sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""))
  return NextResponse.json({ admins })
}

// POST - add an admin. Creates the login if the email is new, or promotes an
// existing account. Body: { email, password, is_super_admin? }
export async function POST(req: Request) {
  const ctx = await requireSuperAdmin(req)
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  const { admin } = ctx

  const body = await req.json().catch(() => ({}))
  const email = String(body.email || "").trim().toLowerCase()
  const password = String(body.password || "")
  const makeSuper = Boolean(body.is_super_admin)

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 })
  if (password.length < 8)
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 })

  let userId: string

  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (created.error) {
    // Likely already registered - find and update their password instead.
    const { data: list } = await admin.auth.admin.listUsers()
    const existing = list.users.find((u) => u.email?.toLowerCase() === email)
    if (!existing) return NextResponse.json({ error: created.error.message }, { status: 400 })
    userId = existing.id
    await admin.auth.admin.updateUserById(userId, { password })
  } else {
    userId = created.data.user.id
  }

  // The on_auth_user_created trigger makes the profile row; upsert guards the
  // promote-existing-user path too.
  const { error: upErr } = await admin
    .from("profiles")
    .upsert({ id: userId, is_admin: true, is_super_admin: makeSuper }, { onConflict: "id" })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })

  return NextResponse.json({ ok: true, id: userId })
}

// DELETE - revoke admin (does NOT delete the person's account/orders).
// Body: { id }. A super admin cannot revoke themselves.
export async function DELETE(req: Request) {
  const ctx = await requireSuperAdmin(req)
  if ("error" in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })
  const { admin, callerId } = ctx

  const body = await req.json().catch(() => ({}))
  const id = String(body.id || "")
  if (!id) return NextResponse.json({ error: "Missing user id." }, { status: 400 })
  if (id === callerId)
    return NextResponse.json({ error: "You can't revoke your own access." }, { status: 400 })

  const { error } = await admin
    .from("profiles")
    .update({ is_admin: false, is_super_admin: false })
    .eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
