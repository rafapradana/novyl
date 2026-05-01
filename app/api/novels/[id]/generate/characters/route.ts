import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { novels, characters } from "@/db/schema";
import { ai, MODELS, getErrorMessage } from "@/lib/ai";
import {
  getCharacterGenerationSystemPrompt,
  getCharacterGenerationPrompt,
} from "@/lib/prompts/generate-characters";

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

    const existingCharacters = await db
      .select()
      .from(characters)
      .where(eq(characters.novelId, novelId));

    if (existingCharacters.length > 0) {
      return NextResponse.json({
        success: true,
        characters: existingCharacters,
        skipped: true,
      });
    }

    const systemPrompt = getCharacterGenerationSystemPrompt();
    const userPrompt = getCharacterGenerationPrompt(
      novel.title,
      novel.premise,
      novel.synopsis,
      novel.genres
    );

    const result = ai.callModel({
      model: MODELS.primary,
      instructions: systemPrompt,
      input: userPrompt,
      temperature: 0.8,
    });

    const text = await result.getText();
    const parsed = JSON.parse(text) as { name: string; description: string }[];

    if (!Array.isArray(parsed)) {
      return NextResponse.json(
        { error: "Invalid AI response format" },
        { status: 500 }
      );
    }

    const inserted = await db
      .insert(characters)
      .values(
        parsed.map((c) => ({
          novelId,
          name: c.name,
          description: c.description,
        }))
      )
      .returning();

    return NextResponse.json({ success: true, characters: inserted });
  } catch (error) {
    console.error("Failed to generate characters:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
