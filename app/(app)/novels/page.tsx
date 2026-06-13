import { BookOpenIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Novel library page — placeholder for S4.
 * Shows empty state with CTA to create first novel.
 */
export default function NovelsPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <BookOpenIcon className="size-12 text-muted-foreground" />
        <h1 className="text-2xl font-semibold tracking-tight">
          Novel saya
        </h1>
        <p className="text-sm text-muted-foreground">
          Buat novel pertama kamu untuk mulai menulis dengan AI.
        </p>
      </div>
      <Button disabled>
        <PlusIcon />
        Novel baru
      </Button>
    </div>
  );
}
