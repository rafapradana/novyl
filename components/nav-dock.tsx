"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BookOpenIcon, ArchiveIcon, LogOutIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { DockItem } from "@/components/dock-item";

const NOVELS_PATH = "/novels";
const ARCHIVED_PATH = "/novels?archived=true";

const MAX_SCALE = 1.4;
const MAGNETIC_RANGE = 120;
const ITEM_COUNT = 3;

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

function calculateScale(distance: number): number {
  if (distance > MAGNETIC_RANGE) return 1;
  const ratio = 1 - distance / MAGNETIC_RANGE;
  return 1 + (MAX_SCALE - 1) * ratio;
}

function createDefaultScales(): number[] {
  return Array.from({ length: ITEM_COUNT }, () => 1);
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
  const initials = extractInitials(user.displayName);

  const [scales, setScales] = useState<number[]>(createDefaultScales);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!dockRef.current) return;

      const items = dockRef.current.querySelectorAll<HTMLElement>("[data-dock-item]");
      const mouseX = event.clientX;

      const newScales = Array.from(items).map((item) => {
        const rect = item.getBoundingClientRect();
        const itemCenterX = rect.left + rect.width / 2;
        const distance = Math.abs(mouseX - itemCenterX);
        return calculateScale(distance);
      });

      setScales(newScales);
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setScales(createDefaultScales());
  }, []);

  function navigateToActive() {
    router.push(NOVELS_PATH);
  }

  function navigateToArchived() {
    router.push(ARCHIVED_PATH);
  }

  return (
    <>
      <nav className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
        <div
          ref={dockRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="flex items-center gap-1 rounded-2xl border bg-background/80 px-2 py-1.5 shadow-lg backdrop-blur-xl overflow-visible"
        >
          <div data-dock-item>
            <DockItem
              label="Novel saya"
              isActive={!isArchivedView}
              scale={scales[0] ?? 1}
              onClick={navigateToActive}
            >
              <BookOpenIcon className="size-5" />
            </DockItem>
          </div>

          <div data-dock-item>
            <DockItem
              label="Arsip"
              isActive={isArchivedView}
              scale={scales[1] ?? 1}
              onClick={navigateToArchived}
            >
              <ArchiveIcon className="size-5" />
            </DockItem>
          </div>

          <div data-dock-item>
            <DockItem
              label="Profil"
              scale={scales[2] ?? 1}
              onClick={() => setIsProfileOpen(true)}
            >
              <Avatar className="size-7 rounded-lg">
                <AvatarFallback className="rounded-lg text-[10px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DockItem>
          </div>
        </div>
      </nav>

      {/* Profile sheet */}
      <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
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
              <LogOutIcon className="size-4" />
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
