"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Home, Info, Pencil, Trash2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  onDeleteNovelClick: () => void;
  onRegenerateClick: () => void;
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
  onDeleteNovelClick,
  onRegenerateClick,
}: HeaderEditorProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 pt-3 pb-2 gap-2">
        {/* Left: Beranda Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium bg-[#f8f8f8] text-black hover:bg-[#eeeeee] transition-[background-color,scale] duration-150 ease-out active:scale-[0.96] shrink-0"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Beranda</span>
        </Link>

        {/* Center: Title with Popover */}
        <div className="flex-1 px-2 text-center min-w-0 relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="text-xs sm:text-sm font-medium truncate block mx-auto transition-[background-color,scale] duration-150 ease-out active:scale-[0.96] px-3 py-1.5 rounded-lg hover:bg-[#f8f8f8]"
          >
            <span className="hidden sm:inline">{novelTitle} — </span>
            Bab {chapterOrder}
            <span className="hidden md:inline">: {chapterTitle}</span>
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                className="absolute left-1/2 top-full mt-2 z-[60] w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                initial={{ opacity: 0, y: -8, scale: 0.95, x: "-50%" }}
                animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                exit={{ opacity: 0, y: -8, scale: 0.95, x: "-50%" }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="max-h-60 overflow-y-auto py-2">
                  {chapters.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => {
                        onNavigate(ch.id);
                        setMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        ch.id === activeChapterId
                          ? "bg-gray-50 font-medium"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      Bab {ch.order}: {ch.title}
                    </button>
                  ))}
                </div>

                <div className="border-t border-gray-100" />

                <div className="py-1.5">
                  <button
                    onClick={() => {
                      onRenameClick();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                    Ubah Nama Bab
                  </button>
                  <button
                    onClick={() => {
                      onDeleteClick();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-gray-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus Bab
                  </button>
                  <button
                    onClick={() => {
                      onRegenerateClick();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    Tulis Ulang Bab
                  </button>
                </div>

                <div className="border-t border-gray-100" />

                <div className="py-1.5">
                  <button
                    onClick={() => {
                      onInfoClick();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                  >
                    <Info className="h-4 w-4 text-muted-foreground" />
                    Info Novel
                  </button>
                  <button
                    onClick={() => {
                      onDeleteNovelClick();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-gray-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus Novel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Info Button */}
        <button
          onClick={onInfoClick}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium bg-[#f8f8f8] text-black hover:bg-[#eeeeee] transition-[background-color,scale] duration-150 ease-out active:scale-[0.96] shrink-0"
        >
          <Info className="h-4 w-4" />
          <span className="hidden sm:inline">Info</span>
        </button>
      </div>
    </header>
  );
}
