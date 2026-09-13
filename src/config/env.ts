/**
 * Single point of access for build-time environment variables.
 * Only client-safe (VITE_-prefixed) values may live here — never a
 * server-only secret.
 */
export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
} as const
