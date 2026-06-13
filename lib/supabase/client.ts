import { createBrowserClient } from "@supabase/ssr";

/**
 * Create a Supabase browser client for use in Client Components.
 *
 * `NEXT_PUBLIC_` environment variables are inlined at build time by Next.js,
 * so they are guaranteed to exist in the browser bundle.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
