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

import { localDateInTimezone } from "./recurrence";

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
  const validHour = Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : 11;
  const validMinute = Number.isInteger(minute) && minute >= 0 && minute <= 59 ? minute : 30;
  return {
    dayOfWeek: validDay as GatheringSchedule["dayOfWeek"],
    localTime: `${String(validHour).padStart(2, "0")}:${String(validMinute).padStart(2, "0")}`,
    timezone: isValidTimeZone(timezone) ? timezone : MINISTRY_TIMEZONE,
    durationMinutes: 90,
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
    enabled: Boolean(sundaySeries.defaultMeetUrl),
    themeKey: "wednesday",
    schedule: { dayOfWeek: 3, localTime: "19:30", timezone: MINISTRY_TIMEZONE, durationMinutes: 120 },
    defaultMeetUrl: sundaySeries.defaultMeetUrl,
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
    const title = (string(thisSunday.title) || string(weeklyMessage.title)).slice(0, 120);
    const scripture = (string(thisSunday.scripture) || string(weeklyMessage.scripture)).slice(0, 100);
    const description =
      (string(thisSunday.description) || string(weeklyMessage.description)).slice(0, 2_000);
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

  return importLegacyRecordings({
    schemaVersion: 1,
    revision: 0,
    series: [sundaySeries, wednesdaySeries],
    occurrences,
    reminderDeliveries: [],
    updatedAt: timestamp,
  }, legacy, now);
}

/** Upgrade only an unconfigured Wednesday; a pastor's independent settings win. */
export function applyWeeklyDefaults(store: GatheringStoreV1): GatheringStoreV1 {
  const sharedMeet = store.series.find((series) => series.kind === "sunday")?.defaultMeetUrl ?? "";
  return {
    ...store,
    series: store.series.map((series) => series.kind === "wednesday" && series.schedule === null
      ? { ...series, schedule: { dayOfWeek: 3, localTime: "19:30", timezone: MINISTRY_TIMEZONE, durationMinutes: 120 }, defaultMeetUrl: series.defaultMeetUrl || sharedMeet, enabled: Boolean(series.defaultMeetUrl || sharedMeet) }
      : series),
  };
}

/** Preserve actual recorded messages without copying them into future service slots. */
export function importLegacyRecordings(store: GatheringStoreV1, legacyValue: unknown, now = new Date()): GatheringStoreV1 {
  if (store.legacyRecordingsImported) return store;
  const legacy = record(legacyValue);
  const sunday = store.series.find((series) => series.kind === "sunday");
  if (!sunday) return { ...store, legacyRecordingsImported: true };
  const videos = Array.isArray(legacy.youtubeVideos) ? legacy.youtubeVideos : [];
  const occurrences = [...store.occurrences];
  const usedUrls = new Set(occurrences.map((item) => item.replayUrl).filter(Boolean));
  videos.forEach((value, index) => {
    const video = record(value);
    const url = string(video.url).trim();
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" || !["youtube.com", "www.youtube.com", "youtu.be"].includes(parsed.hostname) || parsed.username || parsed.password || usedUrls.has(url)) return;
    } catch { return; }
    const date = string(video.date).trim();
    const dateUnknown = !isValidLocalDate(date);
    const fallback = new Date(Math.min(Date.parse(canonicalIso(legacy.lastUpdated, now.toISOString())), now.getTime() - 86_400_000));
    const localDate = dateUnknown ? localDateInTimezone(fallback, MINISTRY_TIMEZONE) : date;
    const times = buildOccurrenceTimes(localDate, "00:00", MINISTRY_TIMEZONE, 15);
    // Future-dated archive entries are held until the recorded date has ended.
    const id = `legacy-recording:${index}:${string(video.id).toLowerCase().replace(/[^a-z0-9:_-]/g, "").slice(0, 60) || "message"}`;
    occurrences.push({ id, seriesId: sunday.id, localDate, ...times, status: "completed", title: (string(video.title).trim() || "Recorded message").slice(0, 120), scripture: string(video.scripture).slice(0, 100), description: "", replayUrl: url, ...(dateUnknown ? { dateUnknown: true } : {}), completedAt: times.endsAt, updatedAt: store.updatedAt });
    usedUrls.add(url);
  });
  return { ...store, occurrences, legacyRecordingsImported: true };
}
