import type { Novel as NovelSchema, Character, Setting, Chapter } from "@/db/schema";
import type { CreateCharacterInput } from "@/types/character";
import type { CreateSettingInput } from "@/types/setting";
import type { CreateChapterInput } from "@/types/chapter";

export type Novel = NovelSchema;

export type GenerationStatus = "idle" | "generating" | "completed" | "failed";

export interface CreateNovelInput {
  title: string;
  premise: string;
  synopsis: string;
  genres: string[];
  characters?: CreateCharacterInput[];
  settings?: CreateSettingInput[];
  chapters: CreateChapterInput[];
}

export interface UpdateNovelInput {
  title?: string;
  premise?: string;
  synopsis?: string;
  genres?: string[];
  blurb?: string;
  generationStatus?: GenerationStatus;
  workflowRunId?: string;
}

export interface NovelWithMeta extends Novel {
  chapterCount: number;
}

export interface NovelDetail extends Novel {
  characters: Character[];
  settings: Setting[];
  chapters: Chapter[];
}
