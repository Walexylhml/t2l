import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// ---------------------------------------------------------------------------
// Browser Supabase client for auth (sign up / sign in / session).
// Persists the session in the browser so a signed-in user stays signed in.
// Uses the public anon key and respects row level security.
// ---------------------------------------------------------------------------

let client: SupabaseClient | null = null

export function getSupabaseBrowser(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see SETUP.md)."
    )
  }

  // Reuse a single client across the app (singleton) to keep one auth session.
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }

  return client
}
