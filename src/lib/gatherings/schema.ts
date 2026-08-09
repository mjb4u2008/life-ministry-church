import {
  GATHERING_SCHEMA_VERSION,
  type GatheringOccurrence,
  type GatheringPutCommand,
  type GatheringSeries,
  type GatheringStoreV1,
  type ReminderDelivery,
} from "./types";
import {
  isValidLocalDate,
  isValidLocalTime,
  isValidTimeZone,
} from "./time";

const ID_PATTERN = /^[a-z0-9][a-z0-9:_-]{0,99}$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class GatheringValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(issues.join("; "));
    this.name = "GatheringValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIsoDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

function validHttpsUrl(value: string, meetOnly = false): boolean {
  if (value === "") return true;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (!meetOnly || url.hostname.toLowerCase() === "meet.google.com")
    );
  } catch {
    return false;
  }
}

function text(
  value: unknown,
  path: string,
  issues: string[],
  maximum: number,
): value is string {
  if (typeof value !== "string" || value.length > maximum) {
    issues.push(`${path} must be a string of at most ${maximum} characters`);
    return false;
  }
  return true;
}

function validateSeries(value: unknown, path: string, issues: string[]): value is GatheringSeries {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object`);
    return false;
  }

  if (typeof value.id !== "string" || !ID_PATTERN.test(value.id)) {
    issues.push(`${path}.id is invalid`);
  }
  if (typeof value.slug !== "string" || !SLUG_PATTERN.test(value.slug)) {
    issues.push(`${path}.slug is invalid`);
  }
  if (!["sunday", "wednesday", "special"].includes(String(value.kind))) {
    issues.push(`${path}.kind is invalid`);
  }
  text(value.name, `${path}.name`, issues, 120);
  if (typeof value.enabled !== "boolean") {
    issues.push(`${path}.enabled must be a boolean`);
  }
  if (!["sunday", "wednesday", "special"].includes(String(value.themeKey))) {
    issues.push(`${path}.themeKey is invalid`);
  }

  if (value.schedule === null) {
    if (value.enabled === true) {
      issues.push(`${path}.schedule is required for an enabled series`);
    }
  } else if (!isRecord(value.schedule)) {
    issues.push(`${path}.schedule must be an object or null`);
  } else {
    const day = value.schedule.dayOfWeek;
    if (!Number.isInteger(day) || Number(day) < 0 || Number(day) > 6) {
      issues.push(`${path}.schedule.dayOfWeek must be from 0 through 6`);
    }
    if (
      typeof value.schedule.localTime !== "string" ||
      !isValidLocalTime(value.schedule.localTime)
    ) {
      issues.push(`${path}.schedule.localTime must use HH:mm`);
    }
    if (
      typeof value.schedule.timezone !== "string" ||
      !isValidTimeZone(value.schedule.timezone)
    ) {
      issues.push(`${path}.schedule.timezone must be a valid IANA timezone`);
    }
    const duration = value.schedule.durationMinutes;
    if (!Number.isInteger(duration) || Number(duration) < 15 || Number(duration) > 480) {
      issues.push(`${path}.schedule.durationMinutes must be from 15 through 480`);
    }
  }

  if (
    typeof value.defaultMeetUrl !== "string" ||
    !validHttpsUrl(value.defaultMeetUrl, true)
  ) {
    issues.push(`${path}.defaultMeetUrl must be an HTTPS Google Meet URL or empty`);
  }
  if (
    !Number.isInteger(value.joinWindowMinutes) ||
    Number(value.joinWindowMinutes) < 0 ||
    Number(value.joinWindowMinutes) > 1440
  ) {
    issues.push(`${path}.joinWindowMinutes must be from 0 through 1440`);
  }
  if (!isIsoDate(value.updatedAt)) {
    issues.push(`${path}.updatedAt must be a canonical ISO timestamp`);
  }
  return true;
}

function optionalUrl(
  value: unknown,
  path: string,
  issues: string[],
  meetOnly = false,
): void {
  if (
    value !== undefined &&
    (typeof value !== "string" || !validHttpsUrl(value, meetOnly))
  ) {
    issues.push(`${path} must be a valid HTTPS URL`);
  }
}

function validateOccurrence(
  value: unknown,
  path: string,
  issues: string[],
): value is GatheringOccurrence {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object`);
    return false;
  }
  if (typeof value.id !== "string" || !ID_PATTERN.test(value.id)) {
    issues.push(`${path}.id is invalid`);
  }
  if (typeof value.seriesId !== "string" || !ID_PATTERN.test(value.seriesId)) {
    issues.push(`${path}.seriesId is invalid`);
  }
  if (typeof value.localDate !== "string" || !isValidLocalDate(value.localDate)) {
    issues.push(`${path}.localDate must use a real YYYY-MM-DD date`);
  }
  if (!isIsoDate(value.startsAt)) {
    issues.push(`${path}.startsAt must be a canonical ISO timestamp`);
  }
  if (!isIsoDate(value.endsAt)) {
    issues.push(`${path}.endsAt must be a canonical ISO timestamp`);
  }
  if (
    isIsoDate(value.startsAt) &&
    isIsoDate(value.endsAt) &&
    Date.parse(value.endsAt) <= Date.parse(value.startsAt)
  ) {
    issues.push(`${path}.endsAt must be later than startsAt`);
  }
  if (!["draft", "published", "live", "completed", "cancelled"].includes(String(value.status))) {
    issues.push(`${path}.status is invalid`);
  }
  text(value.title, `${path}.title`, issues, 120);
  text(value.scripture, `${path}.scripture`, issues, 100);
  text(value.description, `${path}.description`, issues, 2_000);
  optionalUrl(value.meetUrlOverride, `${path}.meetUrlOverride`, issues, true);
  optionalUrl(value.replayUrl, `${path}.replayUrl`, issues);
  optionalUrl(value.bannerUrl, `${path}.bannerUrl`, issues);
  for (const key of ["publishedAt", "completedAt"] as const) {
    if (value[key] !== undefined && !isIsoDate(value[key])) {
      issues.push(`${path}.${key} must be a canonical ISO timestamp`);
    }
  }
  if (!isIsoDate(value.updatedAt)) {
    issues.push(`${path}.updatedAt must be a canonical ISO timestamp`);
  }
  return true;
}

