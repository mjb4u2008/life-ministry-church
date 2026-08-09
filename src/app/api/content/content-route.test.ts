import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ getContent: vi.fn(), verifyToken: vi.fn() }));
vi.mock("@/lib/data", () => ({ getContent: mocks.getContent, updateContent: vi.fn() }));
vi.mock("@/lib/auth", () => ({ verifyToken: mocks.verifyToken }));

import { GET } from "./route";

const content = {
  weeklyMessage: { title: "Welcome", scripture: "Psalm 1", description: "Join us" },
  serviceSchedule: { dayOfWeek: 0, hour: 8, minute: 30, timezone: "America/Los_Angeles" },
  lobbyOpen: false,
  serviceLive: false,
  roomName: "private-room",
  testMode: false,
  socialLinks: { tiktok: "", instagram: "" },
  tiktokVideos: [],
  lastUpdated: "2030-08-09T12:00:00.000Z",
  googleMeetLink: "https://meet.google.com/private-link",
  youtubeLatestUrl: "",
  thisSunday: { date: "2030-08-11", title: "Hope", scripture: "Psalm 1", description: "Join" },
  upcomingEvents: [],
  contactEmail: "",
  contactPhone: "",
  youtubeVideos: [],
};

describe("legacy content privacy", () => {
  beforeEach(() => { mocks.getContent.mockReset().mockResolvedValue(content); mocks.verifyToken.mockReset(); });

  it("never exposes the stored Meet link or private legacy controls publicly", async () => {
    const response = await GET(new NextRequest("http://localhost/api/content"));
    const raw = await response.text();
    expect(response.status).toBe(200);
    expect(raw).not.toContain("meet.google.com");
    expect(raw).not.toContain("private-room");
    expect(JSON.parse(raw)).not.toHaveProperty("googleMeetLink");
  });

  it("requires admin auth before returning the full compatibility record", async () => {
    expect((await GET(new NextRequest("http://localhost/api/content?admin=1"))).status).toBe(401);
    mocks.verifyToken.mockReturnValue(true);
    const response = await GET(new NextRequest("http://localhost/api/content?admin=1", { headers: { authorization: "Bearer valid" } }));
    expect((await response.json()).googleMeetLink).toBe(content.googleMeetLink);
  });
});
