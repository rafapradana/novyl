import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getWorld } from "workflow/runtime";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { novels } from "@/db/schema";

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

    if (!novel.workflowRunId) {
      return NextResponse.json(
        { error: "No active generation to cancel" },
        { status: 404 }
      );
    }

    if (novel.generationStatus !== "generating") {
      return NextResponse.json(
        { error: "Novel is not being generated" },
        { status: 409 }
      );
    }

    const world = await getWorld();
    await world.events.create(novel.workflowRunId, {
      eventType: "run_cancelled",
    });

    await db
      .update(novels)
      .set({
        generationStatus: "idle",
        workflowRunId: null,
      })
      .where(eq(novels.id, novelId));

    return NextResponse.json({
      success: true,
      message: "Generation cancelled",
    });
  } catch (error) {
    console.error("Failed to cancel generation:", error);
    return NextResponse.json(
      { error: "Failed to cancel generation" },
      { status: 500 }
    );
  }
}
