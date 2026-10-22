import { buildOccurrenceTimes } from "./time";
import type { GatheringOccurrence, GatheringSeries, GatheringStoreV1 } from "./types";

export function localDateInTimezone(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)!.value;
  return `${read("year")}-${read("month")}-${read("day")}`;
}

export function addLocalDays(localDate: string, days: number): string {
  const [year, month, day] = localDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function occurrenceIdForDate(seriesId: string, localDate: string): string {
  return `${seriesId.slice(0, 89)}:${localDate}`;
}

export function recurringOccurrence(series: GatheringSeries, localDate: string): GatheringOccurrence {
  if (!series.schedule) throw new Error("A weekly schedule is required");
  const times = buildOccurrenceTimes(localDate, series.schedule.localTime, series.schedule.timezone, series.schedule.durationMinutes);
  return {
    id: occurrenceIdForDate(series.id, localDate), seriesId: series.id, localDate, ...times,
    status: "published", title: series.name, scripture: "", description: "",
    isRecurring: true, updatedAt: series.updatedAt,
  };
}

/** A date-specific record always wins, including a draft or cancelled service. */
export function scheduledOccurrences(store: GatheringStoreV1, now = new Date(), includeRecent = false): GatheringOccurrence[] {
  const occurrences = [...store.occurrences];
  for (const series of store.series) {
    if (!series.enabled || !series.schedule || series.kind === "special") continue;
    const localToday = localDateInTimezone(now, series.schedule.timezone);
    const weekday = new Date(`${localToday}T12:00:00.000Z`).getUTCDay();
    const weekStart = addLocalDays(localToday, -weekday);
    const explicitDates = new Set(store.occurrences.filter((item) => item.seriesId === series.id && !item.id.startsWith("legacy-recording:")).map((item) => item.localDate));
    let futureGenerated = 0;
    for (let week = includeRecent ? -4 : -1; week < 5 || (futureGenerated < 2 && week < explicitDates.size + 8); week += 1) {
      const date = addLocalDays(weekStart, week * 7 + series.schedule.dayOfWeek);
      if (explicitDates.has(date)) continue;
      try {
        const occurrence = recurringOccurrence(series, date);
        if (Date.parse(occurrence.endsAt) > now.getTime()) futureGenerated += 1;
        if (includeRecent || Date.parse(occurrence.endsAt) > now.getTime()) occurrences.push(occurrence);
      } catch {
        // A nonexistent DST wall time skips that date rather than shifting it.
      }
    }
  }
  return occurrences.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}
