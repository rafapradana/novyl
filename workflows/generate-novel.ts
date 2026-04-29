import { getWritable, FatalError, RetryableError } from "workflow";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { novels, characters, settings, chapters } from "@/db/schema";
import { ai, MODELS, isRetryableError, getErrorMessage } from "@/lib/ai";
import {
  getCharacterGenerationSystemPrompt,
  getCharacterGenerationPrompt,
} from "@/lib/prompts/generate-characters";
import {
  getSettingGenerationSystemPrompt,
  getSettingGenerationPrompt,
} from "@/lib/prompts/generate-settings";
import {
  getChapterWritingSystemPrompt,
  getChapterWritingPrompt,
} from "@/lib/prompts/write-chapter";
import {
  getBlurbGenerationSystemPrompt,
  getBlurbGenerationPrompt,
} from "@/lib/prompts/generate-blurb";
import {
  buildChapterContext,
  type NovelContext,
  type ChapterInfo,
} from "@/lib/prompts/context-builder";

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

async function fetchNovelData(novelId: string) {
  "use step";

  const [novel] = await db.select().from(novels).where(eq(novels.id, novelId)).limit(1);
  if (!novel) throw new FatalError("Novel not found");

  const [characterRows, settingRows, chapterRows] = await Promise.all([
    db.select().from(characters).where(eq(characters.novelId, novelId)),
    db.select().from(settings).where(eq(settings.novelId, novelId)),
    db.select().from(chapters).where(eq(chapters.novelId, novelId)).orderBy(chapters.order),
  ]);

  return {
    novel,
    characters: characterRows,
    settings: settingRows,
    chapters: chapterRows,
  };
}

async function updateNovelStatus(novelId: string, status: string, workflowRunId?: string) {
  "use step";

  const updateData: Record<string, unknown> = {
    generationStatus: status,
  };
  if (workflowRunId !== undefined) {
    updateData.workflowRunId = workflowRunId;
  }

  await db.update(novels).set(updateData).where(eq(novels.id, novelId));
}

async function generateCharactersStep(
  novelId: string,
  novelContext: NovelContext
) {
  "use step";

  const writer = getWritable<WorkflowProgress>().getWriter();
  try {
    await writer.write({
      type: "progress",
      status: "Menghasilkan karakter...",
    });

    const systemPrompt = getCharacterGenerationSystemPrompt();
    const userPrompt = getCharacterGenerationPrompt(
      novelContext.title,
      novelContext.premise,
      novelContext.synopsis,
      novelContext.genres
    );

    const result = ai.callModel({
      model: MODELS.primary,
      instructions: systemPrompt,
      input: userPrompt,
      temperature: 0.8,
    });

    const text = await result.getText();
    const parsed = JSON.parse(text);

    if (!Array.isArray(parsed)) {
      throw new Error("Invalid character generation response");
    }

    await db.insert(characters).values(
      parsed.map((c: { name: string; description: string }) => ({
        novelId,
        name: c.name,
        description: c.description,
      }))
    );

    await writer.write({
      type: "progress",
      status: `${parsed.length} karakter berhasil dihasilkan`,
    });
  } catch (error) {
    if (isRetryableError(error)) {
      throw new RetryableError(`Gagal generate karakter: ${getErrorMessage(error)}`, {
        retryAfter: "1m",
      });
    }
    throw new FatalError(`Gagal generate karakter: ${getErrorMessage(error)}`);
  } finally {
    writer.releaseLock();
  }
}

async function generateSettingsStep(
  novelId: string,
  novelContext: NovelContext
) {
  "use step";

  const writer = getWritable<WorkflowProgress>().getWriter();
  try {
    await writer.write({
      type: "progress",
      status: "Menghasilkan latar...",
    });

    const systemPrompt = getSettingGenerationSystemPrompt();
    const userPrompt = getSettingGenerationPrompt(
      novelContext.title,
      novelContext.premise,
      novelContext.synopsis,
      novelContext.genres
    );

    const result = ai.callModel({
      model: MODELS.primary,
      instructions: systemPrompt,
      input: userPrompt,
      temperature: 0.8,
    });

    const text = await result.getText();
    const parsed = JSON.parse(text);

    if (!Array.isArray(parsed)) {
      throw new Error("Invalid setting generation response");
    }

    await db.insert(settings).values(
      parsed.map((s: { name: string; description: string }) => ({
        novelId,
        name: s.name,
        description: s.description,
      }))
    );

    await writer.write({
      type: "progress",
      status: `${parsed.length} latar berhasil dihasilkan`,
    });
  } catch (error) {
    if (isRetryableError(error)) {
      throw new RetryableError(`Gagal generate latar: ${getErrorMessage(error)}`, {
        retryAfter: "1m",
      });
    }
    throw new FatalError(`Gagal generate latar: ${getErrorMessage(error)}`);
  } finally {
    writer.releaseLock();
  }
}

