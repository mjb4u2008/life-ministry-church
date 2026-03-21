import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const GEMINI_MODEL = "gemini-3-pro-image-preview";

const SYSTEM_PROMPT = `You are a church graphic designer for L.I.F.E. Ministry (Lord Is Forever Emmanuel).
Generate a beautiful, cinematic sermon promotion banner image.

Style reference — the banner should look like this:
- Wide landscape format (16:9 aspect ratio), like a Facebook/Instagram banner
- Rich, warm tones — golden sunset light, earth tones, dramatic sky
- Spiritual imagery: open Bible on wood, cross silhouette, mountain landscape, light rays breaking through clouds
- The sermon title displayed prominently in elegant serif/script typography
- Subtitle text below in clean sans-serif
- Professional, high-end church design — NOT clip-art or generic
- Dramatic lighting with depth — foreground elements, midground landscape, atmospheric sky
- Slight vignette or dark edges for cinematic feel
- Include "L.I.F.E. Ministry" subtly at the bottom or corner

Think of it as a movie poster for a sermon — cinematic, compelling, makes people want to attend.`;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, scripture } = await request.json();

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json(
        { error: "Sermon title is required." },
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

    // Build the prompt for a sermon banner
    let prompt = `Create a cinematic sermon promotion banner for L.I.F.E. Ministry.\n\nSermon title: "${title.trim()}"`;
    if (scripture && typeof scripture === "string" && scripture.trim()) {
      prompt += `\nScripture: ${scripture.trim()}`;
    }
    prompt += `\n\nMake it a wide landscape banner (16:9). Use dramatic golden/warm lighting, spiritual imagery (open Bible, cross, mountains, sunset), and display the sermon title "${title.trim()}" prominently in elegant typography. Include "L.I.F.E. Ministry" and "Sunday Service" text. This should look like a high-end church promotional graphic.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
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
        { error: "Failed to generate banner. Please try again." },
        { status: 500 }
      );
    }

    const data = await response.json();

    const candidate = data.candidates?.[0];
    if (!candidate?.content?.parts) {
      console.error("No parts in Gemini response:", JSON.stringify(data));
      return NextResponse.json(
        { error: "No image was generated. Please try again." },
        { status: 500 }
      );
    }

    let imageBase64: string | null = null;
    let imageMimeType: string | null = null;

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        imageBase64 = part.inlineData.data;
        imageMimeType = part.inlineData.mimeType;
      }
    }

    if (!imageBase64 || !imageMimeType) {
      return NextResponse.json(
        { error: "No image in response. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      image: imageBase64,
      mimeType: imageMimeType,
    });
  } catch (error) {
    console.error("Error in /api/sermon-banner:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
