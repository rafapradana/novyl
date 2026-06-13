import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOGIN_PATH = "/login";
const NOVELS_PATH = "/novels";

interface RedirectTarget {
  pathname: string;
}

function redirectTo({ pathname }: RedirectTarget, request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

function readCookiesFromRequest(request: NextRequest) {
  return request.cookies.getAll().map(({ name, value }) => ({ name, value }));
}

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

function determineAuthRedirect(
  request: NextRequest,
  isAuthenticated: boolean
): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith(LOGIN_PATH);
  const isProtectedRoute =
    pathname.startsWith(NOVELS_PATH) || pathname.startsWith("/api");
  const isRootRoute = pathname === "/";

  if (!isAuthenticated && isProtectedRoute) {
    return redirectTo({ pathname: LOGIN_PATH }, request);
  }

  if (isAuthenticated && isAuthRoute) {
    return redirectTo({ pathname: NOVELS_PATH }, request);
  }

  if (isRootRoute) {
    return redirectTo(
      { pathname: isAuthenticated ? NOVELS_PATH : LOGIN_PATH },
      request
    );
  }

  return null;
}

/**
 * Refresh the Supabase auth session and handle auth-based redirects.
 *
 * Called from proxy.ts on every matched request. Validates the access token
 * via `supabase.auth.getUser()`, writes refreshed cookies to the response,
 * and redirects based on auth state:
 * - Unauthenticated + protected route → /login
 * - Authenticated + /login → /novels
 * - Root (/) → /novels or /login
 */
export async function refreshSessionAndRedirect(
  request: NextRequest
): Promise<NextResponse> {
  const { supabaseUrl, supabaseAnonKey } = resolveSupabaseEnv();

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => readCookiesFromRequest(request),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );

        supabaseResponse = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirect = determineAuthRedirect(request, !!user);
  if (redirect) {
    return redirect;
  }

  return supabaseResponse;
}
