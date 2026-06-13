"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SettingsIcon, LogOutIcon } from "lucide-react";

interface AppHeaderProps {
  readonly user: {
    readonly displayName: string;
    readonly email: string;
  };
}

function extractInitials(displayName: string): string {
  return displayName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

async function signOutAndRedirect(router: ReturnType<typeof useRouter>) {
  const supabase = createClient();
  await supabase.auth.signOut();
  router.push("/login");
}

export function AppHeader({ user }: AppHeaderProps): React.JSX.Element {
  const router = useRouter();
  const initials = extractInitials(user.displayName);

  return (
    <header className="flex h-14 shrink-0 items-center border-b px-4 gap-3">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link
          href="/novels"
          className="flex items-center gap-2 font-semibold text-sm"
        >
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-xs font-bold">N</span>
          </div>
          <span className="group-data-[collapsible=icon]/sidebar-wrapper:hidden">
            Novyl
          </span>
        </Link>
      </div>

      <div className="flex-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md p-1.5 hover:bg-accent transition-colors"
          >
            <Avatar className="size-7 rounded-md">
              <AvatarFallback className="rounded-md text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm hidden sm:inline group-data-[collapsible=icon]/sidebar-wrapper:hidden">
              {user.displayName}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-fit" align="end" sideOffset={8}>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.displayName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem disabled>
              <SettingsIcon />
              Pengaturan akun
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOutAndRedirect(router)}>
            <LogOutIcon />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
