import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app-header";
import { MobileNav } from "@/components/mobile-nav";

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
      <AppHeader user={{ displayName, email }} />
      <main className="flex flex-1 flex-col pb-16 md:pb-0">{children}</main>
      <MobileNav />
    </div>
  );
}
