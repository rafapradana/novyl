import { PenIcon } from "lucide-react";

/**
 * Novel workspace page — placeholder for S6.
 * Will contain chapter sidebar + editor panel.
 */
export default function NovelWorkspacePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <PenIcon className="size-12 text-muted-foreground" />
        <h1 className="text-2xl font-semibold tracking-tight">
          Workspace Novel
        </h1>
        <p className="text-sm text-muted-foreground">
          Daftar bab dan editor akan muncul di sini.
        </p>
      </div>
    </div>
  );
}
