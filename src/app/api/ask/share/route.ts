import { NextRequest, NextResponse } from "next/server";
import { addInsight } from "@/lib/data";

export async function POST(request: NextRequest) {
  try {
    const { topic, scripture } = await request.json();

    if (!topic || typeof topic !== "string" || topic.trim() === "") {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    const newInsight = await addInsight({
      topic: topic.trim().substring(0, 200), // Limit topic length
      scripture: scripture?.trim().substring(0, 100) || "", // Optional scripture reference
    });

    return NextResponse.json({ success: true, insight: newInsight }, { status: 201 });
  } catch (error) {
    console.error("Error in /api/ask/share:", error);
    return NextResponse.json(
      { error: "Failed to save insight" },
      { status: 500 }
    );
  }
}
