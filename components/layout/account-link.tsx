"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

// Header links: shows "Account" when signed in, "Sign in" otherwise, and an
// "Admin" link in front of it when the signed-in user is an admin.
export function AccountLink() {
  const [signedIn, setSignedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseBrowser()
    let active = true

    async function check(session: unknown) {
      if (!active) return
      const s = session as { user?: { id: string } } | null
      setSignedIn(!!s)
      if (s?.user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", s.user.id)
          .maybeSingle()
        if (active) setIsAdmin(!!profile?.is_admin)
      } else {
        setIsAdmin(false)
      }
    }

    supabase.auth.getSession().then(({ data }) => check(data.session))

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      check(session)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const linkClass =
    "rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"

  return (
    <>
      {isAdmin ? (
        <Link href="/admin" className={linkClass}>
          Admin
        </Link>
      ) : null}
      <Link href={signedIn ? "/account" : "/login"} className={linkClass}>
        {signedIn ? "Account" : "Sign in"}
      </Link>
    </>
  )
}
