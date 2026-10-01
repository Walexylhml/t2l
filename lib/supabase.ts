import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Supabase clients
// - getSupabasePublic: safe for the browser (anon key, respects row level security).
// - getSupabaseAdmin:  SERVER ONLY (service role key, bypasses RLS). Never import
// this into a client component.
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabasePublic() {
if (!supabaseUrl || !anonKey) {
throw new Error("Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see SETUP.md).");
}
return createClient(supabaseUrl, anonKey);
}

// Server-only admin client. Uses the service role key and must only ever run
// inside API routes / server code.
export function getSupabaseAdmin() {
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
throw new Error("Supabase admin env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see SETUP.md).");
}
return createClient(supabaseUrl, serviceKey, {
auth: { persistSession: false, autoRefreshToken: false },
});
}

// Convenience flag so callers can skip DB work gracefully when unconfigured.
export const isSupabaseConfigured = Boolean(supabaseUrl && anonKey);