async function generateChapterStep(
  novelId: string,
  chapter: ChapterInfo,
  novelContext: NovelContext,
  previousChapters: ChapterInfo[],
  targetWordCountMin: number,
  targetWordCountMax: number,
  totalChapters: number
) {
  "use step";

  const writer = getWritable<WorkflowProgress>().getWriter();
  try {
    await writer.write({
      type: "progress",
      chapter: chapter.order,
      total: totalChapters,
      status: `Menulis Bab ${chapter.order}...`,
    });

    const context = buildChapterContext(novelContext, chapter, previousChapters);
    const systemPrompt = getChapterWritingSystemPrompt();
    const userPrompt = getChapterWritingPrompt(context, targetWordCountMin, targetWordCountMax);

    const result = ai.callModel({
      model: MODELS.primary,
      instructions: systemPrompt,
      input: userPrompt,
      temperature: 0.7,
      maxOutputTokens: Math.ceil(targetWordCountMax * 2),
    });

    let fullContent = "";
    for await (const delta of result.getTextStream()) {
      fullContent += delta;
      await writer.write({
        type: "content",
        chapter: chapter.order,
        delta,
      });
    }

    const wordCount = fullContent.split(/\s+/).filter(Boolean).length;

    if (!chapter.id) {
      throw new FatalError("Chapter ID is required for updating content");
    }

    await db
      .update(chapters)
      .set({
        content: fullContent,
        wordCount,
      })
      .where(eq(chapters.id, chapter.id));

    const [novelRow] = await db.select().from(novels).where(eq(novels.id, novelId)).limit(1);
    const currentTotal = novelRow?.totalWordCount ?? 0;
    await db
      .update(novels)
      .set({ totalWordCount: currentTotal + wordCount })
      .where(eq(novels.id, novelId));

    await writer.write({
      type: "chapter-complete",
      chapter: chapter.order,
      wordCount,
    });
  } catch (error) {
    if (isRetryableError(error)) {
      throw new RetryableError(
        `Gagal menulis Bab ${chapter.order}: ${getErrorMessage(error)}`,
        { retryAfter: "2m" }
      );
    }
    throw new FatalError(
      `Gagal menulis Bab ${chapter.order}: ${getErrorMessage(error)}`
    );
  } finally {
    writer.releaseLock();
  }
}

async function generateBlurbStep(
  novelId: string,
  novelContext: NovelContext
) {
  "use step";

  const writer = getWritable<WorkflowProgress>().getWriter();
  try {
    await writer.write({
      type: "progress",
      status: "Menghasilkan blurb...",
    });

    const systemPrompt = getBlurbGenerationSystemPrompt();
    const userPrompt = getBlurbGenerationPrompt(
      novelContext.title,
      novelContext.premise,
      novelContext.synopsis,
      novelContext.genres,
      novelContext.characters.map((c) => c.name)
    );

    const result = ai.callModel({
      model: MODELS.primary,
      instructions: systemPrompt,
      input: userPrompt,
      temperature: 0.7,
    });

    const blurb = await result.getText();

    await db
      .update(novels)
      .set({ blurb })
      .where(eq(novels.id, novelId));

    await writer.write({
      type: "progress",
      status: "Blurb berhasil dihasilkan",
    });

    return blurb;
  } catch (error) {
    if (isRetryableError(error)) {
      throw new RetryableError(`Gagal generate blurb: ${getErrorMessage(error)}`, {
        retryAfter: "1m",
      });
    }
    throw new FatalError(`Gagal generate blurb: ${getErrorMessage(error)}`);
  } finally {
    writer.releaseLock();
  }
}

export async function generateNovelWorkflow(novelId: string) {
  "use workflow";

  const writer = getWritable<WorkflowProgress>().getWriter();

  try {
    await writer.write({
      type: "progress",
      status: "Memulai generasi novel...",
    });

    const data = await fetchNovelData(novelId);
    const novelContext: NovelContext = {
      title: data.novel.title,
      premise: data.novel.premise,
      synopsis: data.novel.synopsis,
      genres: data.novel.genres,
      characters: data.characters.map((c) => ({ name: c.name, description: c.description })),
      settings: data.settings.map((s) => ({ name: s.name, description: s.description })),
    };

    if (data.characters.length === 0) {
      await generateCharactersStep(novelId, novelContext);
      const updatedChars = await fetchNovelData(novelId);
      novelContext.characters = updatedChars.characters.map((c) => ({
        name: c.name,
        description: c.description,
      }));
    }

    if (data.settings.length === 0) {
      await generateSettingsStep(novelId, novelContext);
      const updatedSettings = await fetchNovelData(novelId);
      novelContext.settings = updatedSettings.settings.map((s) => ({
        name: s.name,
        description: s.description,
      }));
    }

    const previousChapters: ChapterInfo[] = [];

    for (const chapter of data.chapters) {
      await generateChapterStep(
        novelId,
        {
          id: chapter.id,
          order: chapter.order,
          title: chapter.title,
          outline: chapter.outline,
          content: chapter.content,
        },
        novelContext,
        previousChapters,
        chapter.targetWordCountMin ?? 2000,
        chapter.targetWordCountMax ?? 3500,
        data.chapters.length
      );

      previousChapters.push({
        id: chapter.id,
        order: chapter.order,
        title: chapter.title,
        outline: chapter.outline,
        content: chapter.content ?? "",
      });
    }

    const blurb = await generateBlurbStep(novelId, novelContext);

    await updateNovelStatus(novelId, "completed");

    const finalData = await fetchNovelData(novelId);

    await writer.write({
      type: "complete",
      totalWordCount: finalData.novel.totalWordCount ?? 0,
      blurb,
    });
  } catch (error) {
    await updateNovelStatus(novelId, "failed");
    await writer.write({
      type: "error",
      error: getErrorMessage(error),
    });
    throw error;
  } finally {
    writer.releaseLock();
  }
}
