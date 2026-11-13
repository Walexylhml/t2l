"use client"

import { useEffect, useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

type Admin = {
  id: string
  email: string | null
  full_name: string | null
  is_admin: boolean
  is_super_admin: boolean
}

async function authHeader() {
  const supabase = getSupabaseBrowser()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function AdminAdminsPage() {
  const [loading, setLoading] = useState(true)
  const [admins, setAdmins] = useState<Admin[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [makeSuper, setMakeSuper] = useState(false)

  async function load() {
    setError(null)
    const res = await fetch("/api/admin/admins", { headers: await authHeader() })
    const body = await res.json()
    if (!res.ok) {
      setError(body.error || "Couldn't load admins.")
      return
    }
    setAdmins(body.admins ?? [])
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        await load()
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  async function addAdmin() {
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ email, password, is_super_admin: makeSuper }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || "Couldn't add admin.")
      setNotice(`${email} can now sign in and reach the admin area. Ask them to change the password after first login.`)
      setEmail("")
      setPassword("")
      setMakeSuper(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setSaving(false)
    }
  }

  async function revoke(a: Admin) {
    setError(null)
    setNotice(null)
    const res = await fetch("/api/admin/admins", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({ id: a.id }),
    })
    const body = await res.json()
    if (!res.ok) {
      setError(body.error || "Couldn't revoke access.")
      return
    }
    setNotice(`Revoked admin access for ${a.email ?? "that account"}. Their account and orders are untouched.`)
    await load()
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading admins...</p>
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg font-semibold tracking-tight">Add an admin</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Creates their login if the email is new, or promotes an existing account. Email isn&apos;t
          case-sensitive; the password is. Never reuse a personal password here.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Initial password</span>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={makeSuper}
            onChange={(e) => setMakeSuper(e.target.checked)}
            className="h-4 w-4"
          />
          <span>Make super admin (can also add and revoke admins)</span>
        </label>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {notice && <p className="mt-4 text-sm text-green-600">{notice}</p>}

        <button
          onClick={addAdmin}
          disabled={saving}
          className="mt-5 inline-flex rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add admin"}
        </button>
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight">Current admins</h2>
        <div className="mt-4 divide-y divide-border rounded-lg border border-border">
          {admins.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground">No admins yet.</p>
          )}
          {admins.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{a.email ?? a.id}</p>
                <p className="text-xs text-muted-foreground">
                  {a.full_name ? `${a.full_name} · ` : ""}
                  {a.is_super_admin ? "Super admin" : "Admin"}
                </p>
              </div>
              <button
                onClick={() => revoke(a)}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
