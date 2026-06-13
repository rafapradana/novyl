import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function resolveSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

/**
 * Create a Supabase server client for use in Server Components, Route Handlers,
 * and Server Functions.
 *
 * In Server Components (read-only): `setAll` silently fails — token refreshes
 * are handled by the proxy (proxy.ts).
 *
 * In Route Handlers / Server Functions (read+write): `setAll` writes refreshed
 * cookies back to the response.
 */
export async function createClient() {
  const { supabaseUrl, supabaseAnonKey } = resolveSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map(({ name, value }) => ({
          name,
          value,
        }));
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Components cannot set cookies — proxy handles refreshes.
        }
      },
    },
  });
}
