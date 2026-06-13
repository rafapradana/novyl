"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  LogOutIcon,
} from "lucide-react";
import { useState } from "react";

const NOVELS_PATH = "/novels";
const ARCHIVED_TAB = "archived";
const ACTIVE_TAB = "active";

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
  const pathname = usePathname();
  const isArchivedView = useIsArchivedView();
  const initials = extractInitials(user.displayName);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const activeTab = isArchivedView ? ARCHIVED_TAB : ACTIVE_TAB;
  const isNovelsPage = pathname === NOVELS_PATH;

  function handleTabChange(tab: string) {
    if (tab === ARCHIVED_TAB) {
      router.push(`${NOVELS_PATH}?archived=true`);
    } else {
      router.push(NOVELS_PATH);
    }
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Search will be implemented in S4 with actual novel data
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 gap-2">
      {/* Logo */}
      <Link
        href={NOVELS_PATH}
        className="flex items-center gap-2 font-semibold text-sm shrink-0"
      >
        <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <span className="text-xs font-bold">N</span>
        </div>
        <span className="hidden sm:inline">Novyl</span>
      </Link>

      {/* Tabs — desktop only */}
      {isNovelsPage && (
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="hidden md:flex ml-4"
        >
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
      )}

      <div className="flex-1" />

      {/* Search + Novel baru — desktop */}
      {isNovelsPage && (
        <div className="hidden md:flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari novel..."
                className="pl-8 w-48 h-8"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <Button type="submit" variant="ghost" size="icon" className="size-8">
              <SearchIcon />
            </Button>
          </form>
          <Button size="sm" disabled>
            <PlusIcon />
            Novel baru
          </Button>
        </div>
      )}

      {/* Search toggle — mobile */}
      {isNovelsPage && (
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden size-8"
          onClick={() => setIsSearchOpen(!isSearchOpen)}
        >
          <SearchIcon />
        </Button>
      )}

      {/* Avatar */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md p-1 hover:bg-accent transition-colors"
          >
            <Avatar className="size-7 rounded-md">
              <AvatarFallback className="rounded-md text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
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

      {/* Mobile search bar — expandable */}
      {isNovelsPage && isSearchOpen && (
        <div className="absolute top-14 left-0 right-0 border-b bg-background p-3 md:hidden">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari novel..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                autoFocus
              />
            </div>
            <Button type="submit" size="sm">
              Cari
            </Button>
          </form>
        </div>
      )}
    </header>
  );
}
