import { convex } from "@/lib/convex-client";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { api } from "../../../../../convex/_generated/api";
import { inngest } from "@/inngest/client";

const requestSchema = z.object({
  url: z.url(),
});

const parseGithubUrl = (url: string) => {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    throw new Error("Invalid GitHub URL");
  }
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ""),
  };
};

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { url } = requestSchema.parse(body);
    const { owner, repo } = parseGithubUrl(url);

    const client = await clerkClient();
    const tokens = await client.users.getUserOauthAccessToken(userId, "github");

    const githubToken = tokens.data[0]?.token;

    if (!githubToken) {
      return NextResponse.json(
        {
          error:
            "GitHub is not connected. Please connect your GitHub account.",
        },
        { status: 400 },
      );
    }
    const internalKey = process.env.POINTER_CONVEX_INTERNAL_KEY;
    if (!internalKey) {
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 },
      );
    }

    const projectId = await convex.mutation(api.system.createProject, {
      internalKey,
      name: repo,
      ownerId: userId,
    });

    await inngest.send({
      name: "github/import.repo",
      data: {
        owner,
        repo,
        githubToken,
        projectId,
      },
    });
    return NextResponse.json({ success: true, projectId });
  } catch (error) {
    console.error("Error importing GitHub repo:", error);
    return NextResponse.json(
      { error: "Failed to import GitHub repository." },
      { status: 500 },
    );
  }
}
