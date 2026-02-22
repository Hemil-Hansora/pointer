import { convex } from "@/lib/convex-client";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";

const requestSchema = z.object({
  projectId: z.string(),
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { projectId } = requestSchema.parse(body);

    const internalKey = process.env.POINTER_CONVEX_INTERNAL_KEY;
    if (!internalKey) {
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 },
      );
    }

    await convex.mutation(api.system.updateExportStatus, {
      internalKey,
      projectId: projectId as Id<"projects">,
      status: undefined,
      repoUrl: undefined,
    });

    return NextResponse.json({
      success: true,
      projectId,
    });
  } catch (error) {
    console.error("Error resetting GitHub export:", error);
    return NextResponse.json(
      { error: "Failed to reset GitHub export." },
      { status: 500 },
    );
  }
}
