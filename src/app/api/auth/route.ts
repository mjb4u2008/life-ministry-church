import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, generateToken, verifyToken } from "@/lib/auth";
import { checkDurableRateLimit, trustedRequestIdentifier } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const limit = await checkDurableRateLimit({
      identifier: trustedRequestIdentifier(request.headers),
      scope: "admin-auth",
      limit: 5,
      windowSeconds: 60,
    });
    if (!limit.allowed) {
      return NextResponse.json({ error: "Too many login attempts. Please try again in a minute." }, { status: 429 });
    }
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (!verifyPassword(password)) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const token = generateToken();

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}
