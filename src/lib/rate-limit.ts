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
  const digestBytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(identifier));
  const digest = Array.from(new Uint8Array(digestBytes), (byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 32);
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

export function trustedRequestIdentifier(headers: Headers) {
  const vercelForwarded = headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercelForwarded) return vercelForwarded;
  if (process.env.NODE_ENV === "production") return "unavailable-platform-ip";
  return requestIdentifier(headers);
}
