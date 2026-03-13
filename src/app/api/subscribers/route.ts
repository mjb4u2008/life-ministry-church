import { NextRequest, NextResponse } from "next/server";
import { getSubscribers, addSubscriber, deleteSubscriber } from "@/lib/data";
import { verifyToken } from "@/lib/auth";

// GET all subscribers (requires auth)
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

    const subscribers = await getSubscribers();
    return NextResponse.json({ subscribers });
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscribers" },
      { status: 500 }
    );
  }
}

// POST new subscriber (public)
export async function POST(request: NextRequest) {
  try {
    const { name, contactType, contact } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!contactType || !["email", "phone"].includes(contactType)) {
      return NextResponse.json(
        { error: "Contact type must be email or phone" },
        { status: 400 }
      );
    }

    if (!contact || contact.trim() === "") {
      return NextResponse.json(
        { error: "Contact information is required" },
        { status: 400 }
      );
    }

    // Basic validation
    if (contactType === "email" && !contact.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const newSubscriber = await addSubscriber({
      name: name.trim(),
      contactType,
      contact: contact.trim(),
    });

    return NextResponse.json(newSubscriber, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Already subscribed") {
      return NextResponse.json(
        { error: "You're already signed up for reminders!" },
        { status: 409 }
      );
    }
    console.error("Error adding subscriber:", error);
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}

// DELETE subscriber (requires auth)
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
        { error: "Subscriber ID is required" },
        { status: 400 }
      );
    }

    const deleted = await deleteSubscriber(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Subscriber not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subscriber:", error);
    return NextResponse.json(
      { error: "Failed to delete subscriber" },
      { status: 500 }
    );
  }
}
