import {
  BookOpenIcon,
  ArchiveIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NovelsPageProps {
  readonly searchParams: Promise<{ archived?: string }>;
}

function ActiveNovelsEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
          <BookOpenIcon className="size-8 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold tracking-tight">
            Mulai novel pertama kamu
          </h1>
          <p className="text-sm text-muted-foreground">
            Buat novel, tulis bab per bab, dan biarkan AI menjaga konsistensi
            ceritamu.
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

function ArchivedEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
          <ArchiveIcon className="size-8 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold tracking-tight">
            Belum ada novel diarsipkan
          </h1>
          <p className="text-sm text-muted-foreground">
            Novel yang diarsipkan akan muncul di sini. Kamu bisa memulihkannya
            kapan saja.
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function NovelsPage({ searchParams }: NovelsPageProps) {
  const { archived } = await searchParams;
  const isArchivedView = archived === "true";

  return (
    <div className="flex flex-1 flex-col">
      {/* Toolbar: search + Novel baru */}
      <div className="flex items-center justify-center gap-3 px-4 py-3">
        <form className="flex items-center gap-2">
          <div className="relative w-64">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={isArchivedView ? "Cari novel diarsipkan..." : "Cari novel..."}
              className="pl-8 h-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            <SearchIcon />
            Cari
          </Button>
        </form>
        {!isArchivedView && (
          <Button size="sm" disabled>
            <PlusIcon />
            <span className="hidden sm:inline">Novel baru</span>
          </Button>
        )}
      </div>

      {/* Content */}
      {isArchivedView ? <ArchivedEmptyState /> : <ActiveNovelsEmptyState />}
    </div>
  );
}
