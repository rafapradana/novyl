import type { NextRequest } from "next/server";
import { refreshSessionAndRedirect } from "@/lib/supabase/middleware";

/**
 * Next.js 16 Proxy (replaces deprecated middleware.ts).
 *
 * Runs on every matched request before the route renders.
 * Handles auth session refresh and redirects.
 *
 * Runtime: nodejs (default in Next.js 16 — cannot be configured).
 */
export async function proxy(request: NextRequest) {
  return await refreshSessionAndRedirect(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public folder assets
     *
     * This ensures the proxy runs on all page and API routes
     * without interfering with static asset serving.
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
