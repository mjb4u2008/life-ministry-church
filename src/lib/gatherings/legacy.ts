import type {
  GatheringOccurrence,
  GatheringSchedule,
  GatheringSeries,
  GatheringStoreV1,
} from "./types";
import {
  MINISTRY_JOIN_WINDOW_MINUTES,
  MINISTRY_TIMEZONE,
  buildOccurrenceTimes,
  isValidLocalDate,
  isValidTimeZone,
} from "./time";

const SUNDAY_SERIES_ID = "sunday-worship";
const WEDNESDAY_SERIES_ID = "wednesday-word";

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function string(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function canonicalIso(value: unknown, fallback: string): string {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) return fallback;
  return new Date(value).toISOString();
}

function safeMeetUrl(value: unknown): string {
  if (typeof value !== "string" || value === "") return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "meet.google.com"
      ? value
      : "";
  } catch {
    return "";
  }
}

function legacySchedule(value: unknown): GatheringSchedule {
  const schedule = record(value);
  const day = Number(schedule.dayOfWeek);
  const hour = Number(schedule.hour);
  const minute = Number(schedule.minute);
  const timezone = string(schedule.timezone);
  const validDay = Number.isInteger(day) && day >= 0 && day <= 6 ? day : 0;
  const validHour = Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : 10;
  const validMinute = Number.isInteger(minute) && minute >= 0 && minute <= 59 ? minute : 0;
  return {
    dayOfWeek: validDay as GatheringSchedule["dayOfWeek"],
    localTime: `${String(validHour).padStart(2, "0")}:${String(validMinute).padStart(2, "0")}`,
    timezone: isValidTimeZone(timezone) ? timezone : MINISTRY_TIMEZONE,
    durationMinutes: 120,
  };
}

export function normalizeLegacyGatherings(
  legacyValue: unknown,
  now = new Date(),
): GatheringStoreV1 {
  const legacy = record(legacyValue);
  const thisSunday = record(legacy.thisSunday);
  const weeklyMessage = record(legacy.weeklyMessage);
  const timestamp = canonicalIso(legacy.lastUpdated, now.toISOString());
  const sundaySchedule = legacySchedule(legacy.serviceSchedule);

  const sundaySeries: GatheringSeries = {
    id: SUNDAY_SERIES_ID,
    slug: SUNDAY_SERIES_ID,
    kind: "sunday",
    name: "Sunday Worship",
    enabled: true,
    themeKey: "sunday",
    schedule: sundaySchedule,
    defaultMeetUrl: safeMeetUrl(legacy.googleMeetLink),
    joinWindowMinutes: MINISTRY_JOIN_WINDOW_MINUTES,
    updatedAt: timestamp,
  };
  const wednesdaySeries: GatheringSeries = {
    id: WEDNESDAY_SERIES_ID,
    slug: WEDNESDAY_SERIES_ID,
    kind: "wednesday",
    name: "Wednesday Word",
    enabled: false,
    themeKey: "wednesday",
    schedule: null,
    defaultMeetUrl: "",
    joinWindowMinutes: MINISTRY_JOIN_WINDOW_MINUTES,
    updatedAt: timestamp,
  };

  const occurrences: GatheringOccurrence[] = [];
  const localDate = string(thisSunday.date);
  if (isValidLocalDate(localDate)) {
    const { startsAt, endsAt } = buildOccurrenceTimes(
      localDate,
      sundaySchedule.localTime,
      sundaySchedule.timezone,
      sundaySchedule.durationMinutes,
    );
    const hasEnded = Date.parse(endsAt) <= now.getTime();
    const title = string(thisSunday.title) || string(weeklyMessage.title);
    const scripture = string(thisSunday.scripture) || string(weeklyMessage.scripture);
    const description =
      string(thisSunday.description) || string(weeklyMessage.description);
    occurrences.push({
      id: `${SUNDAY_SERIES_ID}:${localDate}`,
      seriesId: SUNDAY_SERIES_ID,
      localDate,
      startsAt,
      endsAt,
      status: hasEnded ? "completed" : "published",
      title,
      scripture,
      description,
      ...(hasEnded ? { completedAt: endsAt } : { publishedAt: timestamp }),
      updatedAt: timestamp,
    });
  }

  return {
    schemaVersion: 1,
    revision: 0,
    series: [sundaySeries, wednesdaySeries],
    occurrences,
    reminderDeliveries: [],
    updatedAt: timestamp,
  };
}
