"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase-browser"

type Mode = "signin" | "signup"

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setSubmitting(true)

    try {
      const supabase = getSupabaseBrowser()

      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              typeof window !== "undefined"
                ? window.location.origin + "/account"
                : undefined,
          },
        })
        if (signUpError) throw signUpError
        setNotice(
          "Check your inbox to confirm your email. Once confirmed, any past guest orders placed with this email will be added to your account automatically."
        )
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
        router.push("/account")
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        {mode === "signin" ? "Sign in" : "Create your account"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === "signin"
          ? "Sign in to view your orders."
          : "Sign up with the email you used at checkout to claim your past orders."}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="you@example.com"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Password</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="At least 6 characters"
          />
        </label>

        {error ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        ) : null}
        {notice ? (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">{notice}</p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <div className="mt-6 text-sm text-muted-foreground">
        {mode === "signin" ? (
          <button
            type="button"
            onClick={() => {
              setMode("signup")
              setError(null)
              setNotice(null)
            }}
            className="underline underline-offset-4 hover:text-foreground"
          >
            New here? Create an account
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMode("signin")
              setError(null)
              setNotice(null)
            }}
            className="underline underline-offset-4 hover:text-foreground"
          >
            Already have an account? Sign in
          </button>
        )}
      </div>

      <Link href="/" className="mt-8 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
        Back to store
      </Link>
    </main>
  )
}
