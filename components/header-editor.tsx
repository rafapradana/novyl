import Link from "next/link";
import { Home, Info, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface HeaderEditorProps {
  novelTitle: string;
  chapterOrder: number;
  chapterTitle: string;
  chapters: { id: string; order: number; title: string }[];
  activeChapterId: string | null;
  onNavigate: (chapterId: string) => void;
  onRenameClick: () => void;
  onDeleteClick: () => void;
  onInfoClick: () => void;
}

export function HeaderEditor({
  novelTitle,
  chapterOrder,
  chapterTitle,
  chapters,
  activeChapterId,
  onNavigate,
  onRenameClick,
  onDeleteClick,
  onInfoClick,
}: HeaderEditorProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between px-4 md:px-6 pt-4 pb-2">
        {/* Left: Beranda Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#f8f8f8] text-black hover:bg-[#eeeeee] transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]"
        >
          <Home className="h-4 w-4" />
          <span>Beranda</span>
        </Link>

        {/* Center: Title */}
        <div className="flex-1 px-4 text-center min-w-0">
          <span className="text-sm font-medium truncate block">
            Novel: {novelTitle} - Bab {chapterOrder}: {chapterTitle}
          </span>
        </div>

        {/* Right: Three dots + Info Novel */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center justify-center h-9 px-3 rounded-lg bg-[#f8f8f8] text-black hover:bg-[#eeeeee] transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {chapters.map((ch) => (
                <DropdownMenuItem
                  key={ch.id}
                  onClick={() => onNavigate(ch.id)}
                  className={ch.id === activeChapterId ? "bg-accent" : ""}
                >
                  Bab {ch.order}: {ch.title}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onRenameClick}>
                Ubah Nama Bab
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDeleteClick}
                className="text-destructive focus:text-destructive"
              >
                Hapus Bab
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={onInfoClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#f8f8f8] text-black hover:bg-[#eeeeee] transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]"
          >
            <Info className="h-4 w-4" />
            <span>Info Novel</span>
          </button>
        </div>
      </div>
    </header>
  );
}


