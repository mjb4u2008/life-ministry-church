import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import {
  EventNotFoundError,
  EventRepository,
  EventRevisionConflictError,
  EventValidationError,
  parseExpectedRevision,
  parseMinistryEventInput,
  serializePublicEvents,
} from "@/lib/events";

function tokenFrom(request: NextRequest) {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}

function json(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function objectValue(value: unknown, allowed: string[]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new EventValidationError(["Request body must be an object"]);
  const input = value as Record<string, unknown>;
  const unknown = Object.keys(input).filter((key) => !allowed.includes(key));
  if (unknown.length) throw new EventValidationError([`Unsupported request fields: ${unknown.join(", ")}`]);
  return input;
}

function failure(error: unknown) {
  if (error instanceof EventValidationError || error instanceof SyntaxError) {
    return json({ error: error instanceof EventValidationError ? error.issues.join(". ") : "Invalid JSON body" }, { status: 400 });
  }
  if (error instanceof EventRevisionConflictError) {
    return json({ error: "Events changed", expectedRevision: error.expectedRevision, actualRevision: error.actualRevision }, { status: 409 });
  }
  if (error instanceof EventNotFoundError) return json({ error: "Event not found" }, { status: 404 });
  console.error("Event operation failed", error instanceof Error ? error.name : "UnknownError");
  return json({ error: "Event operation failed" }, { status: 500 });
}

export async function GET(request: NextRequest) {
  const adminRequested = request.nextUrl.searchParams.get("admin") === "1";
  const token = tokenFrom(request);
  if ((adminRequested || token) && (!token || !verifyToken(token))) return json({ error: "Unauthorized" }, { status: 401 });
  try {
    const store = await new EventRepository().getStore();
    return adminRequested ? json(store) : json({ events: serializePublicEvents(store) });
  } catch (error) { return failure(error); }
}

export async function POST(request: NextRequest) {
  const token = tokenFrom(request);
  if (!token || !verifyToken(token)) return json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = objectValue(await request.json(), ["expectedRevision", "event"]);
    const expectedRevision = parseExpectedRevision(body.expectedRevision);
    const event = parseMinistryEventInput(body.event);
    const result = await new EventRepository().create(event, expectedRevision);
    return json(result, { status: 201 });
  } catch (error) { return failure(error); }
}

export async function PATCH(request: NextRequest) {
  const token = tokenFrom(request);
  if (!token || !verifyToken(token)) return json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = objectValue(await request.json(), ["id", "expectedRevision", "event"]);
    if (typeof body.id !== "string" || !body.id.trim()) throw new EventValidationError(["Event ID is required"]);
    const result = await new EventRepository().update(
      body.id,
      parseMinistryEventInput(body.event),
      parseExpectedRevision(body.expectedRevision),
    );
    return json(result);
  } catch (error) { return failure(error); }
}

export async function DELETE(request: NextRequest) {
  const token = tokenFrom(request);
  if (!token || !verifyToken(token)) return json({ error: "Unauthorized" }, { status: 401 });
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) throw new EventValidationError(["Event ID is required"]);
    const rawRevision = request.nextUrl.searchParams.get("expectedRevision");
    if (rawRevision === null || !/^\d+$/.test(rawRevision)) throw new EventValidationError(["Expected revision is required"]);
    const expectedRevision = parseExpectedRevision(Number(rawRevision));
    return json(await new EventRepository().delete(id, expectedRevision));
  } catch (error) { return failure(error); }
}
