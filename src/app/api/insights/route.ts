import { NextRequest, NextResponse } from "next/server";
import { getInsights, deleteInsight } from "@/lib/data";
import { verifyToken } from "@/lib/auth";

// GET all insights (requires auth)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const insights = await getInsights();
    return NextResponse.json({ insights });
  } catch (error) {
    console.error("Error fetching insights:", error);
    return NextResponse.json(
      { error: "Failed to fetch insights" },
      { status: 500 }
    );
  }
}

// DELETE insight (requires auth)
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Insight ID is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteInsight(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Insight not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting insight:", error);
    return NextResponse.json(
      { error: "Failed to delete insight" },
      { status: 500 }
    );
  }
}
