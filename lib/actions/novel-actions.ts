"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, count, desc, inArray, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { novels, characters, settings, chapters } from "@/db/schema";
import type { CreateNovelInput, UpdateNovelInput } from "@/types/novel";
import type { CreateCharacterInput } from "@/types/character";
import type { CreateSettingInput } from "@/types/setting";

export async function createNovel(data: CreateNovelInput) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const userId = session.user.id;

  let novelId: string;

  try {
    const result = await db.transaction(async (tx) => {
      const [novel] = await tx
        .insert(novels)
        .values({
          userId,
          title: data.title,
          premise: data.premise,
          synopsis: data.synopsis,
          genres: data.genres,
        })
        .returning();

      if (!novel) throw new Error("Failed to create novel");

      if (data.characters && data.characters.length > 0) {
        await tx.insert(characters).values(
          data.characters.map((c: CreateCharacterInput) => ({
            novelId: novel.id,
            name: c.name,
            description: c.description,
          }))
        );
      }

      if (data.settings && data.settings.length > 0) {
        await tx.insert(settings).values(
          data.settings.map((s: CreateSettingInput) => ({
            novelId: novel.id,
            name: s.name,
            description: s.description,
          }))
        );
      }

      if (data.chapters && data.chapters.length > 0) {
        await tx.insert(chapters).values(
          data.chapters.map((ch, i) => ({
            novelId: novel.id,
            title: ch.title,
            outline: ch.outline ?? null,
            order: i + 1,
            targetWordCountMin: ch.targetWordCountMin ?? 2000,
            targetWordCountMax: ch.targetWordCountMax ?? 3500,
          }))
        );
      } else {
        await tx.insert(chapters).values({
          novelId: novel.id,
          title: "Bab 1",
          order: 1,
          targetWordCountMin: 2000,
          targetWordCountMax: 3500,
        });
      }

      return novel;
    });

    novelId = result.id;
  } catch (error) {
    throw new Error(
      `Failed to create novel: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  revalidatePath("/novels");
  redirect(`/novel/${novelId}/edit`);
}

export async function getNovelsByUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const userId = session.user.id;

  try {
    const userNovels = await db
      .select()
      .from(novels)
      .where(eq(novels.userId, userId))
      .orderBy(desc(novels.createdAt));

    if (userNovels.length === 0) return [];

    const novelIds = userNovels.map((n) => n.id);

    const [chapterCounts, characterCounts, settingCounts, chaptersWithContentCounts] =
      await Promise.all([
        db
          .select({ novelId: chapters.novelId, count: count() })
          .from(chapters)
          .where(inArray(chapters.novelId, novelIds))
          .groupBy(chapters.novelId),
        db
          .select({ novelId: characters.novelId, count: count() })
          .from(characters)
          .where(inArray(characters.novelId, novelIds))
          .groupBy(characters.novelId),
        db
          .select({ novelId: settings.novelId, count: count() })
          .from(settings)
          .where(inArray(settings.novelId, novelIds))
          .groupBy(settings.novelId),
        db
          .select({ novelId: chapters.novelId, count: count() })
          .from(chapters)
          .where(
            and(
              inArray(chapters.novelId, novelIds),
              sql`${chapters.content} is not null and ${chapters.content} != ''`
            )
          )
          .groupBy(chapters.novelId),
      ]);

    const chapterCountMap = new Map(
      chapterCounts.map((r) => [r.novelId, Number(r.count)])
    );
    const characterCountMap = new Map(
      characterCounts.map((r) => [r.novelId, Number(r.count)])
    );
    const settingCountMap = new Map(
      settingCounts.map((r) => [r.novelId, Number(r.count)])
    );
    const chaptersWithContentMap = new Map(
      chaptersWithContentCounts.map((r) => [r.novelId, Number(r.count)])
    );

    const isActuallyComplete = (novel: typeof userNovels[number]) => {
      const charCount = characterCountMap.get(novel.id) ?? 0;
      const settCount = settingCountMap.get(novel.id) ?? 0;
      const chTotal = chapterCountMap.get(novel.id) ?? 0;
      const chWithContent = chaptersWithContentMap.get(novel.id) ?? 0;
      return (
        charCount > 0 &&
        settCount > 0 &&
        chTotal > 0 &&
        chWithContent === chTotal &&
        !!novel.blurb &&
        novel.blurb.trim().length > 0
      );
    };

    const staleIds = userNovels
      .filter((n) => n.generationStatus === "generating" && isActuallyComplete(n))
      .map((n) => n.id);

    if (staleIds.length > 0) {
      await db
        .update(novels)
        .set({ generationStatus: "completed" })
        .where(inArray(novels.id, staleIds));
    }

    return userNovels.map((novel) => ({
      ...novel,
      chapterCount: chapterCountMap.get(novel.id) ?? 0,
      characterCount: characterCountMap.get(novel.id) ?? 0,
      settingCount: settingCountMap.get(novel.id) ?? 0,
      chaptersWithContent: chaptersWithContentMap.get(novel.id) ?? 0,
      generationStatus:
        staleIds.includes(novel.id) ? "completed" : novel.generationStatus,
    }));
  } catch (error) {
    throw new Error(
      `Failed to fetch novels: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function getNovelById(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const userId = session.user.id;

  try {
    const [novel] = await db.select().from(novels).where(eq(novels.id, id)).limit(1);
    if (!novel) throw new Error("Novel not found");
    if (novel.userId !== userId) throw new Error("Unauthorized");

    const [characterRows, settingRows, chapterRows] = await Promise.all([
      db.select().from(characters).where(eq(characters.novelId, id)),
      db.select().from(settings).where(eq(settings.novelId, id)),
      db.select().from(chapters).where(eq(chapters.novelId, id)).orderBy(chapters.order),
    ]);

    return {
      ...novel,
      characters: characterRows,
      settings: settingRows,
      chapters: chapterRows,
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch novel: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function updateNovel(id: string, data: UpdateNovelInput) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const userId = session.user.id;

  try {
    const [existing] = await db.select().from(novels).where(eq(novels.id, id)).limit(1);
    if (!existing) throw new Error("Novel not found");
    if (existing.userId !== userId) throw new Error("Unauthorized");

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.premise !== undefined) updateData.premise = data.premise;
    if (data.synopsis !== undefined) updateData.synopsis = data.synopsis;
    if (data.genres !== undefined) updateData.genres = data.genres;

    if (Object.keys(updateData).length > 0) {
      await db.update(novels).set(updateData).where(eq(novels.id, id));
    }

    revalidatePath(`/novel/${id}`);
    revalidatePath(`/novel/${id}/edit`);
    revalidatePath("/novels");
  } catch (error) {
    throw new Error(
      `Failed to update novel: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function deleteNovel(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const userId = session.user.id;

  try {
    const [existing] = await db.select().from(novels).where(eq(novels.id, id)).limit(1);
    if (!existing) throw new Error("Novel not found");
    if (existing.userId !== userId) throw new Error("Unauthorized");

    await db.delete(novels).where(eq(novels.id, id));
    revalidatePath("/novels");
  } catch (error) {
    throw new Error(
      `Failed to delete novel: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
