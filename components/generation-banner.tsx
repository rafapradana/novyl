"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGeneration, type StepCompleteData } from "@/hooks/use-generation";
import type { NovelDetail, GenerationStatus } from "@/types/novel";

interface GenerationBannerProps {
  novelId: string;
  novel: NovelDetail;
  generationStatus: GenerationStatus;
  onStatusChange: (status: GenerationStatus) => void;
  onGenerationComplete: () => void;
  onStepComplete?: (data: StepCompleteData) => void;
}

const STEP_LABELS: Record<string, string> = {
  characters: "Menghasilkan karakter...",
  settings: "Menghasilkan latar...",
  chapters: "Menulis bab...",
  blurb: "Menghasilkan blurb...",
};

export function GenerationBanner({
  novelId,
  novel,
  generationStatus,
  onStatusChange,
  onGenerationComplete,
  onStepComplete,
}: GenerationBannerProps) {
  const {
    step,
    currentChapter,
    totalChapters,
    error,
    isGenerating,
    startGeneration,
    cancelGeneration,
  } = useGeneration({
    novelId,
    novel,
    onStatusChange,
    onComplete: onGenerationComplete,
    onStepComplete,
  });

  const autoStartedRef = useRef(false);

  const hasContentToGenerate =
    novel.characters.length === 0 ||
    novel.settings.length === 0 ||
    novel.chapters.some((ch) => !ch.content || ch.content.trim().length === 0) ||
    !novel.blurb;

  useEffect(() => {
    if (
      generationStatus === "generating" &&
      !isGenerating &&
      !autoStartedRef.current
    ) {
      if (!hasContentToGenerate) {
        onStatusChange("completed");
        return;
      }
      autoStartedRef.current = true;
      startGeneration();
    }
  }, [generationStatus, isGenerating, startGeneration, hasContentToGenerate, onStatusChange]);

  const handleStart = () => {
    autoStartedRef.current = true;
    startGeneration();
  };

  const handleRetry = () => {
    autoStartedRef.current = true;
    startGeneration();
  };

  const handleDismiss = () => {
    onStatusChange("idle");
  };

  if (generationStatus === "idle" && !isGenerating) {
    if (!hasContentToGenerate) return null;

    return (
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Sparkles className="h-4 w-4 text-gray-400 shrink-0" />
              <p className="text-sm text-gray-600 truncate">
                Novel belum selesai di-generate
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleStart}
              className="bg-black text-white hover:bg-black/90 shrink-0 transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Generate
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isGenerating ? "generating" : generationStatus}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full"
      >
        {isGenerating && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-blue-900 truncate">
                      {step === "chapters" && currentChapter > 0
                        ? `Menulis Bab ${currentChapter}/${totalChapters}...`
                        : STEP_LABELS[step] || "AI sedang menulis novel kamu..."}
                    </p>
                    {step === "chapters" && totalChapters > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-blue-100 rounded-full max-w-xs">
                          <motion.div
                            className="h-full bg-blue-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(currentChapter / totalChapters) * 100}%`,
                            }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </div>
                        <span className="text-xs text-blue-600 tabular-nums">
                          {currentChapter}/{totalChapters}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelGeneration}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 shrink-0"
                >
                  <X className="h-4 w-4 mr-1" />
                  Batal
                </Button>
              </div>
            </div>
          </div>
        )}

        {generationStatus === "completed" && !isGenerating && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-green-500 rounded-full shrink-0" />
                <p className="text-sm font-medium text-green-900">
                  Novel selesai di-generate!
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="ml-auto text-green-600 hover:text-green-800 hover:bg-green-100"
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        )}

        {generationStatus === "failed" && !isGenerating && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-red-900">
                      Gagal generate novel
                    </p>
                    {error && (
                      <p className="text-xs text-red-600 mt-0.5 truncate">
                        {error}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Coba Lagi
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-red-600 hover:text-red-800 hover:bg-red-100"
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
