import { NextRequest, NextResponse } from "next/server";
import { getContent, updateContent } from "@/lib/data";
import { verifyToken } from "@/lib/auth";

// GET content (public)
export async function GET() {
  try {
    const content = await getContent();
    return NextResponse.json(content);
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

    const updates = await request.json();
    const updatedContent = await updateContent(updates);

    return NextResponse.json(updatedContent);
  } catch (error) {
    console.error("Error updating content:", error);
    return NextResponse.json(
      { error: "Failed to update content" },
      { status: 500 }
    );
  }
}
