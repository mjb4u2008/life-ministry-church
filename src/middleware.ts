import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter (resets on cold start, which is fine for Vercel)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function rateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

export function middleware(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const path = request.nextUrl.pathname;

  // Rate limit auth endpoint: 5 attempts per minute
  if (path === "/api/auth" && request.method === "POST") {
    if (!rateLimit(`auth:${ip}`, 5, 60_000)) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again in a minute." },
        { status: 429 }
      );
    }
  }

  // Rate limit AI endpoints: 10 per minute
  if (path === "/api/ask" && request.method === "POST") {
    if (!rateLimit(`ask:${ip}`, 10, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }
  }

  // Rate limit public POST endpoints: 20 per minute
  if (["/api/prayers", "/api/testimonies", "/api/subscribers"].includes(path) && request.method === "POST") {
    if (!rateLimit(`post:${ip}`, 20, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
