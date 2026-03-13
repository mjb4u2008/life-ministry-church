import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifyToken } from "@/lib/auth";

const SYSTEM_PROMPT = `You are a creative church flyer copywriter for L.I.F.E. Ministry (Lord Is Forever Emmanuel). Given a sermon title, scripture reference, and optional description, generate polished text for a church service flyer.

Respond with valid JSON only:
{
  "headline": "A compelling 3-6 word headline",
  "subheadline": "A powerful one-line hook or question",
  "scripture_text": "The actual verse text (quote accurately)",
  "scripture_ref": "Book Chapter:Verse",
  "details": "L.I.F.E. Ministry | Sunday 10:00 AM ET | Online via Google Meet",
  "tagline": "A brief inspiring closing phrase (under 10 words)"
}

Keep it punchy, warm, and inviting. No churchy clich\u00e9s. Make people want to attend.`;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { title, scripture, description } = await request.json();

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!scripture || typeof scripture !== "string" || scripture.trim() === "") {
      return NextResponse.json(
        { error: "Scripture is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY not configured");
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 }
      );
    }

    const client = new Anthropic({ apiKey });

    let userMessage = `Sermon title: "${title.trim()}"\nScripture: ${scripture.trim()}`;
    if (description && typeof description === "string" && description.trim()) {
      userMessage += `\nDescription: ${description.trim()}`;
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      temperature: 0.8,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    // Extract text from response
    const textContent = response.content.find((block) => block.type === "text");
    const responseText = textContent ? textContent.text : "";

    // Parse the JSON response
    // Clean markdown formatting (same pattern as other routes)
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.slice(7);
    }
    if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.slice(3);
    }
    if (cleanedResponse.endsWith("```")) {
      cleanedResponse = cleanedResponse.slice(0, -3);
    }
    cleanedResponse = cleanedResponse.trim();

    const parsed = JSON.parse(cleanedResponse);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Error in /api/flyer:", error);
    return NextResponse.json(
      { error: "Failed to generate flyer text" },
      { status: 500 }
    );
  }
}
