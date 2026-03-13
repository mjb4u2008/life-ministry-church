import { NextRequest, NextResponse } from "next/server";
import { getTestimonies, addTestimony, updateTestimony, deleteTestimony, incrementBlessedCount } from "@/lib/data";
import { verifyToken } from "@/lib/auth";

// GET all testimonies (public gets approved only, admin gets all)
export async function GET(request: NextRequest) {
  try {
    const testimonies = await getTestimonies();

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token && verifyToken(token)) {
      return NextResponse.json({ testimonies });
    }

    // Public: only approved testimonies
    const approved = testimonies.filter((t) => t.approved);
    return NextResponse.json({ testimonies: approved });
  } catch (error) {
    console.error("Error fetching testimonies:", error);
    return NextResponse.json(
      { error: "Failed to fetch testimonies" },
      { status: 500 }
    );
  }
}

// POST new testimony (public)
export async function POST(request: NextRequest) {
  try {
    const { name, text, isAnonymous } = await request.json();

    if (!text || text.trim() === "") {
      return NextResponse.json(
        { error: "Testimony text is required" },
        { status: 400 }
      );
    }

    const newTestimony = await addTestimony({
      name: isAnonymous ? "Anonymous" : (name || "Anonymous"),
      text: text.trim(),
      isAnonymous: isAnonymous || false,
    });

    return NextResponse.json(newTestimony, { status: 201 });
  } catch (error) {
    console.error("Error adding testimony:", error);
    return NextResponse.json(
      { error: "Failed to add testimony" },
      { status: 500 }
    );
  }
}

// DELETE testimony (requires auth)
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
        { error: "Testimony ID is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteTestimony(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Testimony not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting testimony:", error);
    return NextResponse.json(
      { error: "Failed to delete testimony" },
      { status: 500 }
    );
  }
}

// PATCH to update testimony - increment blessedCount (public) or full update (admin)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, increment, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Testimony ID is required" },
        { status: 400 }
      );
    }

    // If only incrementing blessed count (public action)
    if (increment) {
      const updatedTestimony = await incrementBlessedCount(id);
      if (!updatedTestimony) {
        return NextResponse.json(
          { error: "Testimony not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(updatedTestimony);
    }

    // Full update requires authentication
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const updatedTestimony = await updateTestimony(id, updates);

    if (!updatedTestimony) {
      return NextResponse.json(
        { error: "Testimony not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedTestimony);
  } catch (error) {
    console.error("Error updating testimony:", error);
    return NextResponse.json(
      { error: "Failed to update testimony" },
      { status: 500 }
    );
  }
}
