"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import { HeaderEditor } from "@/components/header-editor";
import { ProgressiveBlur } from "@/components/progressive-blur";
import { getNovelById, deleteNovel } from "@/lib/actions/novel-actions";
import {
  updateChapter,
  createChapter,
  deleteChapter,
  renameChapter,
} from "@/lib/actions/chapter-actions";
import type { NovelDetail } from "@/types/novel";
import type { Chapter } from "@/types/chapter";

export default function NovelEditPage() {
  const params = useParams();
  const router = useRouter();
  const novelId = params.id as string;

  const [novel, setNovel] = useState<NovelDetail | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [infoOpen, setInfoOpen] = useState(false);
  const [newChapterOpen, setNewChapterOpen] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [deleteChapterOpen, setDeleteChapterOpen] = useState(false);
  const [deleteNovelOpen, setDeleteNovelOpen] = useState(false);
  const [renameChapterOpen, setRenameChapterOpen] = useState(false);
  const [renameChapterTitle, setRenameChapterTitle] = useState("");

  const contentRef = useRef(content);
  const activeChapterIdRef = useRef(activeChapterId);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    activeChapterIdRef.current = activeChapterId;
  }, [activeChapterId]);

  useEffect(() => {
    let cancelled = false;

    async function fetchNovel() {
      try {
        setIsLoading(true);
        const data = await getNovelById(novelId);
        if (cancelled) return;

        setNovel(data);
        const firstChapter = data.chapters[0] ?? null;
        const initialContent = firstChapter?.content ?? "";

        setActiveChapterId(firstChapter?.id ?? null);
        setContent(initialContent);
        contentRef.current = initialContent;
        isDirtyRef.current = false;
        setSaveStatus("idle");
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Gagal memuat novel");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchNovel();
    return () => {
      cancelled = true;
    };
  }, [novelId]);

  useEffect(() => {
    if (!isDirtyRef.current || !activeChapterIdRef.current) return;

    setSaveStatus("idle");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      if (!isDirtyRef.current || !activeChapterIdRef.current) return;

      setSaveStatus("saving");
      try {
        await updateChapter(activeChapterIdRef.current, contentRef.current);
        isDirtyRef.current = false;
        setSaveStatus("saved");
      } catch (err) {
        setSaveStatus("error");
        toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [content]);

  const flushSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (isDirtyRef.current && activeChapterIdRef.current) {
      setSaveStatus("saving");
      try {
        await updateChapter(activeChapterIdRef.current, contentRef.current);
        isDirtyRef.current = false;
        setSaveStatus("saved");
      } catch (err) {
        setSaveStatus("error");
        toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
      }
    }
  }, []);

  const handleContentChange = (val: string) => {
    setContent(val);
    if (!isDirtyRef.current) {
      isDirtyRef.current = true;
    }
  };

  const activeChapter = novel?.chapters.find((c) => c.id === activeChapterId) ?? null;
  const activeIndex = novel?.chapters.findIndex((c) => c.id === activeChapterId) ?? -1;

  const prevChapter =
    activeIndex > 0 ? (novel?.chapters[activeIndex - 1] ?? null) : null;

  const nextChapter =
    activeIndex >= 0 && activeIndex < (novel?.chapters.length ?? 0) - 1
      ? (novel?.chapters[activeIndex + 1] ?? null)
      : null;

  const handleNavigate = async (chapterId: string) => {
    await flushSave();
    const ch = novel?.chapters.find((c) => c.id === chapterId);
    if (ch) {
      setActiveChapterId(ch.id);
      setContent(ch.content ?? "");
      contentRef.current = ch.content ?? "";
      isDirtyRef.current = false;
      setSaveStatus("idle");
    }
  };

  const handleCreateChapter = async () => {
    if (!novel || !newChapterTitle.trim()) return;
    await flushSave();
    try {
      const newCh = await createChapter(novel.id, { title: newChapterTitle.trim() });
      setNovel((prev) => {
        if (!prev) return prev;
        return { ...prev, chapters: [...prev.chapters, newCh] };
      });
      setActiveChapterId(newCh.id);
      setContent("");
      contentRef.current = "";
      isDirtyRef.current = false;
      setSaveStatus("idle");
      setNewChapterTitle("");
      setNewChapterOpen(false);
      toast.success("Bab baru dibuat");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat bab");
    }
  };

  const handleDeleteChapter = async () => {
    if (!activeChapterId) return;
    await flushSave();
    try {
      await deleteChapter(activeChapterId);
      toast.success("Bab dihapus");

      const updatedNovel = await getNovelById(novelId);
      setNovel(updatedNovel);

      const newChapters = updatedNovel.chapters;
      const deletedIndex = activeIndex;

      let nextActive: Chapter | null = null;
      if (newChapters.length === 0) {
        nextActive = null;
      } else if (deletedIndex >= newChapters.length) {
        nextActive = newChapters[newChapters.length - 1];
      } else {
        nextActive = newChapters[deletedIndex] ?? newChapters[newChapters.length - 1];
      }

      if (nextActive) {
        setActiveChapterId(nextActive.id);
        setContent(nextActive.content ?? "");
        contentRef.current = nextActive.content ?? "";
      } else {
        setActiveChapterId(null);
        setContent("");
        contentRef.current = "";
      }
      isDirtyRef.current = false;
      setSaveStatus("idle");
      setDeleteChapterOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus bab");
    }
  };

  const handleDeleteNovel = async () => {
    if (!novel) return;
    try {
      await deleteNovel(novel.id);
      toast.success("Novel dihapus");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus novel");
    }
  };

  const handleRenameChapter = async () => {
    if (!activeChapterId || !renameChapterTitle.trim()) return;
    try {
      await renameChapter(activeChapterId, renameChapterTitle.trim());
      setNovel((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          chapters: prev.chapters.map((c) =>
            c.id === activeChapterId ? { ...c, title: renameChapterTitle.trim() } : c
          ),
        };
      });
      setRenameChapterOpen(false);
      toast.success("Bab diubah nama");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah nama bab");
    }
  };

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const totalWordCount =
    novel?.chapters.reduce((sum, c) => sum + (c.wordCount ?? 0), 0) ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-sm text-muted-foreground">Memuat novel...</div>
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-muted-foreground">Novel tidak ditemukan.</div>
      </div>
    );
  }

  if (!activeChapter) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-muted-foreground">Bab tidak ditemukan.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Fixed Header Editor */}
      <HeaderEditor
        novelTitle={novel.title}
        chapterOrder={activeChapter.order}
        chapterTitle={activeChapter.title}
        chapters={novel.chapters}
        activeChapterId={activeChapterId}
        onNavigate={handleNavigate}
        onRenameClick={() => {
          setRenameChapterTitle(activeChapter.title);
          setRenameChapterOpen(true);
        }}
        onDeleteClick={() => setDeleteChapterOpen(true)}
        onInfoClick={() => setInfoOpen(true)}
      />

      {/* Main Editor Area */}
      <div className="flex-1 relative">
        <ProgressiveBlur
          position="top"
          backgroundColor="#ffffff"
          height="120px"
          blurAmount="6px"
          className="z-30"
        />

        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Mulai menulis bab ini..."
          className="w-full h-full resize-none border-0 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none text-lg leading-loose bg-white px-8 pt-20 pb-4 scrollbar-hidden"
          style={{
            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            boxShadow: "none",
          }}
        />

        <ProgressiveBlur
          position="bottom"
          backgroundColor="#ffffff"
          height="120px"
          blurAmount="6px"
          className="z-30"
        />

        {/* Save status */}
        <div className="absolute bottom-4 right-6 flex items-center gap-3 text-xs text-muted-foreground pointer-events-none select-none z-10">
          <span className="tabular-nums">{wordCount} kata</span>
          {saveStatus === "saving" && <span>Menyimpan...</span>}
          {saveStatus === "saved" && <span>Tersimpan</span>}
          {saveStatus === "error" && (
            <span className="text-destructive">Gagal menyimpan</span>
          )}
        </div>

        {/* Floating Chapter Navigation Pills */}
        {prevChapter && (
          <button
            onClick={() => handleNavigate(prevChapter.id)}
            className="fixed left-6 md:left-10 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#f8f8f8] hover:bg-[#eeeeee] text-sm font-medium transition-[background-color,scale] duration-150 ease-out active:scale-[0.96] shadow-sm z-10"
          >
            <ChevronLeft className="h-4 w-4" />
            Bab {prevChapter.order}
          </button>
        )}

        {nextChapter ? (
          <button
            onClick={() => handleNavigate(nextChapter.id)}
            className="fixed right-6 md:right-10 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#f8f8f8] hover:bg-[#eeeeee] text-sm font-medium transition-[background-color,scale] duration-150 ease-out active:scale-[0.96] shadow-sm z-10"
          >
            Bab {nextChapter.order}
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => setNewChapterOpen(true)}
            className="fixed right-6 md:right-10 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#f8f8f8] hover:bg-[#eeeeee] text-sm font-medium transition-[background-color,scale] duration-150 ease-out active:scale-[0.96] shadow-sm z-10"
          >
            + Tambah Bab
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Info Novel Dialog */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{novel.title}</DialogTitle>
            <DialogDescription>Detail novel dan metadata.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <h4 className="text-sm font-semibold mb-1">Premis</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {novel.premise}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">Sinopsis</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {novel.synopsis}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">Genre</h4>
              <div className="flex flex-wrap gap-2">
                {novel.genres.map((g) => (
                  <Badge key={g} variant="secondary">
                    {g}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">Karakter</h4>
              {novel.characters.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada karakter.</p>
              ) : (
                <ul className="space-y-2">
                  {novel.characters.map((c) => (
                    <li key={c.id} className="text-sm">
                      <span className="font-medium">{c.name}</span>
                      <p className="text-muted-foreground">{c.description}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">Latar</h4>
              {novel.settings.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada latar.</p>
              ) : (
                <ul className="space-y-2">
                  {novel.settings.map((s) => (
                    <li key={s.id} className="text-sm">
                      <span className="font-medium">{s.name}</span>
                      <p className="text-muted-foreground">{s.description}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">Total Kata</h4>
              <p className="text-sm text-muted-foreground tabular-nums">{totalWordCount} kata</p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteNovelOpen(true)}
              className="transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]"
            >
              Hapus Novel
            </Button>
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                Tutup
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Chapter Dialog */}
      <Dialog open={newChapterOpen} onOpenChange={setNewChapterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bab Baru</DialogTitle>
            <DialogDescription>Masukkan judul untuk bab baru.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder="Judul bab..."
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateChapter();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setNewChapterOpen(false)}>
              Batal
            </Button>
            <Button size="sm" onClick={handleCreateChapter} disabled={!newChapterTitle.trim()} className="transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]">
              Buat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Chapter Dialog */}
      <Dialog open={renameChapterOpen} onOpenChange={setRenameChapterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Nama Bab</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameChapterTitle}
              onChange={(e) => setRenameChapterTitle(e.target.value)}
              placeholder="Nama baru..."
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameChapter();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRenameChapterOpen(false)}>
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleRenameChapter}
              disabled={!renameChapterTitle.trim()}
              className="transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]"
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Chapter Dialog */}
      <Dialog open={deleteChapterOpen} onOpenChange={setDeleteChapterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Bab</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus{" "}
              <strong>
                Bab {activeChapter.order}: {activeChapter.title}
              </strong>
              ? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteChapterOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteChapter} className="transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]">
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Novel Dialog */}
      <Dialog open={deleteNovelOpen} onOpenChange={setDeleteNovelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Novel</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus novel <strong>{novel.title}</strong>? Semua bab, karakter,
              dan latar akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteNovelOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteNovel} className="transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]">
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
