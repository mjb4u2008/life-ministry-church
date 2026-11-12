import { NextRequest, NextResponse } from "next/server";
import { getContent, getAdminContent, updateContent } from "@/lib/data";
import { verifyToken } from "@/lib/auth";
import { validateWednesdayContent, WednesdayValidationError } from "@/lib/wednesday-content";

// GET content (public)
export async function GET(request: NextRequest) {
  try {
    if (request.nextUrl.searchParams.get("admin") === "1") {
      const authHeader = request.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      if (!token || !verifyToken(token)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      return NextResponse.json(await getAdminContent(), { headers: { "Cache-Control": "no-store" } });
    }
    const content = await getContent();
    return NextResponse.json(content, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const updates = validateWednesdayContent(await request.json());
    const updatedContent = await updateContent(updates);

    return NextResponse.json(updatedContent);
  } catch (error) {
    if (error instanceof WednesdayValidationError || error instanceof SyntaxError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("Error updating content:", error);
    return NextResponse.json(
      { error: "Failed to update content" },
      { status: 500 }
    );
  }
}
