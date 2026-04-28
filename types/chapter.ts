import type { Chapter as ChapterSchema } from "@/db/schema";

export type Chapter = ChapterSchema;

export interface CreateChapterInput {
  title: string;
  outline?: string;
  targetWordCountMin?: number;
  targetWordCountMax?: number;
}
