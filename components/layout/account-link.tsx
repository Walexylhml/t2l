"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

// Small header link: shows "Account" when signed in, "Sign in" otherwise.
// Keeps the same understated styling as the other header controls.
export function AccountLink() {
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    const supabase = getSupabaseBrowser()

    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session)
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  return (
    <Link
      href={signedIn ? "/account" : "/login"}
      className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {signedIn ? "Account" : "Sign in"}
    </Link>
  )
}
