import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import {
  GivingRepository,
  GivingRevisionConflictError,
  GivingValidationError,
  parseGivingUpdate,
  serializePublicGiving,
} from "@/lib/giving";

function tokenFrom(request: NextRequest) {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}

function json(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest) {
  const adminRequested = request.nextUrl.searchParams.get("admin") === "1";
  const token = tokenFrom(request);
  if ((adminRequested || token) && (!token || !verifyToken(token))) return json({ error: "Unauthorized" }, { status: 401 });
  try {
    const settings = await new GivingRepository().get();
    return adminRequested ? json(settings) : json(serializePublicGiving(settings));
  } catch (error) {
    console.error("Giving settings read failed", error instanceof Error ? error.name : "UnknownError");
    return json({ error: "Giving settings could not be loaded" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const token = tokenFrom(request);
  if (!token || !verifyToken(token)) return json({ error: "Unauthorized" }, { status: 401 });
  try {
    const update = parseGivingUpdate(await request.json());
    return json(await new GivingRepository().update(update.zeffyCampaignUrl, update.expectedRevision));
  } catch (error) {
    if (error instanceof GivingValidationError || error instanceof SyntaxError) {
      return json({ error: error instanceof GivingValidationError ? error.issues.join(". ") : "Invalid JSON body" }, { status: 400 });
    }
    if (error instanceof GivingRevisionConflictError) {
      return json({ error: "Giving settings changed", expectedRevision: error.expectedRevision, actualRevision: error.actualRevision }, { status: 409 });
    }
    console.error("Giving settings update failed", error instanceof Error ? error.name : "UnknownError");
    return json({ error: "Giving settings could not be saved" }, { status: 500 });
  }
}
