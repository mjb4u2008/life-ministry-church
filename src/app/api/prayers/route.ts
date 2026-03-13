import { NextRequest, NextResponse } from "next/server";
import { getPrayers, addPrayer, deletePrayer, incrementPrayerCount, updatePrayer } from "@/lib/data";
import { verifyToken } from "@/lib/auth";

// GET all prayers (public)
export async function GET() {
  try {
    const prayers = await getPrayers();
    return NextResponse.json({ prayers });
  } catch (error) {
    console.error("Error fetching prayers:", error);
    return NextResponse.json(
      { error: "Failed to fetch prayers" },
      { status: 500 }
    );
  }
}

// POST new prayer (public)
export async function POST(request: NextRequest) {
  try {
    const { name, request: prayerRequest, isAnonymous } = await request.json();

    if (!prayerRequest || prayerRequest.trim() === "") {
      return NextResponse.json(
        { error: "Prayer request is required" },
        { status: 400 }
      );
    }

    const newPrayer = await addPrayer({
      name: isAnonymous ? "Anonymous" : (name || "Anonymous"),
      request: prayerRequest.trim(),
      isAnonymous: isAnonymous || false,
    });

    return NextResponse.json(newPrayer, { status: 201 });
  } catch (error) {
    console.error("Error adding prayer:", error);
    return NextResponse.json(
      { error: "Failed to add prayer" },
      { status: 500 }
    );
  }
}

// DELETE prayer (requires auth)
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
        { error: "Prayer ID is required" },
        { status: 400 }
      );
    }

    const deleted = await deletePrayer(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Prayer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting prayer:", error);
    return NextResponse.json(
      { error: "Failed to delete prayer" },
      { status: 500 }
    );
  }
}

// PATCH to update prayer - increment count (public) or full update (admin)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, increment, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Prayer ID is required" },
        { status: 400 }
      );
    }

    // If only incrementing prayer count (public action)
    if (increment) {
      const updatedPrayer = await incrementPrayerCount(id);
      if (!updatedPrayer) {
        return NextResponse.json(
          { error: "Prayer not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(updatedPrayer);
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

    const updatedPrayer = await updatePrayer(id, updates);

    if (!updatedPrayer) {
      return NextResponse.json(
        { error: "Prayer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedPrayer);
  } catch (error) {
    console.error("Error updating prayer:", error);
    return NextResponse.json(
      { error: "Failed to update prayer" },
      { status: 500 }
    );
  }
}
