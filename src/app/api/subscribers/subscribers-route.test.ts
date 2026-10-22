import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ add: vi.fn(), verifyToken: vi.fn(), rateLimit: vi.fn() }));

vi.mock("@/lib/auth", () => ({ verifyToken: mocks.verifyToken }));
vi.mock("@/lib/rate-limit", () => ({
  checkDurableRateLimit: mocks.rateLimit,
  requestIdentifier: () => "test-client",
}));
vi.mock("@/lib/messaging", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/messaging")>();
  return { ...actual, MessagingRepository: class { add = mocks.add; } };
});

import { POST } from "./route";
import { SubscriberSuppressedError } from "@/lib/messaging";

describe("subscriber API consent", () => {
  beforeEach(() => {
    mocks.add.mockReset().mockResolvedValue({ id: "sub-1" });
    mocks.verifyToken.mockReset().mockReturnValue(false);
    mocks.rateLimit.mockReset().mockResolvedValue({ allowed: true, remaining: 7 });
  });

  it("requires explicit public consent and sets source/version on the server", async () => {
    const missing = await POST(new NextRequest("http://localhost/api/subscribers", { method: "POST", body: JSON.stringify({ name: "Alex", contactType: "email", contact: "a@example.com" }), headers: { "content-type": "application/json" } }));
    expect(missing.status).toBe(400);
    const response = await POST(new NextRequest("http://localhost/api/subscribers", { method: "POST", body: JSON.stringify({ name: "Alex", contactType: "email", contact: "a@example.com", consent: true, signupContext: "reminder-form", consentSource: "admin-import" }), headers: { "content-type": "application/json" } }));
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.add.mock.calls.at(-1)?.[0]).toEqual(expect.objectContaining({ consentSource: "reminder-form", consentVersion: "service-reminders-2026-08-09" }));
  });

  it("uses admin consent metadata and never returns failed contact values from bulk import", async () => {
    mocks.verifyToken.mockReturnValue(true);
    mocks.add.mockRejectedValueOnce(new Error("provider exposed secret@example.com"));
    const response = await POST(new NextRequest("http://localhost/api/subscribers", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer valid" },
      body: JSON.stringify({ bulk: true, consentConfirmed: true, contacts: [{ name: "Secret", contactType: "email", contact: "secret@example.com" }] }),
    }));
    const raw = await response.text();
    expect(response.status).toBe(201);
    expect(raw).not.toContain("secret@example.com");
    expect(JSON.parse(raw).failedRows).toEqual([1]);
  });

  it("does not let a public signup reactivate a suppressed delivery identity", async () => {
    mocks.add.mockRejectedValueOnce(new SubscriberSuppressedError());
    const response = await POST(new NextRequest("http://localhost/api/subscribers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Someone else", contactType: "email", contact: "victim@example.com", consent: true }),
    }));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ subscribed: true });
  });
});
