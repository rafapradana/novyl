"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { novels, characters } from "@/db/schema";
import type { CreateCharacterInput } from "@/types/character";

async function verifyNovelOwnership(novelId: string, userId: string) {
  const [novel] = await db.select().from(novels).where(eq(novels.id, novelId)).limit(1);
  if (!novel) throw new Error("Novel not found");
  if (novel.userId !== userId) throw new Error("Unauthorized");
}

export async function addCharacter(novelId: string, data: CreateCharacterInput) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const userId = session.user.id;

  try {
    await verifyNovelOwnership(novelId, userId);

    const [character] = await db
      .insert(characters)
      .values({
        novelId,
        name: data.name,
        description: data.description,
      })
      .returning();

    revalidatePath(`/novel/${novelId}`);
    revalidatePath(`/novel/${novelId}/edit`);
    return character;
  } catch (error) {
    throw new Error(
      `Failed to add character: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function getCharactersByNovel(novelId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const userId = session.user.id;

  try {
    await verifyNovelOwnership(novelId, userId);
    return await db.select().from(characters).where(eq(characters.novelId, novelId));
  } catch (error) {
    throw new Error(
      `Failed to fetch characters: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function deleteCharacter(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const userId = session.user.id;

  try {
    const [character] = await db.select().from(characters).where(eq(characters.id, id)).limit(1);
    if (!character) throw new Error("Character not found");

    await verifyNovelOwnership(character.novelId, userId);

    await db.delete(characters).where(eq(characters.id, id));
    revalidatePath(`/novel/${character.novelId}`);
    revalidatePath(`/novel/${character.novelId}/edit`);
  } catch (error) {
    throw new Error(
      `Failed to delete character: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
