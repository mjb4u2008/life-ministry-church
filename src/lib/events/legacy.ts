import { buildOccurrenceTimes, isValidLocalDate, isValidLocalTime } from "@/lib/gatherings";
import type { EventStoreV1, MinistryEvent } from "./types";

export function normalizeLegacyEvents(value: unknown, now = new Date()): EventStoreV1 {
  const content = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const legacy = Array.isArray(content.upcomingEvents) ? content.upcomingEvents : [];
  const events: MinistryEvent[] = legacy.flatMap((raw, index) => {
    if (!raw || typeof raw !== "object") return [];
    const item = raw as Record<string, unknown>;
    const date = typeof item.date === "string" ? item.date.trim() : "";
    const time = typeof item.time === "string" ? item.time.trim() : "";
    const title = typeof item.title === "string" ? item.title.trim().slice(0, 120) : "";
    const description = typeof item.description === "string" ? item.description.trim().slice(0, 3000) : "";
    if (!title || !description || !isValidLocalDate(date) || !isValidLocalTime(time)) return [];
    try {
      const { startsAt, endsAt } = buildOccurrenceTimes(date, time, "America/New_York", 90);
      const createdAt = now.toISOString();
      return [{
        id: typeof item.id === "string" && item.id.trim() ? item.id.slice(0, 100) : `legacy-event-${index}`,
        title,
        description,
        startsAt,
        endsAt,
        timezone: "America/New_York",
        status: "draft" as const,
        locationType: "online" as const,
        locationLabel: "Online",
        createdAt,
        updatedAt: createdAt,
      }];
    } catch { return []; }
  });
  return { schemaVersion: 1, revision: 0, events, updatedAt: now.toISOString() };
}
