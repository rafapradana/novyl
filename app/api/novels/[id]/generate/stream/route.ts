import { headers } from "next/headers";
import { getRun } from "workflow/api";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { novels } from "@/db/schema";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id: novelId } = await params;

    const [novel] = await db
      .select()
      .from(novels)
      .where(eq(novels.id, novelId))
      .limit(1);

    if (!novel) {
      return new Response("Novel not found", { status: 404 });
    }

    if (novel.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 403 });
    }

    if (!novel.workflowRunId) {
      return new Response("No active generation", { status: 404 });
    }

    const run = getRun(novel.workflowRunId);
    const stream = run.getReadable();

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Failed to stream:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
