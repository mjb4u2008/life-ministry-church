import { isValidTimeZone } from "@/lib/gatherings";
import type { EventLocationType, EventStoreV1, MinistryEvent, MinistryEventInput, MinistryEventStatus } from "./types";

export class EventValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(issues.join(". "));
    this.name = "EventValidationError";
  }
}

function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new EventValidationError([`${label} must be an object`]);
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, max: number, required = false) {
  if (value === undefined || value === null) {
    if (required) throw new EventValidationError([`${label} is required`]);
    return "";
  }
  if (typeof value !== "string") throw new EventValidationError([`${label} must be text`]);
  const cleaned = value.trim();
  if (required && !cleaned) throw new EventValidationError([`${label} is required`]);
  if (cleaned.length > max) throw new EventValidationError([`${label} must be ${max} characters or fewer`]);
  return cleaned;
}

function instant(value: unknown, label: string, required = false) {
  const cleaned = text(value, label, 40, required);
  if (!cleaned) return undefined;
  const date = new Date(cleaned);
  if (Number.isNaN(date.getTime()) || date.toISOString() !== cleaned) throw new EventValidationError([`${label} must be an exact UTC timestamp`]);
  return cleaned;
}

function httpsUrl(value: unknown, label: string, host?: string) {
  const cleaned = text(value, label, 500);
  if (!cleaned) return undefined;
  try {
    const url = new URL(cleaned);
    if (
      url.protocol !== "https:" || url.username || url.password ||
      /[\u0000-\u001f\u007f]/.test(cleaned) || (host && url.hostname !== host)
    ) throw new Error("invalid");
    return url.toString();
  } catch {
    throw new EventValidationError([`${label} must be a valid HTTPS${host ? ` ${host}` : ""} URL`]);
  }
}

export function parseMinistryEvent(value: unknown): MinistryEvent {
  const input = objectValue(value, "Event");
  const allowed = new Set([
    "id", "title", "description", "startsAt", "endsAt", "timezone", "status",
    "locationType", "locationLabel", "meetUrl", "registrationUrl", "createdAt", "updatedAt",
  ]);
  const unknown = Object.keys(input).filter((key) => !allowed.has(key));
  if (unknown.length) throw new EventValidationError([`Unsupported event fields: ${unknown.join(", ")}`]);
  const id = text(input.id, "Event ID", 100, true);
  const title = text(input.title, "Title", 120, true);
  const description = text(input.description, "Description", 3000, true);
  const startsAt = instant(input.startsAt, "Start time", true)!;
  const endsAt = instant(input.endsAt, "End time");
  if (endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) throw new EventValidationError(["End time must be after start time"]);
  const timezone = text(input.timezone, "Timezone", 100, true);
  if (!isValidTimeZone(timezone)) throw new EventValidationError(["Timezone is invalid"]);
  if (!["draft", "published", "cancelled"].includes(String(input.status))) throw new EventValidationError(["Event status is invalid"]);
  if (!["online", "in-person", "hybrid"].includes(String(input.locationType))) throw new EventValidationError(["Location type is invalid"]);
  const meetUrl = httpsUrl(input.meetUrl, "Google Meet link", "meet.google.com");
  const registrationUrl = httpsUrl(input.registrationUrl, "Registration link");
  return {
    id,
    title,
    description,
    startsAt,
    ...(endsAt ? { endsAt } : {}),
    timezone,
    status: input.status as MinistryEventStatus,
    locationType: input.locationType as EventLocationType,
    ...(text(input.locationLabel, "Location", 200) ? { locationLabel: text(input.locationLabel, "Location", 200) } : {}),
    ...(meetUrl ? { meetUrl } : {}),
    ...(registrationUrl ? { registrationUrl } : {}),
    createdAt: instant(input.createdAt, "Created time", true)!,
    updatedAt: instant(input.updatedAt, "Updated time", true)!,
  };
}

export function parseMinistryEventInput(value: unknown): MinistryEventInput {
  const input = objectValue(value, "Event input");
  const allowed = new Set([
    "title", "description", "startsAt", "endsAt", "timezone", "status",
    "locationType", "locationLabel", "meetUrl", "registrationUrl",
  ]);
  const unknown = Object.keys(input).filter((key) => !allowed.has(key));
  if (unknown.length) throw new EventValidationError([`Unsupported event fields: ${unknown.join(", ")}`]);
  const parsed = parseMinistryEvent({
    ...input,
    id: "server-generated",
    createdAt: "2000-01-01T00:00:00.000Z",
    updatedAt: "2000-01-01T00:00:00.000Z",
  });
  if (
    parsed.status === "published" &&
    (parsed.locationType === "in-person" || parsed.locationType === "hybrid") &&
    !parsed.locationLabel
  ) throw new EventValidationError(["Published in-person events require a location"]);
  if (
    parsed.status === "published" &&
    (parsed.locationType === "online" || parsed.locationType === "hybrid") &&
    !parsed.meetUrl && !parsed.registrationUrl
  ) throw new EventValidationError(["Published online events require a Meet or registration link"]);
  return {
    title: parsed.title,
    description: parsed.description,
    startsAt: parsed.startsAt,
    ...(parsed.endsAt ? { endsAt: parsed.endsAt } : {}),
    timezone: parsed.timezone,
    status: parsed.status,
    locationType: parsed.locationType,
    ...(parsed.locationLabel ? { locationLabel: parsed.locationLabel } : {}),
    ...(parsed.meetUrl ? { meetUrl: parsed.meetUrl } : {}),
    ...(parsed.registrationUrl ? { registrationUrl: parsed.registrationUrl } : {}),
  };
}

export function parseEventStore(value: unknown): EventStoreV1 {
  const input = objectValue(value, "Event store");
  if (input.schemaVersion !== 1 || !Number.isInteger(input.revision) || Number(input.revision) < 0 || !Array.isArray(input.events)) {
    throw new EventValidationError(["Stored event data is invalid"]);
  }
  return {
    schemaVersion: 1,
    revision: Number(input.revision),
    events: input.events.map(parseMinistryEvent),
    updatedAt: instant(input.updatedAt, "Store updated time", true)!,
  };
}

export function parseExpectedRevision(value: unknown) {
  if (!Number.isInteger(value) || Number(value) < 0) throw new EventValidationError(["Expected revision must be a non-negative integer"]);
  return Number(value);
}