function validateDelivery(
  value: unknown,
  path: string,
  issues: string[],
): value is ReminderDelivery {
  if (!isRecord(value)) {
    issues.push(`${path} must be an object`);
    return false;
  }
  if (typeof value.occurrenceId !== "string" || !ID_PATTERN.test(value.occurrenceId)) {
    issues.push(`${path}.occurrenceId is invalid`);
  }
  text(value.reminderType, `${path}.reminderType`, issues, 80);
  if (!isIsoDate(value.sentAt)) {
    issues.push(`${path}.sentAt must be a canonical ISO timestamp`);
  }
  return true;
}

export function parseGatheringStore(value: unknown): GatheringStoreV1 {
  const issues: string[] = [];
  if (!isRecord(value)) {
    throw new GatheringValidationError(["store must be an object"]);
  }
  if (value.schemaVersion !== GATHERING_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${GATHERING_SCHEMA_VERSION}`);
  }
  if (!Number.isInteger(value.revision) || Number(value.revision) < 0) {
    issues.push("revision must be a non-negative integer");
  }
  if (!Array.isArray(value.series)) {
    issues.push("series must be an array");
  } else {
    value.series.forEach((item, index) => validateSeries(item, `series[${index}]`, issues));
  }
  if (!Array.isArray(value.occurrences)) {
    issues.push("occurrences must be an array");
  } else {
    value.occurrences.forEach((item, index) =>
      validateOccurrence(item, `occurrences[${index}]`, issues),
    );
  }
  if (!Array.isArray(value.reminderDeliveries)) {
    issues.push("reminderDeliveries must be an array");
  } else {
    value.reminderDeliveries.forEach((item, index) =>
      validateDelivery(item, `reminderDeliveries[${index}]`, issues),
    );
  }
  if (!isIsoDate(value.updatedAt)) {
    issues.push("updatedAt must be a canonical ISO timestamp");
  }

  if (Array.isArray(value.series)) {
    const seriesIds = new Set<string>();
    const slugs = new Set<string>();
    for (const item of value.series) {
      if (!isRecord(item) || typeof item.id !== "string") continue;
      if (seriesIds.has(item.id)) issues.push(`duplicate series id: ${item.id}`);
      seriesIds.add(item.id);
      if (typeof item.slug === "string") {
        if (slugs.has(item.slug)) issues.push(`duplicate series slug: ${item.slug}`);
        slugs.add(item.slug);
      }
    }
    if (Array.isArray(value.occurrences)) {
      const occurrenceIds = new Set<string>();
      for (const item of value.occurrences) {
        if (!isRecord(item) || typeof item.id !== "string") continue;
        if (occurrenceIds.has(item.id)) issues.push(`duplicate occurrence id: ${item.id}`);
        occurrenceIds.add(item.id);
        if (typeof item.seriesId === "string" && !seriesIds.has(item.seriesId)) {
          issues.push(`occurrence ${item.id} references missing series ${item.seriesId}`);
        }
      }
    }
  }

  if (issues.length > 0) throw new GatheringValidationError(issues);
  return value as unknown as GatheringStoreV1;
}

export function parseGatheringSeries(value: unknown): GatheringSeries {
  const issues: string[] = [];
  validateSeries(value, "series", issues);
  if (issues.length > 0) throw new GatheringValidationError(issues);
  return value as GatheringSeries;
}

export function parseGatheringOccurrence(value: unknown): GatheringOccurrence {
  const issues: string[] = [];
  validateOccurrence(value, "occurrence", issues);
  if (issues.length > 0) throw new GatheringValidationError(issues);
  return value as GatheringOccurrence;
}

export function parseGatheringPutCommand(value: unknown): GatheringPutCommand {
  if (!isRecord(value)) {
    throw new GatheringValidationError(["request body must be an object"]);
  }
  if (!Number.isInteger(value.expectedRevision) || Number(value.expectedRevision) < 0) {
    throw new GatheringValidationError(["expectedRevision must be a non-negative integer"]);
  }
  if (value.operation === "upsert-series") {
    return {
      operation: value.operation,
      expectedRevision: value.expectedRevision as number,
      series: parseGatheringSeries(value.series),
    };
  }
  if (value.operation === "upsert-occurrence") {
    return {
      operation: value.operation,
      expectedRevision: value.expectedRevision as number,
      occurrence: parseGatheringOccurrence(value.occurrence),
    };
  }
  throw new GatheringValidationError([
    "operation must be upsert-series or upsert-occurrence",
  ]);
}
