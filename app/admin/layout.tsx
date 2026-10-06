"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

const TABS = [
  { href: "/admin", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/discounts", label: "Discounts" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [state, setState] = useState<"loading" | "denied" | "ok">("loading")

  useEffect(() => {
    let active = true

    async function check() {
      try {
        const supabase = getSupabaseBrowser()
        const { data: sessionData } = await supabase.auth.getSession()
        const session = sessionData.session

        if (!session) {
          router.replace("/login")
          return
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", session.user.id)
          .maybeSingle()

        if (active) setState(profile?.is_admin ? "ok" : "denied")
      } catch {
        if (active) setState("denied")
      }
    }

    check()
    return () => {
      active = false
    }
  }, [router])

  if (state === "loading") {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-5xl items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading admin...</p>
      </main>
    )
  }

  if (state === "denied") {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Admins only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This area is for the store owner. Your account doesn&apos;t have admin access.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
        >
          Back to store
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Back to store
        </Link>
      </div>

      <nav className="mt-6 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-8">{children}</div>
    </main>
  )
}
