import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { novels } from "@/db/schema";
import { generateNovelWorkflow } from "@/workflows/generate-novel";

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

    if (novel.generationStatus === "generating") {
      return NextResponse.json(
        { error: "Novel is already being generated" },
        { status: 409 }
      );
    }

    if (novel.generationStatus !== "failed") {
      return NextResponse.json(
        { error: "Can only retry failed generations" },
        { status: 409 }
      );
    }

    await db
      .update(novels)
      .set({
        generationStatus: "generating",
      })
      .where(eq(novels.id, novelId));

    const run = await start(generateNovelWorkflow, [novelId]);

    await db
      .update(novels)
      .set({
        workflowRunId: run.runId,
      })
      .where(eq(novels.id, novelId));

    return NextResponse.json({
      success: true,
      runId: run.runId,
      message: "Generation retry started",
    });
  } catch (error) {
    console.error("Failed to retry generation:", error);
    return NextResponse.json(
      { error: "Failed to retry generation" },
      { status: 500 }
    );
  }
}
