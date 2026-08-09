import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ active: vi.fn(), send: vi.fn(), addLog: vi.fn() }));
vi.mock("@/lib/messaging", () => ({
  MessagingRepository: class { getActiveSubscribers = mocks.active; },
  unsubscribeUrl: () => "https://church.example/unsubscribe?token=signed",
}));
vi.mock("@/lib/gatherings", () => ({
  GatheringRepository: class { getEffectiveStore = vi.fn().mockResolvedValue({}); },
  serializePublicGatherings: () => ({
    series: [{ id: "wednesday", slug: "wednesday", name: "Wednesday Word" }],
    featured: { id: "g1", seriesId: "wednesday", title: "Faith for Today", scripture: "Hebrews 11:1", description: "A midweek word", endsAt: "2099-08-09T20:00:00.000Z" },
    upcoming: [],
  }),
}));
vi.mock("@/lib/data", () => ({ addBlastLog: mocks.addLog }));
vi.mock("resend", () => ({ Resend: class { emails = { send: mocks.send }; } }));

import { GET } from "./route";

describe("scheduled gathering messaging", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "cron-test";
    process.env.RESEND_API_KEY = "resend-test";
    mocks.active.mockReset().mockResolvedValue([{ id: "active-1", contactType: "email", contact: "private@example.com" }]);
    mocks.send.mockReset().mockResolvedValue({ error: { message: "private@example.com rejected" } });
    mocks.addLog.mockReset().mockResolvedValue(undefined);
  });

  it("uses the active selector for Wednesday and redacts provider/recipient failures", async () => {
    const response = await GET(new NextRequest("http://localhost/api/cron/weekly-reminder", { headers: { authorization: "Bearer cron-test" } }));
    const raw = await response.text();
    expect(response.status).toBe(200);
    expect(mocks.active).toHaveBeenCalledOnce();
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ subject: "Wednesday Word: Faith for Today" }));
    expect(raw).toContain("1 email delivery failed");
    expect(raw).not.toContain("private@example.com");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
