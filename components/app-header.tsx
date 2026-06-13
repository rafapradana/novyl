"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  BookOpenIcon,
  ArchiveIcon,
  SettingsIcon,
  LogOutIcon,
} from "lucide-react";

const NOVELS_PATH = "/novels";
const ACTIVE_TAB = "active";
const ARCHIVED_TAB = "archived";

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

function useIsArchivedView(): boolean {
  const searchParams = useSearchParams();
  return searchParams.get("archived") === "true";
}

async function signOutAndRedirect(router: ReturnType<typeof useRouter>) {
  const supabase = createClient();
  await supabase.auth.signOut();
  router.push("/login");
}

export function AppHeader({ user }: AppHeaderProps): React.JSX.Element {
  const router = useRouter();
  const isArchivedView = useIsArchivedView();
  const initials = extractInitials(user.displayName);

  const activeTab = isArchivedView ? ARCHIVED_TAB : ACTIVE_TAB;

  function handleTabChange(tab: string) {
    if (tab === ARCHIVED_TAB) {
      router.push(`${NOVELS_PATH}?archived=true`);
    } else {
      router.push(NOVELS_PATH);
    }
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      {/* Mobile: centered logo */}
      <div className="flex flex-1 items-center justify-center md:hidden">
        <Link
          href={NOVELS_PATH}
          className="flex items-center gap-2 font-semibold text-sm"
        >
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-xs font-bold">N</span>
          </div>
          Novyl
        </Link>
      </div>

      {/* Desktop: left logo */}
      <Link
        href={NOVELS_PATH}
        className="hidden md:flex items-center gap-2 font-semibold text-sm shrink-0"
      >
        <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <span className="text-xs font-bold">N</span>
        </div>
        Novyl
      </Link>

      {/* Desktop: center tabs */}
      <div className="flex-1 hidden md:flex justify-center">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value={ACTIVE_TAB} className="gap-1.5">
              <BookOpenIcon />
              Novel saya
            </TabsTrigger>
            <TabsTrigger value={ARCHIVED_TAB} className="gap-1.5">
              <ArchiveIcon />
              Arsip
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Desktop: avatar + name */}
      <div className="hidden md:flex shrink-0">
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
              <span className="text-sm">{user.displayName}</span>
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
      </div>
    </header>
  );
}
