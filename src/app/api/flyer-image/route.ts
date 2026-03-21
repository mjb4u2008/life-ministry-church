import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const GEMINI_MODEL = "gemini-3-pro-image-preview";

const SYSTEM_PROMPT = `You are a creative church flyer designer for L.I.F.E. Ministry (Lord Is Forever Emmanuel).
Generate a beautiful, eye-catching church flyer image based on the user's request.

The flyer should:
- Look professional and suitable for social media sharing (Instagram, Facebook)
- Include "L.I.F.E. Ministry" branding and "Lord Is Forever Emmanuel" subtitle
- Use warm, inviting colors — whites, sky blues, golds, soft light gradients
- Include relevant spiritual imagery (light rays, crosses, nature, community)
- Have clear, readable text with good hierarchy
- Feel welcoming, spiritual, and modern
- Be sized for social media (square format)
- NOT look generic or clip-art-y — make it look like a real church designed it

When the user asks for edits, modify the flyer based on their feedback while keeping the overall design cohesive.`;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, history } = await request.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return NextResponse.json(
        { error: "Please describe what kind of flyer you want." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_AI_API_KEY not configured");
      return NextResponse.json(
        { error: "Image generation service not configured." },
        { status: 503 }
      );
    }

    // Build conversation contents for multi-turn refinement
    const contents: Array<{
      role: string;
      parts: Array<{ text: string }>;
    }> = [];

    // Include history for edit/refinement flow
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (msg.role === "user" && msg.text) {
          contents.push({
            role: "user",
            parts: [{ text: msg.text }],
          });
        } else if (msg.role === "ai") {
          contents.push({
            role: "model",
            parts: [
              {
                text:
                  msg.text || "Here is the church flyer I generated for you.",
              },
            ],
          });
        }
      }
    }

    // Enhance the prompt for first-time requests
    const isFirstMessage = !history || history.length === 0;
    const enhancedPrompt = isFirstMessage
      ? `Create a church flyer for L.I.F.E. Ministry (Lord Is Forever Emmanuel). ${prompt.trim()}. Make it look professional, modern, and inviting. Include the church name "L.I.F.E. Ministry" prominently on the flyer.`
      : prompt.trim();

    contents.push({
      role: "user",
      parts: [{ text: enhancedPrompt }],
    });

    // Call Gemini API with image generation
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);

      if (response.status === 429) {
        return NextResponse.json(
          { error: "Too many requests. Please wait a moment and try again." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "Failed to generate flyer image. Please try again." },
        { status: 500 }
      );
    }

    const data = await response.json();

    // Extract image and text from response
    const candidate = data.candidates?.[0];
    if (!candidate?.content?.parts) {
      console.error("No parts in Gemini response:", JSON.stringify(data));
      return NextResponse.json(
        { error: "No image was generated. Try describing the flyer differently." },
        { status: 500 }
      );
    }

    let imageBase64: string | null = null;
    let imageMimeType: string | null = null;
    let textResponse = "";

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        imageBase64 = part.inlineData.data;
        imageMimeType = part.inlineData.mimeType;
      }
      if (part.text) {
        textResponse = part.text;
      }
    }

    if (!imageBase64 || !imageMimeType) {
      return NextResponse.json(
        {
          error:
            "The AI returned text but no image. Try being more specific about the flyer design.",
          text: textResponse,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      image: imageBase64,
      mimeType: imageMimeType,
      text: textResponse,
    });
  } catch (error) {
    console.error("Error in /api/flyer-image:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
