import { NextRequest, NextResponse } from "next/server";
import { checkDurableRateLimit, trustedRequestIdentifier } from "@/lib/rate-limit";

function contentSecurityPolicy(nonce: string) {
  const developmentEval = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
  const developmentConnect = process.env.NODE_ENV === "development" ? " ws: http:" : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${developmentEval}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self'${developmentConnect}`,
    "media-src 'self' blob: https:",
    "worker-src 'self' blob:",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "frame-src 'self' https://www.zeffy.com https://www.tiktok.com",
    "frame-ancestors 'self'",
  ].join("; ");
}

function withCsp(response: NextResponse, policy: string) {
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export async function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID();
  const policy = contentSecurityPolicy(nonce);
  const path = request.nextUrl.pathname;
  const method = request.method;
  const identifier = trustedRequestIdentifier(request.headers);

  const limitRule =
    path === "/api/ask" && method === "POST"
      ? { scope: "ask", limit: 10 }
      : ["/api/sermon-banner", "/api/flyer-image", "/api/flyer"].includes(path) && method === "POST"
        ? { scope: `generator:${path}`, limit: 10 }
        : ["/api/prayers", "/api/testimonies", "/api/subscribers"].includes(path) && method === "POST"
          ? { scope: `public-post:${path}`, limit: 20 }
          : null;

  if (limitRule) {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 64_000) {
      return withCsp(NextResponse.json({ error: "Request is too large" }, { status: 413 }), policy);
    }
    try {
      const result = await checkDurableRateLimit({
        identifier,
        scope: limitRule.scope,
        limit: limitRule.limit,
        windowSeconds: 60,
      });
      if (!result.allowed) {
        return withCsp(NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 }), policy);
      }
    } catch (error) {
      console.error("Request limiter failed", error instanceof Error ? error.name : "UnknownError");
      return withCsp(NextResponse.json({ error: "Request protection is temporarily unavailable" }, { status: 503 }), policy);
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  return withCsp(response, policy);
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
