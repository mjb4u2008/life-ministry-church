// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ limit: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ checkDurableRateLimit: mocks.limit, trustedRequestIdentifier: () => "test-ip" }));
import { config, proxy } from "./proxy";

describe("API protection ignores caller prefetch claims", () => {
  it.each([{}, { "next-router-prefetch": "1" }, { purpose: "prefetch" }])("matches and limits API requests with %j", async (headers) => {
    expect(unstable_doesMiddlewareMatch({ config, url: "https://church.example/api/ask", headers })).toBe(true);
    mocks.limit.mockResolvedValue({ allowed: false });
    const response = await proxy(new NextRequest("https://church.example/api/ask", { method: "POST", headers: headers as Record<string, string> }));
    expect(response.status).toBe(429);
    expect(response.headers.get("content-security-policy")).toContain("default-src 'self'");
  });
});
