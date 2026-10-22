import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ suppress: vi.fn() }));
vi.mock("@/lib/messaging", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/messaging")>();
  return { ...actual, MessagingRepository: class { suppress = mocks.suppress; } };
});

import { createUnsubscribeToken } from "@/lib/messaging";
import { POST } from "./route";

describe("unsubscribe confirmation", () => {
  const originalPassword = process.env.ADMIN_PASSWORD;
  beforeEach(() => { process.env.ADMIN_PASSWORD = "unsubscribe-route-secret"; mocks.suppress.mockReset().mockResolvedValue(undefined); });
  afterEach(() => {
    if (originalPassword === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = originalPassword;
  });

  it("suppresses the signed record without putting contact data in the URL", async () => {
    const token = createUnsubscribeToken("record-42");
    const response = await POST(new NextRequest("http://localhost/api/unsubscribe", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
    }));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/unsubscribe?status=success");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.suppress).toHaveBeenCalledWith("record-42", "unsubscribe");
  });

  it("does not write for a tampered token", async () => {
    const response = await POST(new NextRequest("http://localhost/api/unsubscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: `${createUnsubscribeToken("record-42")}x` }),
    }));
    expect(response.headers.get("location")).toBe("http://localhost/unsubscribe?status=invalid");
    expect(mocks.suppress).not.toHaveBeenCalled();
  });
});
