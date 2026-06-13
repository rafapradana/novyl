import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { NavDock } from "@/components/nav-dock";

const LOGIN_PATH = "/login";

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
  const email = user.email ?? "";

  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col pb-20">{children}</main>
      <NavDock user={{ displayName, email }} />
    </div>
  );
}
