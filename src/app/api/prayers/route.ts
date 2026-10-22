import { NextRequest, NextResponse } from "next/server";
import {
  CareRecordNotFoundError,
  CareRepository,
  CareValidationError,
  parsePublicCareSubmission,
  serializePublicPrayer,
  serializePublicPrayers,
} from "@/lib/care";
import { checkDurableRateLimit, requestIdentifier } from "@/lib/rate-limit";

function json(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

async function limited(request: NextRequest, scope: string, limit: number) {
  return checkDurableRateLimit({
    identifier: requestIdentifier(request.headers),
    scope,
    limit,
    windowSeconds: 600,
  });
}

export async function GET() {
  try {
    const store = await new CareRepository().getStore();
    return json({ prayers: serializePublicPrayers(store) });
  } catch (error) {
    console.error("Prayer read failed", error instanceof Error ? error.name : "UnknownError");
    return json({ error: "Prayer requests could not be loaded" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 20_000) return json({ error: "Submission is too large" }, { status: 413 });
  try {
    if (!(await limited(request, "prayer-submit", 6)).allowed) {
      return json({ error: "Too many submissions. Please wait before trying again." }, { status: 429 });
    }
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.website === "string" && body.website.trim()) {
      return json({ submitted: true, pendingReview: true }, { status: 202 });
    }
    const submission = parsePublicCareSubmission({
      kind: "prayer",
      name: body.name,
      message: body.request,
      isAnonymous: body.isAnonymous,
      sharePublic: body.sharePublic,
      contactPermission: body.contactPermission,
      email: body.email,
      phone: body.phone,
      preferredContact: body.preferredContact,
      website: body.website,
    });
    const { record } = await new CareRepository().addSubmission(submission);
    return json({ id: record.id, submitted: true, pendingReview: true }, { status: 202 });
  } catch (error) {
    if (error instanceof CareValidationError || error instanceof SyntaxError) {
      return json(
        { error: error instanceof CareValidationError ? error.issues.join(". ") : "Invalid JSON body" },
        { status: 400 },
      );
    }
    console.error("Prayer submission failed", error instanceof Error ? error.name : "UnknownError");
    return json({ error: "Prayer request could not be submitted" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await limited(request, "prayer-support", 30)).allowed) {
      return json({ error: "Too many requests. Please wait before trying again." }, { status: 429 });
    }
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.id !== "string" || body.increment !== true || Object.keys(body).some((key) => !["id", "increment"].includes(key))) {
      return json({ error: "Invalid prayer action" }, { status: 400 });
    }
    const { record } = await new CareRepository().incrementPrayer(body.id);
    return json(serializePublicPrayer(record));
  } catch (error) {
    if (error instanceof CareRecordNotFoundError) {
      return json({ error: "Prayer request not found" }, { status: 404 });
    }
    if (error instanceof SyntaxError) return json({ error: "Invalid JSON body" }, { status: 400 });
    console.error("Prayer support failed", error instanceof Error ? error.name : "UnknownError");
    return json({ error: "Prayer support could not be recorded" }, { status: 500 });
  }
}
