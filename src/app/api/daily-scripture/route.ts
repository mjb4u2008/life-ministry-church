import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getDailyScripture, setDailyScripture } from "@/lib/data";
import { verifyToken } from "@/lib/auth";

const SYSTEM_PROMPT = `You are a daily scripture selector for a Christian church. Pick ONE inspiring, encouraging Bible verse for today.

Respond with valid JSON only:
{
  "verse": "The full verse text",
  "reference": "Book Chapter:Verse",
  "reflection": "One warm, encouraging sentence connecting this verse to daily life"
}

Choose from a wide variety of books. Be warm, hopeful, and uplifting. Do not repeat common verses too often — explore Psalms, Proverbs, Isaiah, Romans, Philippians, James, and others.`;

const FALLBACK_SCRIPTURE = {
  verse: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
  reference: "Jeremiah 29:11",
  reflection:
    "God has beautiful plans for your life, even when you can't see them yet.",
};

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

// GET daily scripture (public)
export async function GET() {
  try {
    const today = getTodayDate();
    const stored = await getDailyScripture();

    // Return cached scripture if it matches today's date
    if (stored.date === today && stored.verse) {
      return NextResponse.json(stored);
    }

    // Generate a new scripture for today
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY not configured");
      const fallback = {
        ...FALLBACK_SCRIPTURE,
        date: today,
        generatedAt: new Date().toISOString(),
        isManualOverride: false,
      };
      return NextResponse.json(fallback);
    }

    try {
      const client = new Anthropic({ apiKey });

      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        temperature: 0.9,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: "Pick today's scripture.",
          },
        ],
      });

      // Extract text from response
      const textContent = response.content.find(
        (block) => block.type === "text"
      );
      const responseText = textContent ? textContent.text : "";

      // Clean markdown formatting (same pattern as /api/ask/route.ts)
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

      const scripture = {
        verse: parsed.verse,
        reference: parsed.reference,
        reflection: parsed.reflection,
        date: today,
        generatedAt: new Date().toISOString(),
        isManualOverride: false,
      };

      // Save to KV
      await setDailyScripture(scripture);

      return NextResponse.json(scripture);
    } catch (aiError) {
      console.error("Anthropic API error:", aiError);
      const fallback = {
        ...FALLBACK_SCRIPTURE,
        date: today,
        generatedAt: new Date().toISOString(),
        isManualOverride: false,
      };
      return NextResponse.json(fallback);
    }
  } catch (error) {
    console.error("Error in GET /api/daily-scripture:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily scripture" },
      { status: 500 }
    );
  }
}

// PUT daily scripture (admin only)
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { verse, reference, reflection } = await request.json();

    if (!verse || !reference || !reflection) {
      return NextResponse.json(
        { error: "verse, reference, and reflection are required" },
        { status: 400 }
      );
    }

    const today = getTodayDate();

    const scripture = {
      verse,
      reference,
      reflection,
      date: today,
      generatedAt: new Date().toISOString(),
      isManualOverride: true,
    };

    await setDailyScripture(scripture);

    return NextResponse.json(scripture);
  } catch (error) {
    console.error("Error in PUT /api/daily-scripture:", error);
    return NextResponse.json(
      { error: "Failed to update daily scripture" },
      { status: 500 }
    );
  }
}
