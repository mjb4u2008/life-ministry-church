import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a Scripture guide for L.I.F.E. Ministry. When someone shares what's on their heart, you respond with ONE focused, complete response.

YOUR RESPONSE FORMAT (follow exactly):

You must respond with valid JSON in this exact structure:
{
  "scripture": {
    "text": "The full verse text here...",
    "reference": "Book Chapter:Verse"
  },
  "story": "2-3 sentence connection here...",
  "exploreMore": [
    { "reference": "Book Chapter:Verse", "description": "One sentence description" },
    { "reference": "Book Chapter:Verse", "description": "One sentence description" },
    { "reference": "Book Chapter:Verse", "description": "One sentence description" }
  ]
}

INSTRUCTIONS:

1. PRIMARY SCRIPTURE
- Choose ONE verse or short passage (2-4 verses max) that directly speaks to their situation
- Provide the FULL text of the verse in the "text" field
- Include the reference (e.g., "Philippians 4:6-7") in the "reference" field

2. THE STORY (2-3 sentences only)
- Connect this Scripture to their specific situation
- You may include brief context: who wrote it, what they were facing, why it matters
- Tone: warm, gentle, relatable — like a wise friend sharing insight
- Do NOT preach or lecture

3. EXPLORE MORE
- List exactly 3 related Scripture references in the "exploreMore" array
- Each object has "reference" and "description" fields
- Choose verses that offer different angles on the same theme

IMPORTANT RULES:
- Do NOT ask follow-up questions
- Do NOT offer to continue the conversation
- Do NOT give generic advice — lead with Scripture
- Keep "story" section SHORT — the Scripture is the star
- Be warm but concise
- ONLY respond with valid JSON, no other text before or after
- If someone expresses thoughts of self-harm, include crisis resources (988 Lifeline) in the story section while still providing Scripture about hope`;

interface ScriptureResponse {
  scripture: {
    text: string;
    reference: string;
  };
  story: string;
  exploreMore: {
    reference: string;
    description: string;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string" || message.trim() === "") {
      return NextResponse.json(
        { error: "Message is required" },
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

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: message.trim(),
        },
      ],
    });

    // Extract text from response
    const textContent = response.content.find((block) => block.type === "text");
    const responseText = textContent ? textContent.text : "";

    // Parse the JSON response
    try {
      // Clean the response in case there's any markdown formatting
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

      const parsed: ScriptureResponse = JSON.parse(cleanedResponse);

      // Validate the structure
      if (!parsed.scripture?.text || !parsed.scripture?.reference) {
        throw new Error("Invalid scripture structure");
      }
      if (!parsed.story) {
        throw new Error("Missing story");
      }
      if (!Array.isArray(parsed.exploreMore) || parsed.exploreMore.length < 1) {
        throw new Error("Invalid exploreMore structure");
      }

      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error("Failed to parse LLM response:", parseError, responseText);

      // Fallback: return a default structure if parsing fails
      return NextResponse.json({
        scripture: {
          text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
          reference: "Proverbs 3:5-6",
        },
        story: "Sometimes when we're searching for answers, the first step is simply trusting that God sees us and knows our situation. This ancient wisdom reminds us that we don't have to figure everything out on our own.",
        exploreMore: [
          { reference: "Psalm 46:10", description: "Be still and know God's presence" },
          { reference: "Isaiah 41:10", description: "God's promise to strengthen us" },
          { reference: "Jeremiah 29:11", description: "God's plans for your future" },
        ],
      });
    }
  } catch (error) {
    console.error("Error in /api/ask:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
