import crypto from "crypto";
import { kv } from "@vercel/kv";

export interface RateLimitStorage {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
}

const vercelRateLimitStorage: RateLimitStorage = {
  incr: (key) => kv.incr(key),
  expire: (key, seconds) => kv.expire(key, seconds),
};

export async function checkDurableRateLimit({
  identifier,
  scope,
  limit,
  windowSeconds,
  storage = vercelRateLimitStorage,
}: {
  identifier: string;
  scope: string;
  limit: number;
  windowSeconds: number;
  storage?: RateLimitStorage;
}) {
  const digest = crypto.createHash("sha256").update(identifier).digest("hex").slice(0, 32);
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `rate-limit:${scope}:${bucket}:${digest}`;
  const count = await storage.incr(key);
  if (count === 1) await storage.expire(key, windowSeconds + 5);
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}

export function requestIdentifier(headers: Headers) {
  return (
    headers.get("x-vercel-forwarded-for") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
