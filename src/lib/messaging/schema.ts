import type {
  ConsentSource,
  ContactType,
  Subscriber,
  SubscriberInput,
  SubscriberStoreV1,
  SuppressionReason,
} from "./types";

export const PUBLIC_CONSENT_VERSION = "service-reminders-2026-08-09";
export const ADMIN_CONSENT_VERSION = "admin-confirmed-2026-08-09";

export class MessagingValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(issues.join(". "));
    this.name = "MessagingValidationError";
  }
}

const iso = (value: unknown) =>
  typeof value === "string" &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString() === value;

function text(value: unknown, label: string, max: number) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new MessagingValidationError([`${label} is required and must be ${max} characters or fewer`]);
  }
  return value.trim();
}

export function normalizeContact(contactType: ContactType, value: unknown) {
  const contact = text(value, "Contact", 254);
  if (contactType === "email") {
    const normalized = contact.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new MessagingValidationError(["Enter a valid email address"]);
    }
    return normalized;
  }
  if (!/^\+?[\d\s()-]{7,20}$/.test(contact)) {
    throw new MessagingValidationError(["Enter a valid phone number"]);
  }
  const digits = contact.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) throw new MessagingValidationError(["Enter a valid phone number"]);
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
}

export function parseSubscriberInput(value: unknown): SubscriberInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new MessagingValidationError(["Subscriber must be an object"]);
  }
  const input = value as Record<string, unknown>;
  const contactType = input.contactType;
  if (contactType !== "email" && contactType !== "phone") {
    throw new MessagingValidationError(["Contact type must be email or phone"]);
  }
  const sources: SubscriberInput["consentSource"][] = ["homepage", "reminder-form", "admin-manual", "admin-import"];
  if (!sources.includes(input.consentSource as SubscriberInput["consentSource"])) {
    throw new MessagingValidationError(["Consent source is invalid"]);
  }
  return {
    name: text(input.name, "Name", 100),
    contactType,
    contact: normalizeContact(contactType, input.contact),
    consentSource: input.consentSource as SubscriberInput["consentSource"],
    consentVersion: text(input.consentVersion, "Consent version", 100),
  };
}

function parseSubscriber(value: unknown): Subscriber {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new MessagingValidationError(["Stored subscriber is invalid"]);
  }
  const input = value as Record<string, unknown>;
  const contactType = input.contactType;
  if (contactType !== "email" && contactType !== "phone") throw new MessagingValidationError(["Stored contact type is invalid"]);
  const consent = input.consent as Record<string, unknown> | null;
  const sources: ConsentSource[] = ["homepage", "reminder-form", "admin-manual", "admin-import", "legacy"];
  if (!consent || !iso(consent.recordedAt) || !sources.includes(consent.source as ConsentSource)) {
    throw new MessagingValidationError(["Stored consent record is invalid"]);
  }
  const reasons: SuppressionReason[] = ["unsubscribe", "admin", "provider"];
  const suppressedAt = input.suppressedAt;
  const suppressionReason = input.suppressionReason;
  if (suppressedAt !== null && !iso(suppressedAt)) throw new MessagingValidationError(["Stored suppression date is invalid"]);
  if (suppressionReason !== null && !reasons.includes(suppressionReason as SuppressionReason)) {
    throw new MessagingValidationError(["Stored suppression reason is invalid"]);
  }
  if ((suppressedAt === null) !== (suppressionReason === null)) {
    throw new MessagingValidationError(["Stored suppression state is inconsistent"]);
  }
  return {
    id: text(input.id, "Subscriber ID", 100),
    name: text(input.name, "Subscriber name", 100),
    contactType,
    contact: normalizeContact(contactType, input.contact),
    createdAt: iso(input.createdAt) ? input.createdAt as string : (() => { throw new MessagingValidationError(["Stored creation date is invalid"]); })(),
    consent: {
      recordedAt: consent.recordedAt as string,
      source: consent.source as ConsentSource,
      version: text(consent.version, "Consent version", 100),
    },
    suppressedAt: suppressedAt as string | null,
    suppressionReason: suppressionReason as SuppressionReason | null,
  };
}

export function parseSubscriberStore(value: unknown): SubscriberStoreV1 {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new MessagingValidationError(["Subscriber store is invalid"]);
  const input = value as Record<string, unknown>;
  if (input.schemaVersion !== 1 || !Number.isInteger(input.revision) || Number(input.revision) < 0 || !iso(input.updatedAt) || !Array.isArray(input.subscribers)) {
    throw new MessagingValidationError(["Subscriber store is invalid"]);
  }
  return {
    schemaVersion: 1,
    revision: Number(input.revision),
    subscribers: input.subscribers.map(parseSubscriber),
    updatedAt: input.updatedAt as string,
  };
}

export function normalizeLegacySubscribers(value: unknown, now = new Date()): SubscriberStoreV1 {
  if (value === null) return { schemaVersion: 1, revision: 0, subscribers: [], updatedAt: now.toISOString() };
  if (!Array.isArray(value)) throw new MessagingValidationError(["Legacy subscriber data is invalid"]);
  const normalized = value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new MessagingValidationError(["Legacy subscriber is invalid"]);
    const input = item as Record<string, unknown>;
    const contactType = input.contactType;
    if (contactType !== "email" && contactType !== "phone") throw new MessagingValidationError(["Legacy contact type is invalid"]);
    const createdAt = iso(input.timestamp) ? input.timestamp as string : now.toISOString();
    return parseSubscriber({
      id: typeof input.id === "string" && input.id.trim() ? input.id : crypto.randomUUID(),
      name: input.name,
      contactType,
      contact: input.contact,
      createdAt,
      consent: { recordedAt: createdAt, source: "legacy", version: "legacy-import" },
      suppressedAt: null,
      suppressionReason: null,
    });
  });
  const subscribers = [...new Map(normalized.map((subscriber) => [`${subscriber.contactType}:${subscriber.contact}`, subscriber])).values()];
  return { schemaVersion: 1, revision: 0, subscribers, updatedAt: now.toISOString() };
}
