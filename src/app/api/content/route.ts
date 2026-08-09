import { NextRequest, NextResponse } from "next/server";
import { getContent, updateContent } from "@/lib/data";
import { verifyToken } from "@/lib/auth";
import { ContentUpdateValidationError, parseContentUpdate } from "@/lib/content-update";

function json(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function publicContent(content: Awaited<ReturnType<typeof getContent>>) {
  return {
    weeklyMessage: content.weeklyMessage,
    serviceSchedule: content.serviceSchedule,
    lobbyOpen: content.lobbyOpen,
    serviceLive: content.serviceLive,
    socialLinks: content.socialLinks,
    tiktokVideos: content.tiktokVideos,
    youtubeLatestUrl: content.youtubeLatestUrl,
    thisSunday: content.thisSunday,
    contactEmail: content.contactEmail,
    contactPhone: content.contactPhone,
    youtubeVideos: content.youtubeVideos,
    lastUpdated: content.lastUpdated,
  };
}

// GET allowlisted public content or the full authenticated legacy-admin record.
export async function GET(request: NextRequest) {
  try {
    const content = await getContent();
    if (request.nextUrl.searchParams.get("admin") === "1") {
      const authHeader = request.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      if (!token || !verifyToken(token)) return json({ error: "Unauthorized" }, { status: 401 });
      return json(content);
    }
    return json(publicContent(content));
  } catch (error) {
    console.error("Content read failed", error instanceof Error ? error.name : "UnknownError");
    return json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

// PUT/PATCH content (requires auth)
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || !verifyToken(token)) {
      return json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const updates = parseContentUpdate(await request.json());
    const updatedContent = await updateContent(updates);

    return json(updatedContent);
  } catch (error) {
    if (error instanceof ContentUpdateValidationError || error instanceof SyntaxError) {
      return json({ error: error instanceof ContentUpdateValidationError ? error.issues.join(". ") : "Invalid JSON body" }, { status: 400 });
    }
    console.error("Content update failed", error instanceof Error ? error.name : "UnknownError");
    return json(
      { error: "Failed to update content" },
      { status: 500 }
    );
  }
}
