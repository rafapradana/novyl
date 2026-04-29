"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GenerationStatus } from "@/types/novel";

interface GenerationBannerProps {
  novelId: string;
  generationStatus: GenerationStatus;
  onStatusChange: (status: GenerationStatus) => void;
  onContentUpdate: (chapterOrder: number, content: string) => void;
  onGenerationComplete: () => void;
}

interface WorkflowProgress {
  type: "progress" | "content" | "chapter-complete" | "complete" | "error";
  chapter?: number;
  total?: number;
  status?: string;
  delta?: string;
  wordCount?: number;
  totalWordCount?: number;
  blurb?: string;
  error?: string;
}

export function GenerationBanner({
  novelId,
  generationStatus,
  onStatusChange,
  onContentUpdate,
  onGenerationComplete,
}: GenerationBannerProps) {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [totalChapters, setTotalChapters] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (generationStatus !== "generating") {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const eventSource = new EventSource(
      `/api/novels/${novelId}/generate/stream`
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data: WorkflowProgress = JSON.parse(event.data);

        switch (data.type) {
          case "progress":
            if (data.chapter) setCurrentChapter(data.chapter);
            if (data.total) setTotalChapters(data.total);
            if (data.status) setStatusMessage(data.status);
            break;

          case "content":
            if (data.chapter && data.delta) {
              setStreamingContent((prev) => prev + data.delta);
              onContentUpdate(data.chapter, data.delta);
            }
            break;

          case "chapter-complete":
            if (data.chapter) {
              setStreamingContent("");
              setStatusMessage(`Bab ${data.chapter} selesai (${data.wordCount?.toLocaleString("id-ID")} kata)`);
            }
            break;

          case "complete":
            onStatusChange("completed");
            onGenerationComplete();
            eventSource.close();
            break;

          case "error":
            setError(data.error || "Terjadi kesalahan");
            onStatusChange("failed");
            eventSource.close();
            break;
        }
      } catch (err) {
        console.error("Failed to parse SSE data:", err);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      eventSourceRef.current = null;
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [novelId, generationStatus, onStatusChange, onContentUpdate, onGenerationComplete]);

  const handleCancel = async () => {
    try {
      const response = await fetch(
        `/api/novels/${novelId}/generate/cancel`,
        { method: "POST" }
      );

      if (response.ok) {
        onStatusChange("idle");
        setStatusMessage("");
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || "Gagal membatalkan");
      }
    } catch {
      setError("Gagal membatalkan generasi");
    }
  };

  const handleRetry = async () => {
    try {
      setError(null);
      setStreamingContent("");
      setCurrentChapter(0);

      const response = await fetch(
        `/api/novels/${novelId}/generate/retry`,
        { method: "POST" }
      );

      if (response.ok) {
        onStatusChange("generating");
      } else {
        const data = await response.json();
        setError(data.error || "Gagal mencoba ulang");
      }
    } catch {
      setError("Gagal mencoba ulang generasi");
    }
  };

  if (generationStatus === "idle") {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full"
      >
        {generationStatus === "generating" && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-blue-900 truncate">
                      {statusMessage || "AI sedang menulis novel kamu..."}
                    </p>
                    {totalChapters > 0 && (
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
                  onClick={handleCancel}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 shrink-0"
                >
                  <X className="h-4 w-4 mr-1" />
                  Batal
                </Button>
              </div>
            </div>
          </div>
        )}

        {generationStatus === "completed" && (
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
                  onClick={() => onStatusChange("idle")}
                  className="ml-auto text-green-600 hover:text-green-800 hover:bg-green-100"
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        )}

        {generationStatus === "failed" && (
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
                    onClick={() => onStatusChange("idle")}
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
