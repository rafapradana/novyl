import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { novels, characters } from "@/db/schema";
import { ai, MODELS, getErrorMessage } from "@/lib/ai";
import {
  getBlurbGenerationSystemPrompt,
  getBlurbGenerationPrompt,
} from "@/lib/prompts/generate-blurb";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: novelId } = await params;

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

    if (novel.blurb && novel.blurb.trim().length > 0) {
      return NextResponse.json({
        success: true,
        blurb: novel.blurb,
        skipped: true,
      });
    }

    const characterRows = await db
      .select()
      .from(characters)
      .where(eq(characters.novelId, novelId));

    const characterNames = characterRows.map((c) => c.name);

    const systemPrompt = getBlurbGenerationSystemPrompt();
    const userPrompt = getBlurbGenerationPrompt(
      novel.title,
      novel.premise,
      novel.synopsis,
      novel.genres,
      characterNames
    );

    const result = ai.callModel({
      model: MODELS.primary,
      instructions: systemPrompt,
      input: userPrompt,
      temperature: 0.7,
    });

    const blurb = await result.getText();

    const [updatedNovel] = await db
      .update(novels)
      .set({ blurb })
      .where(eq(novels.id, novelId))
      .returning();

    return NextResponse.json({ success: true, blurb: updatedNovel.blurb });
  } catch (error) {
    console.error("Failed to generate blurb:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
