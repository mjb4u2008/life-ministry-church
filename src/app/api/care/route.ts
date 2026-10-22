import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import {
  CareRecordNotFoundError,
  CareRepository,
  CareRevisionConflictError,
  CareValidationError,
  parseCarePatch,
  parsePublicCareSubmission,
  serializePublicPrayers,
} from "@/lib/care";
import { checkDurableRateLimit, requestIdentifier } from "@/lib/rate-limit";

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
  const token = tokenFrom(request);
  const adminRequested = request.nextUrl.searchParams.get("admin") === "1";
  if ((adminRequested || token) && (!token || !verifyToken(token))) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const store = await new CareRepository().getStore();
    return adminRequested
      ? json(store)
      : json({ prayers: serializePublicPrayers(store) });
  } catch (error) {
    console.error("Care read failed", error instanceof Error ? error.name : "UnknownError");
    return json({ error: "Care records could not be loaded" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 20_000) return json({ error: "Submission is too large" }, { status: 413 });
  try {
    const limit = await checkDurableRateLimit({
      identifier: requestIdentifier(request.headers),
      scope: "care-submit",
      limit: 6,
      windowSeconds: 600,
    });
    if (!limit.allowed) {
      return json({ error: "Too many submissions. Please wait before trying again." }, { status: 429 });
    }
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.website === "string" && body.website.trim()) {
      return json({ submitted: true, pendingReview: true }, { status: 202 });
    }
    const submission = parsePublicCareSubmission(body);
    const { record } = await new CareRepository().addSubmission(submission);
    return json(
      { id: record.id, submitted: true, pendingReview: true },
      { status: 202 },
    );
  } catch (error) {
    if (error instanceof CareValidationError || error instanceof SyntaxError) {
      return json(
        { error: error instanceof CareValidationError ? error.issues.join(". ") : "Invalid JSON body" },
        { status: 400 },
      );
    }
    console.error("Care submission failed", error instanceof Error ? error.name : "UnknownError");
    return json({ error: "Your request could not be submitted" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const token = tokenFrom(request);
  if (!token || !verifyToken(token)) return json({ error: "Unauthorized" }, { status: 401 });
  try {
    const command = parseCarePatch(await request.json());
    const store = await new CareRepository().updateRecord(
      command.id,
      command.updates,
      command.expectedRevision,
    );
    return json(store);
  } catch (error) {
    if (error instanceof CareValidationError || error instanceof SyntaxError) {
      return json(
        { error: error instanceof CareValidationError ? error.issues.join(". ") : "Invalid JSON body" },
        { status: 400 },
      );
    }
    if (error instanceof CareRevisionConflictError) {
      return json(
        { error: "Care inbox changed", expectedRevision: error.expectedRevision, actualRevision: error.actualRevision },
        { status: 409 },
      );
    }
    if (error instanceof CareRecordNotFoundError) {
      return json({ error: "Care record not found" }, { status: 404 });
    }
    console.error("Care update failed", error instanceof Error ? error.name : "UnknownError");
    return json({ error: "Care record could not be updated" }, { status: 500 });
  }
}
