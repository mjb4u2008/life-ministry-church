import crypto from "crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyToken } from "./auth";

const ORIGINAL_PASSWORD = process.env.ADMIN_PASSWORD;

afterEach(() => {
  vi.unstubAllEnvs();
  if (ORIGINAL_PASSWORD === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = ORIGINAL_PASSWORD;
});

function tokenAt(timestamp: number, secret: string) {
  const random = "a".repeat(64);
  const payload = `${timestamp}:${random}`;
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64");
}

describe("admin token boundaries", () => {
  it("rejects future-dated and expired tokens", () => {
    vi.stubEnv("ADMIN_PASSWORD", "strong-test-secret");
    const now = Date.now();
    expect(verifyToken(tokenAt(now + 60_000, "strong-test-secret"))).toBe(false);
    expect(verifyToken(tokenAt(now - 25 * 60 * 60 * 1000, "strong-test-secret"))).toBe(false);
    expect(verifyToken(tokenAt(now, "strong-test-secret"))).toBe(true);
  });

  it("fails closed without a production password", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_PASSWORD", "");
    expect(verifyToken(tokenAt(Date.now(), "LIFE2024"))).toBe(false);
  });
});
