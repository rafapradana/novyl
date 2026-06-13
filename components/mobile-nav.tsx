"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BookOpenIcon, ArchiveIcon, PlusIcon, SettingsIcon, LogOutIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

const NOVELS_PATH = "/novels";
const ARCHIVED_PATH = "/novels?archived=true";

interface MobileNavProps {
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

export function MobileNav({ user }: MobileNavProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isArchivedView = searchParams.get("archived") === "true";
  const initials = extractInitials(user.displayName);

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      {/* FAB — positioned above bottom nav */}
      {!isArchivedView && (
        <button
          type="button"
          disabled
          className="fixed bottom-20 right-4 z-50 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:hidden"
        >
          <PlusIcon className="size-6" />
        </button>
      )}

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background md:hidden">
        <Link
          href={NOVELS_PATH}
          className={cn(
            "flex flex-col items-center gap-1 text-xs text-muted-foreground transition-colors",
            !isArchivedView && "text-primary"
          )}
        >
          <BookOpenIcon className="size-5" />
          <span>Novel saya</span>
        </Link>
        <Link
          href={ARCHIVED_PATH}
          className={cn(
            "flex flex-col items-center gap-1 text-xs text-muted-foreground transition-colors",
            isArchivedView && "text-primary"
          )}
        >
          <ArchiveIcon className="size-5" />
          <span>Arsip</span>
        </Link>
        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className="flex flex-col items-center gap-1 text-xs text-muted-foreground transition-colors p-2 -m-2"
        >
          <Avatar className="size-7">
            <AvatarFallback className="text-[10px]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span>Profil</span>
        </button>
      </nav>

      {/* Profile sheet */}
      <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8 pt-2 gap-0">
          <SheetTitle className="sr-only">Profil</SheetTitle>
          <SheetDescription className="sr-only">
            Pengaturan akun dan keluar
          </SheetDescription>

          {/* Drag handle indicator */}
          <div className="flex justify-center pb-3">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center">
              <Avatar className="size-8 rounded-full">
                <AvatarFallback className="rounded-full text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* User info */}
          <div className="flex flex-col items-center gap-1 pb-4">
            <span className="text-sm font-medium">{user.displayName}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>

          <Separator />

          {/* Actions */}
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
