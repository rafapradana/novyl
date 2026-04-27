"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { novels, settings } from "@/db/schema";
import type { CreateSettingInput } from "@/types/setting";

async function verifyNovelOwnership(novelId: string, userId: string) {
  const [novel] = await db.select().from(novels).where(eq(novels.id, novelId)).limit(1);
  if (!novel) throw new Error("Novel not found");
  if (novel.userId !== userId) throw new Error("Unauthorized");
}

export async function addSetting(novelId: string, data: CreateSettingInput) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const userId = session.user.id;

  try {
    await verifyNovelOwnership(novelId, userId);

    const [setting] = await db
      .insert(settings)
      .values({
        novelId,
        name: data.name,
        description: data.description,
      })
      .returning();

    revalidatePath(`/novel/${novelId}`);
    revalidatePath(`/novel/${novelId}/edit`);
    return setting;
  } catch (error) {
    throw new Error(
      `Failed to add setting: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function getSettingsByNovel(novelId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const userId = session.user.id;

  try {
    await verifyNovelOwnership(novelId, userId);
    return await db.select().from(settings).where(eq(settings.novelId, novelId));
  } catch (error) {
    throw new Error(
      `Failed to fetch settings: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function deleteSetting(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  const userId = session.user.id;

  try {
    const [setting] = await db.select().from(settings).where(eq(settings.id, id)).limit(1);
    if (!setting) throw new Error("Setting not found");

    await verifyNovelOwnership(setting.novelId, userId);

    await db.delete(settings).where(eq(settings.id, id));
    revalidatePath(`/novel/${setting.novelId}`);
    revalidatePath(`/novel/${setting.novelId}/edit`);
  } catch (error) {
    throw new Error(
      `Failed to delete setting: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
