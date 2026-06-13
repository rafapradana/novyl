"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookOpenIcon, ArchiveIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const NOVELS_PATH = "/novels";
const ARCHIVED_PATH = "/novels?archived=true";

/**
 * Bottom navigation bar — visible only on mobile.
 * Tabs for Novel saya / Arsip + FAB for creating novel.
 */
export function MobileNav(): React.JSX.Element {
  const searchParams = useSearchParams();
  const isArchivedView = searchParams.get("archived") === "true";

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
      </nav>
    </>
  );
}
