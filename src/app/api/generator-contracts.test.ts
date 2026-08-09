import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function readRoute(name: string): string {
  return readFileSync(
    join(process.cwd(), "src", "app", "api", name, "route.ts"),
    "utf8"
  );
}

function extractTemplate(source: string, constantName: string): string {
  const marker = `const ${constantName} = \``;
  const start = source.indexOf(marker);
  const end = source.indexOf("`;", start + marker.length);

  if (start === -1 || end === -1) {
    throw new Error(`Could not find template constant ${constantName}`);
  }

  return source.slice(start + marker.length, end);
}

function extractObjectBody(source: string, constantName: string): string {
  const marker = `const ${constantName} = {`;
  const start = source.indexOf(marker);
  const end = source.indexOf("\n};", start + marker.length);

  if (start === -1 || end === -1) {
    throw new Error(`Could not find object constant ${constantName}`);
  }

  return source.slice(start + marker.length, end);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

describe("protected generator route contracts", () => {
  it("locks the flyer copywriter prompt and Anthropic request", () => {
    const source = readRoute("flyer");

    expect(sha256(extractTemplate(source, "SYSTEM_PROMPT"))).toBe(
      "c26cd846bbea97f5c16c376370891513191f6118a822c7260077797d2e11b40c"
    );
    expect(source).toContain('model: "claude-haiku-4-5-20251001"');
    expect(source).toContain("max_tokens: 1000");
    expect(source).toContain("temperature: 0.8");
    expect(source).toContain(
      'let userMessage = `Sermon title: "${title.trim()}"\\nScripture: ${scripture.trim()}`;'
    );
    expect(source).toContain(
      'userMessage += `\\nDescription: ${description.trim()}`;'
    );
  });

  it("locks the square flyer image prompt and Gemini image request", () => {
    const source = readRoute("flyer-image");

    expect(sha256(extractTemplate(source, "SYSTEM_PROMPT"))).toBe(
      "c652d1e538f72c338d40b3c23a75a144bb7c04857a6fd25d471c9e541df128dc"
    );
    expect(source).toContain(
      'const GEMINI_MODEL = "gemini-3-pro-image-preview";'
    );
    expect(source).toContain('responseModalities: ["IMAGE", "TEXT"]');
    expect(source).toContain(
      'Make it look professional, modern, and inviting. Include the church name "L.I.F.E. Ministry" prominently on the flyer.'
    );
    expect(source).toContain("image: imageBase64");
    expect(source).toContain("mimeType: imageMimeType");
  });

  it("locks the cinematic sermon banner prompt and Gemini image request", () => {
    const source = readRoute("sermon-banner");

    expect(sha256(extractTemplate(source, "SYSTEM_PROMPT"))).toBe(
      "8f5db93a419e8d5c29726ecd381c2e9281a1cd1eaa1d11195f9f7ada09ffa96a"
    );
    expect(source).toContain(
      'const GEMINI_MODEL = "gemini-3-pro-image-preview";'
    );
    expect(source).toContain('responseModalities: ["IMAGE", "TEXT"]');
    expect(source).toContain(
      "Make it a wide landscape banner (16:9). Use dramatic golden/warm lighting"
    );
    expect(source).toContain(
      'Include "L.I.F.E. Ministry" and "Sunday Service" text.'
    );
    expect(source).toContain("image: imageBase64");
    expect(source).toContain("mimeType: imageMimeType");
  });

  it("locks the daily scripture prompt, fallback, and cache contract", () => {
    const source = readRoute("daily-scripture");

    expect(sha256(extractTemplate(source, "SYSTEM_PROMPT"))).toBe(
      "ed105eec983ce8f632f3d201d0b261dfaa31efc87fb377fd277ecd5918d9f547"
    );
    expect(sha256(extractObjectBody(source, "FALLBACK_SCRIPTURE"))).toBe(
      "87608a4ce3f750bb4fd8bfbe35ed1af8ba9f72cab15e1f3ce3b0f4c19a9c0f00"
    );
    expect(source).toContain('model: "claude-haiku-4-5-20251001"');
    expect(source).toContain("max_tokens: 500");
    expect(source).toContain("temperature: 0.9");
    expect(source).toContain('content: "Pick today\'s scripture."');
    expect(source).toContain("await setDailyScripture(scripture)");
    expect(source).toContain("isManualOverride: true");
  });
});
