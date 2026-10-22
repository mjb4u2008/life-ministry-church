import { describe, expect, it } from "vitest";
import { ContentUpdateValidationError, parseContentUpdate } from "./content-update";

describe("content update allowlist", () => {
  it("accepts known settings and normalizes allowed HTTPS URLs", () => {
    expect(parseContentUpdate({
      socialLinks: { tiktok: "", instagram: "", youtube: "https://youtube.com/@life", facebook: "" },
      serviceSchedule: { dayOfWeek: 3, hour: 18, minute: 30, timezone: "America/Los_Angeles" },
    })).toMatchObject({
      socialLinks: { youtube: "https://youtube.com/@life" },
      serviceSchedule: { dayOfWeek: 3, hour: 18, minute: 30 },
    });
  });

  it("rejects unknown and nested extra fields, wrong types, and unsafe URLs", () => {
    for (const value of [
      { admin: true },
      { weeklyMessage: { title: "Hi", scripture: "John 3:16", description: "Welcome", injected: true } },
      { lobbyOpen: "yes" },
      { googleMeetLink: "javascript:alert(1)" },
      { googleMeetLink: "https://evil.example/meeting" },
      { socialLinks: { tiktok: "https://tiktok.com.evil.example/a", instagram: "", youtube: "", facebook: "" } },
    ]) expect(() => parseContentUpdate(value)).toThrow(ContentUpdateValidationError);
  });
});
