"use client";

import { useState, useRef, useCallback } from "react";
import type { NovelDetail, GenerationStatus } from "@/types/novel";

export type GenerationStep =
  | "idle"
  | "characters"
  | "settings"
  | "chapters"
  | "blurb"
  | "completed"
  | "failed";

export interface StepCompleteData {
  step: GenerationStep;
  characters?: { id: string; name: string; description: string; createdAt?: Date | null; novelId?: string }[];
  settings?: { id: string; name: string; description: string; createdAt?: Date | null; novelId?: string }[];
  chapter?: { id: string; content: string; wordCount: number };
  blurb?: string;
  totalWordCount?: number;
}

interface UseGenerationOptions {
  novelId: string;
  novel: NovelDetail;
  onStatusChange: (status: GenerationStatus) => void;
  onComplete: () => void;
  onStepComplete?: (data: StepCompleteData) => void;
}

interface UseGenerationReturn {
  step: GenerationStep;
  currentChapter: number;
  totalChapters: number;
  error: string | null;
  isGenerating: boolean;
  startGeneration: () => Promise<void>;
  cancelGeneration: () => Promise<void>;
}

export function useGeneration({
  novelId,
  novel,
  onStatusChange,
  onComplete,
  onStepComplete,
}: UseGenerationOptions): UseGenerationReturn {
  const [step, setStep] = useState<GenerationStep>("idle");
  const [currentChapter, setCurrentChapter] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);

  const totalChapters = novel.chapters.length;

  const isGenerating = step !== "idle" && step !== "completed" && step !== "failed";

  const apiCall = useCallback(
    async (url: string, signal?: AbortSignal) => {
      const response = await fetch(url, { method: "POST", signal });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${response.status})`);
      }
      return response.json();
    },
    []
  );

  const startGeneration = useCallback(async () => {
    if (isGenerating) return;

    const alreadyComplete =
      novel.characters.length > 0 &&
      novel.settings.length > 0 &&
      novel.chapters.every((ch) => ch.content && ch.content.trim().length > 0) &&
      novel.blurb;

    if (alreadyComplete) {
      setStep("completed");
      onStatusChange("completed");
      onComplete();
      return;
    }

    setError(null);
    cancelledRef.current = false;
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    try {
      onStatusChange("generating");

      await apiCall(`/api/novels/${novelId}/generate`, signal);

      if (cancelledRef.current) return;
      setStep("characters");
      const charResult = await apiCall(`/api/novels/${novelId}/generate/characters`, signal);
      if (onStepComplete && charResult.characters) {
        onStepComplete({ step: "characters", characters: charResult.characters });
      }

      if (cancelledRef.current) return;
      setStep("settings");
      const settResult = await apiCall(`/api/novels/${novelId}/generate/settings`, signal);
      if (onStepComplete && settResult.settings) {
        onStepComplete({ step: "settings", settings: settResult.settings });
      }

      if (cancelledRef.current) return;
      setStep("chapters");

      for (let i = 0; i < novel.chapters.length; i++) {
        if (cancelledRef.current) return;

        const ch = novel.chapters[i];
        if (ch.content && ch.content.trim().length > 0) {
          continue;
        }

        setCurrentChapter(i + 1);
        const chResult = await apiCall(
          `/api/novels/${novelId}/generate/chapters/${ch.id}`,
          signal
        );
        if (onStepComplete && chResult.chapter) {
          onStepComplete({
            step: "chapters",
            chapter: chResult.chapter,
            totalWordCount: chResult.totalWordCount,
          });
        }
      }

      if (cancelledRef.current) return;
      setStep("blurb");
      const blurbResult = await apiCall(`/api/novels/${novelId}/generate/blurb`, signal);
      if (onStepComplete && blurbResult.blurb) {
        onStepComplete({ step: "blurb", blurb: blurbResult.blurb });
      }

      if (cancelledRef.current) return;
      setStep("completed");
      onStatusChange("completed");
      onComplete();
    } catch (err) {
      if (cancelledRef.current) return;

      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(message);
      setStep("failed");
      onStatusChange("failed");
    } finally {
      abortRef.current = null;
    }
  }, [
    novelId,
    novel,
    isGenerating,
    onStatusChange,
    onComplete,
    onStepComplete,
    apiCall,
  ]);

  const cancelGeneration = useCallback(async () => {
    cancelledRef.current = true;
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    try {
      await fetch(`/api/novels/${novelId}/generate/cancel`, { method: "POST" });
    } catch {
      // ignore
    }

    setStep("idle");
    setError(null);
    onStatusChange("idle");
  }, [novelId, onStatusChange]);

  return {
    step,
    currentChapter,
    totalChapters,
    error,
    isGenerating,
    startGeneration,
    cancelGeneration,
  };
}
