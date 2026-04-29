export interface NovelContext {
  title: string;
  premise: string;
  synopsis: string;
  genres: string[];
  characters: { name: string; description: string }[];
  settings: { name: string; description: string }[];
}

export interface ChapterInfo {
  id?: string;
  order: number;
  title: string;
  outline: string | null;
  content: string | null;
}

export function buildNovelContext(novel: NovelContext): string {
  const parts: string[] = [];

  parts.push(`JUDUL NOVEL: ${novel.title}`);
  parts.push(`GENRE: ${novel.genres.join(", ")}`);
  parts.push(`\nPREMIS:\n${novel.premise}`);
  parts.push(`\nSINOPSIS:\n${novel.synopsis}`);

  if (novel.characters.length > 0) {
    parts.push("\nKARAKTER:");
    novel.characters.forEach((c) => {
      parts.push(`- ${c.name}: ${c.description}`);
    });
  }

  if (novel.settings.length > 0) {
    parts.push("\nLATAR:");
    novel.settings.forEach((s) => {
      parts.push(`- ${s.name}: ${s.description}`);
    });
  }

  return parts.join("\n");
}

export function buildChapterContext(
  novel: NovelContext,
  currentChapter: ChapterInfo,
  previousChapters: ChapterInfo[]
): string {
  const parts: string[] = [];

  parts.push("═══════════════════════════════════════════");
  parts.push("KONTEKS NOVEL");
  parts.push("═══════════════════════════════════════════");
  parts.push(buildNovelContext(novel));

  if (previousChapters.length > 0) {
    parts.push("\n═══════════════════════════════════════════");
    parts.push("BAB-BAB SEBELUMNYA");
    parts.push("═══════════════════════════════════════════");

    previousChapters.forEach((ch) => {
      parts.push(`\n--- BAB ${ch.order}: ${ch.title} ---`);
      if (ch.content) {
        parts.push(ch.content);
      }
    });
  }

  parts.push("\n═══════════════════════════════════════════");
  parts.push("BAB YANG AKAN DITULIS");
  parts.push("═══════════════════════════════════════════");
  parts.push(`Bab ${currentChapter.order}: ${currentChapter.title}`);
  if (currentChapter.outline) {
    parts.push(`\nOutline:\n${currentChapter.outline}`);
  }

  return parts.join("\n");
}

export function buildFullNovelSummary(
  novel: NovelContext,
  allChapters: ChapterInfo[]
): string {
  const parts: string[] = [];

  parts.push("═══════════════════════════════════════════");
  parts.push("RINGKASAN NOVEL LENGKAP");
  parts.push("═══════════════════════════════════════════");
  parts.push(buildNovelContext(novel));

  parts.push("\n═══════════════════════════════════════════");
  parts.push("DAFTAR BAB");
  parts.push("═══════════════════════════════════════════");

  allChapters.forEach((ch) => {
    parts.push(`\nBab ${ch.order}: ${ch.title}`);
    if (ch.outline) {
      parts.push(`  Outline: ${ch.outline}`);
    }
  });

  parts.push("\n═══════════════════════════════════════════");
  parts.push("KONTEN BAB (RINGKASAN)");
  parts.push("═══════════════════════════════════════════");

  allChapters.forEach((ch) => {
    if (ch.content) {
      const summary = ch.content.length > 500
        ? ch.content.substring(0, 500) + "..."
        : ch.content;
      parts.push(`\n--- Bab ${ch.order}: ${ch.title} ---`);
      parts.push(summary);
    }
  });

  return parts.join("\n");
}
