import type {
  CareAdminUpdates,
  CareRecord,
  CareStoreV1,
  PublicCareSubmission,
} from "./types";

export class CareValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(issues.join(". "));
    this.name = "CareValidationError";
  }
}

function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new CareValidationError([`${label} must be an object`]);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, max: number, required = false) {
  if (value === undefined || value === null) {
    if (required) throw new CareValidationError([`${label} is required`]);
    return "";
  }
  if (typeof value !== "string") throw new CareValidationError([`${label} must be text`]);
  const cleaned = value.trim();
  if (required && !cleaned) throw new CareValidationError([`${label} is required`]);
  if (cleaned.length > max) throw new CareValidationError([`${label} must be ${max} characters or fewer`]);
  return cleaned;
}

function booleanValue(value: unknown, fallback = false) {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") throw new CareValidationError(["Invalid true/false value"]);
  return value;
}

function optionalEmail(value: unknown) {
  const email = text(value, "Email", 254);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new CareValidationError(["Enter a valid email address"]);
  }
  return email || undefined;
}

function optionalPhone(value: unknown) {
  const phone = text(value, "Phone", 40);
  if (phone && !/^[+()\-\.\s\d]{7,40}$/.test(phone)) {
    throw new CareValidationError(["Enter a valid phone number"]);
  }
  return phone || undefined;
}

export function parsePublicCareSubmission(value: unknown): PublicCareSubmission {
  const input = objectValue(value, "Submission");
  const allowed = new Set([
    "kind", "name", "message", "request", "isAnonymous", "sharePublic",
    "contactPermission", "email", "phone", "preferredContact", "website",
  ]);
  const unknown = Object.keys(input).filter((key) => !allowed.has(key));
  if (unknown.length) {
    throw new CareValidationError([`Unsupported submission fields: ${unknown.join(", ")}`]);
  }
  const kind = input.kind === "visitor" ? "visitor" : input.kind === "prayer" ? "prayer" : null;
  if (!kind) throw new CareValidationError(["Submission kind must be prayer or visitor"]);
  const message = text(input.message ?? input.request, "Message", 4000, true);
  const name = text(input.name, "Name", 120, kind === "visitor") || "Anonymous";
  const isAnonymous = kind === "prayer" && booleanValue(input.isAnonymous, false);
  const requestedVisibility = input.sharePublic === true ? "public" : "private";
  const visibility = kind === "prayer" ? requestedVisibility : "private";
  const urgency = "normal" as const;
  const contactPermission = booleanValue(input.contactPermission, false);
  const email = optionalEmail(input.email);
  const phone = optionalPhone(input.phone);
  const preferredContact = input.preferredContact === "phone"
    ? "phone"
    : input.preferredContact === "email"
      ? "email"
      : undefined;
  if (!contactPermission && (email || phone || preferredContact)) {
    throw new CareValidationError(["Allow pastoral follow-up before providing contact details"]);
  }
  if (kind === "visitor" && (!contactPermission || (!email && !phone))) {
    throw new CareValidationError([
      "First-time visitors must allow follow-up and provide an email or phone number",
    ]);
  }
  if (preferredContact === "email" && !email) {
    throw new CareValidationError(["Provide an email address for email follow-up"]);
  }
  if (preferredContact === "phone" && !phone) {
    throw new CareValidationError(["Provide a phone number for phone follow-up"]);
  }
  return {
    kind,
    name,
    isAnonymous,
    message,
    visibility,
    urgency,
    contactPermission,
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    ...(preferredContact ? { preferredContact } : {}),
    source: kind === "visitor" ? "welcome-form" : "prayer-form",
  };
}

export function parseCarePatch(value: unknown): {
  id: string;
  expectedRevision: number;
  updates: CareAdminUpdates;
} {
  const input = objectValue(value, "Care update");
  const id = text(input.id, "Care record ID", 100, true);
  if (!Number.isInteger(input.expectedRevision) || Number(input.expectedRevision) < 0) {
    throw new CareValidationError(["Expected revision must be a non-negative integer"]);
  }
  const raw = objectValue(input.updates, "Care updates");
  const allowed = new Set([
    "careStatus", "moderationStatus", "urgency", "visibility",
    "assignee", "followUpAt", "privateNotes",
  ]);
  const unknown = Object.keys(raw).filter((key) => !allowed.has(key));
  if (unknown.length) throw new CareValidationError([`Unsupported care fields: ${unknown.join(", ")}`]);
  const updates: CareAdminUpdates = {};
  if (raw.careStatus !== undefined) {
    if (!["new", "contacted", "ongoing", "answered", "closed"].includes(String(raw.careStatus))) {
      throw new CareValidationError(["Invalid care status"]);
    }
    updates.careStatus = raw.careStatus as CareRecord["careStatus"];
  }
  if (raw.moderationStatus !== undefined) {
    if (!["pending", "approved", "rejected"].includes(String(raw.moderationStatus))) {
      throw new CareValidationError(["Invalid moderation status"]);
    }
    updates.moderationStatus = raw.moderationStatus as CareRecord["moderationStatus"];
  }
  if (raw.urgency !== undefined) {
    if (!["normal", "urgent"].includes(String(raw.urgency))) throw new CareValidationError(["Invalid urgency"]);
    updates.urgency = raw.urgency as CareRecord["urgency"];
  }
  if (raw.visibility !== undefined) {
    if (!["private", "public"].includes(String(raw.visibility))) throw new CareValidationError(["Invalid visibility"]);
    updates.visibility = raw.visibility as CareRecord["visibility"];
  }
  if (raw.assignee !== undefined) updates.assignee = text(raw.assignee, "Assignee", 120);
  if (raw.privateNotes !== undefined) updates.privateNotes = text(raw.privateNotes, "Private notes", 5000);
  if (raw.followUpAt !== undefined) {
    const followUpAt = text(raw.followUpAt, "Follow-up date", 40);
    if (followUpAt && Number.isNaN(Date.parse(followUpAt))) throw new CareValidationError(["Invalid follow-up date"]);
    updates.followUpAt = followUpAt;
  }
  if (!Object.keys(updates).length) throw new CareValidationError(["Choose at least one care update"]);
  return { id, expectedRevision: Number(input.expectedRevision), updates };
}

export function parseCareStore(value: unknown): CareStoreV1 {
  const input = objectValue(value, "Care store");
  if (input.schemaVersion !== 1 || !Number.isInteger(input.revision) || !Array.isArray(input.records)) {
    throw new CareValidationError(["Stored care data is invalid"]);
  }
  return input as unknown as CareStoreV1;
}
