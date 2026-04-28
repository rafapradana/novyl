"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, count, desc } from "drizzle-orm";
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
          }))
        );
      } else {
        await tx.insert(chapters).values({
          novelId: novel.id,
          title: "Bab 1",
          order: 1,
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
    const rows = await db
      .select({
        novel: novels,
        chapterCount: count(chapters.id),
      })
      .from(novels)
      .leftJoin(chapters, eq(novels.id, chapters.novelId))
      .where(eq(novels.userId, userId))
      .groupBy(novels.id)
      .orderBy(desc(novels.createdAt));

    return rows.map((row) => ({
      ...row.novel,
      chapterCount: Number(row.chapterCount),
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
