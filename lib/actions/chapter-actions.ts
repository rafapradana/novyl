"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, max, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { novels, chapters } from "@/db/schema";
import type { CreateChapterInput } from "@/types/chapter";

function getWordCount(content: string): number {
  return content.split(/\s+/).filter(Boolean).length;
}

async function verifyNovelOwnership(novelId: string, userId: string) {
  const [novel] = await db.select().from(novels).where(eq(novels.id, novelId)).limit(1);
  if (!novel) throw new Error("Novel not found");
  if (novel.userId !== userId) throw new Error("Unauthorized");
}

export async function createChapter(novelId: string, data: CreateChapterInput) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const userId = session.user.id;

  try {
    await verifyNovelOwnership(novelId, userId);

    const maxResult = await db
      .select({ maxOrder: max(chapters.order) })
      .from(chapters)
      .where(eq(chapters.novelId, novelId));

    const newOrder = (maxResult[0]?.maxOrder ?? 0) + 1;

    const [chapter] = await db
      .insert(chapters)
      .values({
        novelId,
        title: data.title,
        outline: data.outline ?? null,
        order: newOrder,
      })
      .returning();

    revalidatePath(`/novel/${novelId}`);
    revalidatePath(`/novel/${novelId}/edit`);
    return chapter;
  } catch (error) {
    throw new Error(
      `Failed to create chapter: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function getChaptersByNovel(novelId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const userId = session.user.id;

  try {
    await verifyNovelOwnership(novelId, userId);

    return await db
      .select()
      .from(chapters)
      .where(eq(chapters.novelId, novelId))
      .orderBy(chapters.order);
  } catch (error) {
    throw new Error(
      `Failed to fetch chapters: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function getChapterById(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const userId = session.user.id;

  try {
    const [chapter] = await db.select().from(chapters).where(eq(chapters.id, id)).limit(1);
    if (!chapter) throw new Error("Chapter not found");

    await verifyNovelOwnership(chapter.novelId, userId);

    return chapter;
  } catch (error) {
    throw new Error(
      `Failed to fetch chapter: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function updateChapter(id: string, content: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const userId = session.user.id;

  try {
    const [chapter] = await db.select().from(chapters).where(eq(chapters.id, id)).limit(1);
    if (!chapter) throw new Error("Chapter not found");

    await verifyNovelOwnership(chapter.novelId, userId);

    const wordCount = getWordCount(content);

    await db
      .update(chapters)
      .set({ content, wordCount })
      .where(eq(chapters.id, id));

    revalidatePath(`/novel/${chapter.novelId}`);
    revalidatePath(`/novel/${chapter.novelId}/edit`);
  } catch (error) {
    throw new Error(
      `Failed to update chapter: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function renameChapter(id: string, title: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const userId = session.user.id;

  try {
    const [chapter] = await db.select().from(chapters).where(eq(chapters.id, id)).limit(1);
    if (!chapter) throw new Error("Chapter not found");

    await verifyNovelOwnership(chapter.novelId, userId);

    await db.update(chapters).set({ title }).where(eq(chapters.id, id));

    revalidatePath(`/novel/${chapter.novelId}`);
    revalidatePath(`/novel/${chapter.novelId}/edit`);
  } catch (error) {
    throw new Error(
      `Failed to rename chapter: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function deleteChapter(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const userId = session.user.id;

  try {
    const [chapter] = await db.select().from(chapters).where(eq(chapters.id, id)).limit(1);
    if (!chapter) throw new Error("Chapter not found");

    await verifyNovelOwnership(chapter.novelId, userId);

    const novelId = chapter.novelId;
    const deletedOrder = chapter.order;

    await db.delete(chapters).where(eq(chapters.id, id));

    await db
      .update(chapters)
      .set({ order: sql`${chapters.order} - 1` })
      .where(
        and(eq(chapters.novelId, novelId), sql`${chapters.order} > ${deletedOrder}`)
      );

    revalidatePath(`/novel/${novelId}`);
    revalidatePath(`/novel/${novelId}/edit`);
  } catch (error) {
    throw new Error(
      `Failed to delete chapter: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
