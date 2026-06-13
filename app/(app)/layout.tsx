import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

const LOGIN_PATH = "/login";

/**
 * App shell layout — shared for all authenticated routes.
 * Checks auth and redirects unauthenticated users to /login.
 */
export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(LOGIN_PATH);
  }

  const displayName =
    user.user_metadata?.display_name ?? user.email ?? "User";

  return (
    <SidebarProvider>
      <AppSidebar user={{ displayName, email: user.email ?? "" }} />
      <SidebarInset>
        <AppHeader />
        <main className="flex flex-1 flex-col">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
