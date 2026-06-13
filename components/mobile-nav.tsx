"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookOpenIcon, ArchiveIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NOVELS_PATH = "/novels";
const ARCHIVED_PATH = "/novels?archived=true";

/**
 * Bottom navigation bar — visible only on mobile.
 * Replaces sidebar tabs for small screens.
 */
export function MobileNav(): React.JSX.Element {
  const searchParams = useSearchParams();
  const isArchivedView = searchParams.get("archived") === "true";

  return (
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
      <Button
        size="icon"
        className="size-10 rounded-full shadow-lg"
        disabled
      >
        <PlusIcon className="size-5" />
      </Button>
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
  );
}
