import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ send: vi.fn(), addLog: vi.fn(), active: vi.fn() }));
vi.mock("@/lib/auth", () => ({ verifyToken: () => true }));
vi.mock("@/lib/data", () => ({ getBlastLogs: vi.fn(), addBlastLog: mocks.addLog }));
vi.mock("@/lib/messaging", () => ({
  MessagingRepository: class { getActiveSubscribers = mocks.active; },
  unsubscribeUrl: () => "https://church.example/unsubscribe?token=signed",
}));
vi.mock("resend", () => ({ Resend: class { emails = { send: mocks.send }; } }));

import { POST } from "./route";

describe("manual messaging privacy", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "test";
    mocks.active.mockReset().mockResolvedValue([{ id: "1", name: "Private", contactType: "email", contact: "private@example.com", suppressedAt: null }]);
    mocks.send.mockReset().mockResolvedValue({ error: { message: "Failure for private@example.com" } });
    mocks.addLog.mockReset().mockResolvedValue(undefined);
  });

  it("uses the active selector and redacts recipient/provider details from its response", async () => {
    const response = await POST(new NextRequest("http://localhost/api/send-blast", {
      method: "POST",
      headers: { authorization: "Bearer valid", "content-type": "application/json" },
      body: JSON.stringify({ subject: "Gathering", message: "Join us", channels: ["email"] }),
    }));
    const raw = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(raw).toContain("1 email delivery failed");
    expect(raw).not.toContain("private@example.com");
    expect(raw).not.toContain("Failure for");
  });
});
