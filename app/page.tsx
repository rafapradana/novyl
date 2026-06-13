import { redirect } from "next/navigation";

/**
 * Root page — always redirects.
 * Auth state is handled by proxy.ts:
 * - Authenticated → /novels
 * - Unauthenticated → /login
 */
export default function RootPage() {
  redirect("/novels");
}
