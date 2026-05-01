import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { novels, chapters, characters, settings } from "@/db/schema";
import { ai, MODELS, getErrorMessage } from "@/lib/ai";
import {
  getChapterWritingSystemPrompt,
  getChapterWritingPrompt,
} from "@/lib/prompts/write-chapter";
import {
  buildChapterContext,
  type NovelContext,
  type ChapterInfo,
} from "@/lib/prompts/context-builder";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: novelId, chapterId } = await params;

    const [novel] = await db
      .select()
      .from(novels)
      .where(eq(novels.id, novelId))
      .limit(1);

    if (!novel) {
      return NextResponse.json({ error: "Novel not found" }, { status: 404 });
    }

    if (novel.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [chapter] = await db
      .select()
      .from(chapters)
      .where(eq(chapters.id, chapterId))
      .limit(1);

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    if (chapter.novelId !== novelId) {
      return NextResponse.json(
        { error: "Chapter does not belong to this novel" },
        { status: 403 }
      );
    }

    if (chapter.content && chapter.content.trim().length > 0) {
      return NextResponse.json({
        success: true,
        chapter,
        skipped: true,
      });
    }

    const [characterRows, settingRows, allChapters] = await Promise.all([
      db.select().from(characters).where(eq(characters.novelId, novelId)),
      db.select().from(settings).where(eq(settings.novelId, novelId)),
      db
        .select()
        .from(chapters)
        .where(eq(chapters.novelId, novelId))
        .orderBy(chapters.order),
    ]);

    const novelContext: NovelContext = {
      title: novel.title,
      premise: novel.premise,
      synopsis: novel.synopsis,
      genres: novel.genres,
      characters: characterRows.map((c) => ({
        name: c.name,
        description: c.description,
      })),
      settings: settingRows.map((s) => ({
        name: s.name,
        description: s.description,
      })),
    };

    const previousChapters: ChapterInfo[] = [];
    for (const ch of allChapters) {
      if (ch.id === chapterId) break;
      previousChapters.push({
        id: ch.id,
        order: ch.order,
        title: ch.title,
        outline: ch.outline,
        content: ch.content,
      });
    }

    const currentChapterInfo: ChapterInfo = {
      id: chapter.id,
      order: chapter.order,
      title: chapter.title,
      outline: chapter.outline,
      content: chapter.content,
    };

    const context = buildChapterContext(
      novelContext,
      currentChapterInfo,
      previousChapters
    );
    const systemPrompt = getChapterWritingSystemPrompt();
    const userPrompt = getChapterWritingPrompt(
      context,
      chapter.targetWordCountMin ?? 2000,
      chapter.targetWordCountMax ?? 3500
    );

    const result = ai.callModel({
      model: MODELS.primary,
      instructions: systemPrompt,
      input: userPrompt,
      temperature: 0.7,
      maxOutputTokens: Math.ceil((chapter.targetWordCountMax ?? 3500) * 2),
    });

    const content = await result.getText();
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    const [updatedChapter] = await db
      .update(chapters)
      .set({ content, wordCount })
      .where(eq(chapters.id, chapterId))
      .returning();

    const updatedChapters = await db
      .select()
      .from(chapters)
      .where(eq(chapters.novelId, novelId));

    const totalWordCount = updatedChapters.reduce(
      (sum, ch) => sum + (ch.wordCount ?? 0),
      0
    );

    await db
      .update(novels)
      .set({ totalWordCount })
      .where(eq(novels.id, novelId));

    return NextResponse.json({
      success: true,
      chapter: updatedChapter,
      totalWordCount,
    });
  } catch (error) {
    console.error("Failed to generate chapter:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
