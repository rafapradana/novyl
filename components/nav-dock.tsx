"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BookOpenIcon, ArchiveIcon, PlusIcon, SettingsIcon, LogOutIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DockItem } from "@/components/dock-item";
import { useIsMobile } from "@/hooks/use-mobile";

const NOVELS_PATH = "/novels";
const ARCHIVED_PATH = "/novels?archived=true";

interface NavDockProps {
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

export function NavDock({ user }: NavDockProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isArchivedView = searchParams.get("archived") === "true";
  const isMobile = useIsMobile();
  const initials = extractInitials(user.displayName);

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  function navigateToActive() {
    router.push(NOVELS_PATH);
  }

  function navigateToArchived() {
    router.push(ARCHIVED_PATH);
  }

  return (
    <>
      {/* FAB — Novel baru — mobile only */}
      {!isArchivedView && (
        <button
          type="button"
          disabled
          className="fixed bottom-24 right-4 z-50 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:hidden"
        >
          <PlusIcon className="size-6" />
        </button>
      )}

      <nav className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-3xl border bg-background/80 px-3 py-2 shadow-lg backdrop-blur-xl">
          <DockItem
            label="Novel saya"
            isActive={!isArchivedView}
            onClick={navigateToActive}
          >
            <BookOpenIcon className="size-5" />
          </DockItem>

          <DockItem
            label="Arsip"
            isActive={isArchivedView}
            onClick={navigateToArchived}
          >
            <ArchiveIcon className="size-5" />
          </DockItem>

          {/* Desktop: DropdownMenu, Mobile: triggers Sheet */}
          {isMobile ? (
            <DockItem
              label="Profil"
              onClick={() => setIsSheetOpen(true)}
            >
              <Avatar className="size-6 rounded-md">
                <AvatarFallback className="rounded-md text-[10px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DockItem>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div>
                  <DockItem label="Profil">
                    <Avatar className="size-6 rounded-md">
                      <AvatarFallback className="rounded-md text-[10px]">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </DockItem>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" side="top" sideOffset={12} className="w-56">
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
                <DropdownMenuItem disabled>
                  <SettingsIcon />
                  Pengaturan akun
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOutAndRedirect(router)}>
                  <LogOutIcon />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </nav>

      {/* Profile sheet — mobile only */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8 pt-2 gap-0">
          <SheetTitle className="sr-only">Profil</SheetTitle>
          <SheetDescription className="sr-only">
            Pengaturan akun dan keluar
          </SheetDescription>

          <div className="flex justify-center pb-3">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center">
              <Avatar className="size-8 rounded-full">
                <AvatarFallback className="rounded-full text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 pb-4">
            <span className="text-sm font-medium">{user.displayName}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>

          <div className="border-t" />

          <div className="flex flex-col pt-2">
            <button
              type="button"
              disabled
              className="flex items-center gap-3 px-2 py-3 text-sm text-muted-foreground rounded-md"
            >
              <SettingsIcon className="size-4" />
              Pengaturan akun
            </button>
            <button
              type="button"
              onClick={() => signOutAndRedirect(router)}
              className="flex items-center gap-3 px-2 py-3 text-sm text-destructive rounded-md active:bg-destructive/10"
            >
              <LogOutIcon className="size-4" />
              Keluar
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
