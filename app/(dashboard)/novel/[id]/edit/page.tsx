"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
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
import { GenerationBanner } from "@/components/generation-banner";
import { getNovelById, deleteNovel } from "@/lib/actions/novel-actions";
import {
  updateChapter,
  createChapter,
  deleteChapter,
  renameChapter,
} from "@/lib/actions/chapter-actions";
import type { NovelDetail, GenerationStatus } from "@/types/novel";
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
  const [newChapterOutline, setNewChapterOutline] = useState("");
  const [deleteChapterOpen, setDeleteChapterOpen] = useState(false);
  const [deleteNovelOpen, setDeleteNovelOpen] = useState(false);
  const [renameChapterOpen, setRenameChapterOpen] = useState(false);
  const [renameChapterTitle, setRenameChapterTitle] = useState("");
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>("idle");

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
        setGenerationStatus((data.generationStatus as GenerationStatus) ?? "idle");
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

  const handleGenerationComplete = useCallback(async () => {
    try {
      const data = await getNovelById(novelId);
      setNovel(data);
      const firstChapter = data.chapters[0] ?? null;
      if (firstChapter) {
        setActiveChapterId(firstChapter.id);
        setContent(firstChapter.content ?? "");
        contentRef.current = firstChapter.content ?? "";
      }
      isDirtyRef.current = false;
      setSaveStatus("idle");
      toast.success("Novel selesai di-generate!");
    } catch {
      toast.error("Gagal memuat novel setelah generate");
    }
  }, [novelId]);

  const handleStepComplete = useCallback(
    (data: { step: string; characters?: { id: string; name: string; description: string }[]; settings?: { id: string; name: string; description: string }[]; chapter?: { id: string; content: string; wordCount: number }; blurb?: string; totalWordCount?: number }) => {
      setNovel((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };

        if (data.step === "characters" && data.characters) {
          updated.characters = data.characters.map((c) => ({
            ...c,
            novelId: prev.id,
            createdAt: null,
          }));
        }
        if (data.step === "settings" && data.settings) {
          updated.settings = data.settings.map((s) => ({
            ...s,
            novelId: prev.id,
            createdAt: null,
          }));
        }
        if (data.step === "chapters" && data.chapter) {
          updated.chapters = prev.chapters.map((ch) =>
            ch.id === data.chapter!.id
              ? { ...ch, content: data.chapter!.content, wordCount: data.chapter!.wordCount }
              : ch
          );
          if (data.totalWordCount !== undefined) {
            updated.totalWordCount = data.totalWordCount;
          }
          if (data.chapter.id === activeChapterId) {
            setContent(data.chapter.content);
            contentRef.current = data.chapter.content;
            isDirtyRef.current = false;
          }
        }
        if (data.step === "blurb" && data.blurb) {
          updated.blurb = data.blurb;
        }

        return updated;
      });
    },
    [activeChapterId]
  );

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

  const handleNavigate = useCallback(
    async (chapterId: string) => {
      await flushSave();
      const ch = novel?.chapters.find((c) => c.id === chapterId);
      if (ch) {
        setActiveChapterId(ch.id);
        setContent(ch.content ?? "");
        contentRef.current = ch.content ?? "";
        isDirtyRef.current = false;
        setSaveStatus("idle");
      }
    },
    [novel, flushSave]
  );

  const handleSwipeNavigate = useCallback(
    async (direction: "left" | "right") => {
      if (direction === "left" && nextChapter) {
        setSwipeDirection("left");
        await handleNavigate(nextChapter.id);
      } else if (direction === "right" && prevChapter) {
        setSwipeDirection("right");
        await handleNavigate(prevChapter.id);
      }
      setTimeout(() => setSwipeDirection(null), 300);
    },
    [nextChapter, prevChapter, handleNavigate]
  );

  const handleCreateChapter = async () => {
    if (!novel || !newChapterTitle.trim()) return;
    await flushSave();
    try {
      const newCh = await createChapter(novel.id, {
        title: newChapterTitle.trim(),
        outline: newChapterOutline.trim() || undefined,
      });
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
      setNewChapterOutline("");
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

  const handleRegenerateChapter = async () => {
    if (!activeChapterId || !novel) return;
    await flushSave();
    try {
      const response = await fetch(
        `/api/novels/${novelId}/generate/chapters/${activeChapterId}`,
        { method: "POST" }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.chapter) {
          setContent(data.chapter.content ?? "");
          contentRef.current = data.chapter.content ?? "";
          isDirtyRef.current = false;
          setNovel((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              chapters: prev.chapters.map((ch) =>
                ch.id === activeChapterId ? { ...ch, ...data.chapter } : ch
              ),
              totalWordCount: data.totalWordCount ?? prev.totalWordCount,
            };
          });
        }
        toast.success("Bab berhasil di-generate ulang!");
      } else {
        const data = await response.json();
        toast.error(data.error || "Gagal menulis ulang bab");
      }
    } catch {
      toast.error("Gagal menulis ulang bab");
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
        onDeleteNovelClick={() => setDeleteNovelOpen(true)}
        onRegenerateClick={handleRegenerateChapter}
      />

      {/* Generation Banner */}
      {novel && (
        <GenerationBanner
          novelId={novelId}
          novel={novel}
          generationStatus={generationStatus}
          onStatusChange={setGenerationStatus}
          onGenerationComplete={handleGenerationComplete}
          onStepComplete={handleStepComplete}
        />
      )}

      {/* Main Editor Area */}
      <motion.div
        className="flex-1 relative md:touch-auto"
        style={{ touchAction: "pan-y" }}
        onPanEnd={(_, info) => {
          if (window.innerWidth >= 768) return;
          const threshold = 80;
          if (info.offset.x < -threshold && nextChapter) {
            handleSwipeNavigate("left");
          } else if (info.offset.x > threshold && prevChapter) {
            handleSwipeNavigate("right");
          }
        }}
      >
        <ProgressiveBlur
          position="top"
          backgroundColor="#ffffff"
          height="120px"
          blurAmount="6px"
          className="z-30"
        />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeChapterId ?? "empty"}
            className="w-full h-full"
            initial={
              swipeDirection
                ? { opacity: 0, x: swipeDirection === "left" ? 60 : -60 }
                : { opacity: 1, x: 0 }
            }
            animate={{ opacity: 1, x: 0 }}
            exit={
              swipeDirection
                ? { opacity: 0, x: swipeDirection === "left" ? -60 : 60 }
                : { opacity: 1, x: 0 }
            }
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Mulai menulis bab ini..."
              className="w-full h-full resize-none border-0 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none text-base md:text-lg leading-loose bg-white px-4 sm:px-6 md:px-8 pt-20 pb-32 md:pb-24 scrollbar-hidden"
              style={{
                fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                boxShadow: "none",
              }}
            />
          </motion.div>
        </AnimatePresence>

        <ProgressiveBlur
          position="bottom"
          backgroundColor="#ffffff"
          height="120px"
          blurAmount="6px"
          className="z-30"
        />

        {/* Save status — top-right on mobile, bottom-right on desktop */}
        <div className="absolute top-4 right-4 md:top-auto md:bottom-4 md:right-6 flex items-center gap-3 text-xs text-muted-foreground pointer-events-none select-none z-10">
          <span className="tabular-nums">{wordCount} kata</span>
          {saveStatus === "saving" && <span>Menyimpan...</span>}
          {saveStatus === "saved" && <span>Tersimpan</span>}
          {saveStatus === "error" && (
            <span className="text-destructive">Gagal menyimpan</span>
          )}
        </div>

        {/* Desktop: Floating Chapter Navigation Pills (side) */}
        {prevChapter && (
          <button
            onClick={() => handleNavigate(prevChapter.id)}
            className="hidden md:flex fixed left-6 lg:left-10 top-1/2 -translate-y-1/2 items-center gap-1 px-4 py-2 rounded-full bg-[#f8f8f8] hover:bg-[#eeeeee] text-sm font-medium transition-[background-color,scale] duration-150 ease-out active:scale-[0.96] shadow-sm z-10"
          >
            <ChevronLeft className="h-4 w-4" />
            Bab {prevChapter.order}
          </button>
        )}

        {nextChapter ? (
          <button
            onClick={() => handleNavigate(nextChapter.id)}
            className="hidden md:flex fixed right-6 lg:right-10 top-1/2 -translate-y-1/2 items-center gap-1 px-4 py-2 rounded-full bg-[#f8f8f8] hover:bg-[#eeeeee] text-sm font-medium transition-[background-color,scale] duration-150 ease-out active:scale-[0.96] shadow-sm z-10"
          >
            Bab {nextChapter.order}
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => setNewChapterOpen(true)}
            className="hidden md:flex fixed right-6 lg:right-10 top-1/2 -translate-y-1/2 items-center gap-1 px-4 py-2 rounded-full bg-[#f8f8f8] hover:bg-[#eeeeee] text-sm font-medium transition-[background-color,scale] duration-150 ease-out active:scale-[0.96] shadow-sm z-10"
          >
            + Tambah Bab
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Mobile: Bottom Navigation Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-3 flex items-center justify-between safe-area-pb"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}>
          <button
            onClick={() => prevChapter && handleNavigate(prevChapter.id)}
            disabled={!prevChapter}
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium transition-[background-color,scale] duration-150 ease-out active:scale-[0.96] ${
              prevChapter
                ? "bg-[#f8f8f8] hover:bg-[#eeeeee] text-black"
                : "bg-gray-50 text-gray-300 cursor-not-allowed"
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
            {prevChapter ? `Bab ${prevChapter.order}` : "Awal"}
          </button>

          <span className="text-xs text-muted-foreground font-medium px-1">
            Bab {activeChapter.order}
          </span>

          {nextChapter ? (
            <button
              onClick={() => handleNavigate(nextChapter.id)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-[#f8f8f8] hover:bg-[#eeeeee] text-sm font-medium transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]"
            >
              {`Bab ${nextChapter.order}`}
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => setNewChapterOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-black text-white text-sm font-medium transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]"
            >
              + Baru
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Info Novel Dialog */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-[92vw] sm:max-w-2xl max-h-[85dvh] overflow-y-auto duration-300">
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
              <h4 className="text-sm font-semibold mb-1">Bab</h4>
              {novel.chapters.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada bab.</p>
              ) : (
                <ul className="space-y-3">
                  {novel.chapters.map((ch) => (
                    <li key={ch.id} className="text-sm">
                      <span className="font-medium">Bab {ch.order}: {ch.title}</span>
                      {ch.outline && (
                        <p className="text-muted-foreground mt-0.5 whitespace-pre-wrap">{ch.outline}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">Total Kata</h4>
              <p className="text-sm text-muted-foreground tabular-nums">{totalWordCount} kata</p>
            </div>
            {novel.blurb && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Blurb</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {novel.blurb}
                </p>
              </div>
            )}
            <div>
              <h4 className="text-sm font-semibold mb-1">Status Generasi</h4>
              <div className="flex items-center gap-2">
                {generationStatus === "idle" && (
                  <Badge variant="secondary">Idle</Badge>
                )}
                {generationStatus === "generating" && (
                  <Badge className="bg-blue-100 text-blue-800">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Generating
                  </Badge>
                )}
                {generationStatus === "completed" && (
                  <Badge className="bg-green-100 text-green-800">Selesai</Badge>
                )}
                {generationStatus === "failed" && (
                  <Badge variant="destructive">Gagal</Badge>
                )}
              </div>
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
        <DialogContent className="max-w-[92vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Bab Baru</DialogTitle>
            <DialogDescription>Masukkan judul dan outline untuk bab baru.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Input
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              placeholder="Judul bab..."
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateChapter();
              }}
            />
            <textarea
              value={newChapterOutline}
              onChange={(e) => setNewChapterOutline(e.target.value)}
              placeholder="Outline bab (opsional)..."
              className="w-full resize-none border-0 border-b-2 border-gray-200 bg-transparent px-0 text-sm min-h-[80px] outline-none focus:border-black transition-colors"
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
        <DialogContent className="max-w-[92vw] sm:max-w-lg">
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
        <DialogContent className="max-w-[92vw] sm:max-w-lg">
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
        <DialogContent className="max-w-[92vw] sm:max-w-lg">
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
