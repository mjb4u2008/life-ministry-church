import { describe, expect, it } from "vitest";
import { checkDurableRateLimit, type RateLimitStorage } from "./rate-limit";

class MemoryRateLimitStorage implements RateLimitStorage {
  counts = new Map<string, number>();
  expirations = new Map<string, number>();
  async incr(key: string) {
    const count = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, count);
    return count;
  }
  async expire(key: string, seconds: number) {
    this.expirations.set(key, seconds);
  }
}

describe("durable rate limit", () => {
  it("rejects requests beyond an endpoint-specific quota", async () => {
    const storage = new MemoryRateLimitStorage();
    const options = {
      identifier: "203.0.113.10",
      scope: "care-test",
      limit: 2,
      windowSeconds: 600,
      storage,
    };
    expect((await checkDurableRateLimit(options)).allowed).toBe(true);
    expect((await checkDurableRateLimit(options)).allowed).toBe(true);
    expect((await checkDurableRateLimit(options)).allowed).toBe(false);
    expect(storage.expirations.size).toBe(1);
  });
});
