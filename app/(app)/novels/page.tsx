import { BookOpenIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NovelsPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <BookOpenIcon className="size-8 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">
            Novel saya
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            Buat novel pertama kamu untuk mulai menulis dengan AI.
          </p>
        </div>
      </div>
      <Button disabled>
        <PlusIcon />
        Novel baru
      </Button>
    </div>
  );
}
