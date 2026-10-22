import { describe, expect, it } from "vitest";
import { applyWeeklyDefaults, importLegacyRecordings, normalizeLegacyGatherings } from "./legacy";
import { GatheringRepository, GATHERINGS_KEY, LEGACY_CONTENT_KEY, type GatheringStorage } from "./repository";
import { recurringOccurrence, scheduledOccurrences } from "./recurrence";
import { parseGatheringStore } from "./schema";
import { serializePublicGatherings } from "./selectors";
import type { GatheringSeries, GatheringStoreV1 } from "./types";

const STAMP = "2026-10-22T12:00:00.000Z";
const MEET = "https://meet.google.com/abc-defg-hij";
const sunday: GatheringSeries = { id: "sunday-worship", slug: "sunday-worship", kind: "sunday", name: "Sunday Worship", themeKey: "sunday", enabled: true, schedule: { dayOfWeek: 0, localTime: "11:30", timezone: "America/New_York", durationMinutes: 90 }, defaultMeetUrl: MEET, joinWindowMinutes: 30, updatedAt: STAMP };
const wednesday: GatheringSeries = { ...sunday, id: "wednesday-word", slug: "wednesday-word", kind: "wednesday", name: "Wednesday Word", themeKey: "wednesday", schedule: { dayOfWeek: 3, localTime: "19:30", timezone: "America/New_York", durationMinutes: 120 } };
function store(): GatheringStoreV1 { return { schemaVersion: 1, revision: 0, updatedAt: STAMP, series: structuredClone([sunday, wednesday]), occurrences: [], reminderDeliveries: [], legacyRecordingsImported: true }; }
class MemoryStorage implements GatheringStorage {
  values = new Map<string, unknown>();
  async get<T>(key: string) { return (this.values.get(key) as T) ?? null; }
  async set<T>(key: string, value: T) { this.values.set(key, structuredClone(value)); }
}

describe("automatic weekly gatherings", () => {
  it("features Sunday until exactly 1PM Eastern, then Wednesday, without any published sermon", () => {
    const current = serializePublicGatherings(store(), new Date("2026-10-25T16:59:59.000Z"));
    expect(current.featured).toMatchObject({ seriesId: sunday.id, title: "Sunday Worship", scripture: "", description: "", startsAt: "2026-10-25T15:30:00.000Z", endsAt: "2026-10-25T17:00:00.000Z", joinUrl: MEET });
    const next = serializePublicGatherings(store(), new Date("2026-10-25T17:00:00.000Z"));
    expect(next.featured).toMatchObject({ seriesId: wednesday.id, startsAt: "2026-10-28T23:30:00.000Z", endsAt: "2026-10-29T01:30:00.000Z" });
    expect(next.featured).not.toHaveProperty("joinUrl");
  });
  it("features Sunday after Wednesday ends and preserves wall-clock time through fall DST", () => {
    const beforeEnd = serializePublicGatherings(store(), new Date("2026-10-29T01:29:59.000Z"));
    expect(beforeEnd.featured?.seriesId).toBe(wednesday.id);
    const afterEnd = serializePublicGatherings(store(), new Date("2026-10-29T01:30:00.000Z"));
    expect(afterEnd.featured).toMatchObject({ seriesId: sunday.id, startsAt: "2026-11-01T16:30:00.000Z", endsAt: "2026-11-01T18:00:00.000Z" });
  });
  it("survives months without new content and never copies an old sermon", () => {
    const value = store();
    value.occurrences.push({ ...recurringOccurrence(sunday, "2026-10-18"), isRecurring: false, title: "Last month's sermon", scripture: "John 3:16", description: "Specific old sermon" });
    const publicValue = serializePublicGatherings(value, new Date("2027-03-14T14:00:00.000Z"));
    expect(publicValue.featured).toMatchObject({ title: "Sunday Worship", scripture: "", description: "", startsAt: "2027-03-14T15:30:00.000Z" });
  });
  it("honors explicit published times, drafts, and cancelled dates instead of regenerating them", () => {
    const value = store();
    value.occurrences.push({ ...recurringOccurrence(wednesday, "2026-10-28"), status: "cancelled" });
    expect(serializePublicGatherings(value, new Date("2026-10-25T17:00:00.000Z")).featured?.localDate).toBe("2026-11-01");
    value.occurrences[0].status = "draft";
    expect(serializePublicGatherings(value, new Date("2026-10-25T17:00:00.000Z")).featured?.localDate).toBe("2026-11-01");
    value.occurrences[0] = { ...value.occurrences[0], status: "published", title: "A dated message", startsAt: "2026-10-28T22:00:00.000Z" };
    const publicValue = serializePublicGatherings(value, new Date("2026-10-25T17:00:00.000Z"));
    expect(publicValue.featured).toMatchObject({ title: "A dated message", startsAt: "2026-10-28T22:00:00.000Z" });
    expect(publicValue.upcoming.filter((item) => item.seriesId === wednesday.id && item.localDate === "2026-10-28")).toHaveLength(1);
  });
  it("finds the next weekly service even after many consecutive cancelled weeks", () => {
    const value = store(); value.series = [sunday];
    for (const date of ["2026-10-25", "2026-11-01", "2026-11-08", "2026-11-15", "2026-11-22", "2026-11-29"]) value.occurrences.push({ ...recurringOccurrence(sunday, date), status: "cancelled" });
    expect(serializePublicGatherings(value, new Date("2026-10-24T12:00:00.000Z")).featured?.localDate).toBe("2026-12-06");
  });
  it("does not report a manually live future occurrence as live before its start", () => {
    const value = store(); value.occurrences.push({ ...recurringOccurrence(sunday, "2026-10-25"), status: "live" });
    expect(serializePublicGatherings(value, new Date("2026-10-25T12:00:00.000Z")).featured?.status).toBe("published");
  });
  it("does not synthesize disabled or special services", () => {
    const value = store();
    value.series = [{ ...sunday, enabled: false }, { ...wednesday, kind: "special" }];
    expect(scheduledOccurrences(value)).toEqual([]);
  });
  it("automatically exposes an ended published replay while featuring the next service", () => {
    const value = store();
    value.occurrences.push({ ...recurringOccurrence(sunday, "2026-10-25"), isRecurring: false, replayUrl: "https://youtu.be/a-real-recording" });
    const response = serializePublicGatherings(value, new Date("2026-10-25T17:00:00.000Z"));
    expect(response.featured?.seriesId).toBe(wednesday.id);
    expect(response.recent[0]).toMatchObject({ status: "completed", replayUrl: "https://youtu.be/a-real-recording" });
    expect(response.recent[0]).not.toHaveProperty("joinUrl");
  });
  it("keeps a deleted recurring date cancelled and permits attaching a replay to a past generic service", async () => {
    const memory = new MemoryStorage(); memory.values.set(GATHERINGS_KEY, store());
    const repository = new GatheringRepository(memory);
    const now = new Date("2026-10-25T17:00:00.000Z");
    const skipped = await repository.deleteOccurrence("wednesday-word:2026-10-28", 0, now);
    expect(skipped.occurrences[0].status).toBe("cancelled");
    expect(serializePublicGatherings(skipped, now).featured?.seriesId).toBe(sunday.id);
    const recording = { ...recurringOccurrence(sunday, "2026-10-25"), status: "completed" as const, replayUrl: "https://youtu.be/real-replay" };
    const saved = await repository.upsertOccurrence(recording, 1, now);
    expect(serializePublicGatherings(saved, now).recent[0].replayUrl).toBe(recording.replayUrl);
    await expect(repository.upsertOccurrence({ ...recording, ...recurringOccurrence(sunday, "2026-11-01"), status: "completed" }, 2, now)).rejects.toThrow(/after the gathering ends/);
  });
});

describe("compatible ministry defaults and recordings", () => {
  it("uses the confirmed Wednesday time/shared Meet and preserves independently configured settings", () => {
    const value = store(); value.series[1] = { ...wednesday, enabled: false, schedule: null, defaultMeetUrl: "" };
    expect(applyWeeklyDefaults(value).series[1]).toMatchObject({ enabled: true, defaultMeetUrl: MEET, schedule: { localTime: "19:30", durationMinutes: 120, timezone: "America/New_York" } });
    const configured = { ...wednesday, enabled: false, defaultMeetUrl: "https://meet.google.com/other-room-abc" };
    value.series[1] = configured;
    expect(applyWeeklyDefaults(value).series[1]).toEqual(configured);
    value.series[0].defaultMeetUrl = ""; value.series[1] = { ...wednesday, schedule: null, defaultMeetUrl: "", enabled: false };
    expect(applyWeeklyDefaults(value).series[1].enabled).toBe(false);
  });
  it("normalizes oversized legacy fields so saving another series remains possible", async () => {
    const memory = new MemoryStorage();
    memory.values.set(LEGACY_CONTENT_KEY, { thisSunday: { date: "2026-10-25", title: "T".repeat(200), scripture: "S".repeat(200), description: "D".repeat(4000) }, googleMeetLink: MEET });
    const repository = new GatheringRepository(memory);
    const initial = await repository.getEffectiveStore(new Date(STAMP));
    expect(initial.occurrences[0]).toMatchObject({ title: "T".repeat(120), scripture: "S".repeat(100), description: "D".repeat(2000) });
    await expect(repository.upsertSeries(initial.series[1], 0, new Date(STAMP))).resolves.toMatchObject({ revision: 1 });
  });
  it("defaults an incomplete Sunday to 11:30–1 and preserves a configured start", () => {
    const defaultValue = normalizeLegacyGatherings(null, new Date(STAMP));
    expect(defaultValue.series[0].schedule).toMatchObject({ localTime: "11:30", durationMinutes: 90 });
    expect(normalizeLegacyGatherings({ serviceSchedule: { hour: 8, minute: 15, dayOfWeek: 0, timezone: "America/New_York" } }).series[0].schedule?.localTime).toBe("08:15");
  });
  it("preserves real legacy recordings, deduplicates URLs, rejects unsafe links, and labels unknown dates", () => {
    const value = { ...store(), legacyRecordingsImported: false };
    const imported = importLegacyRecordings(value, { youtubeVideos: [{ id: "old", title: "Real old message", scripture: "John 3:16", date: "2026-10-18", url: "https://youtu.be/real-old" }, { id: "unknown", title: "An undated message", url: "https://youtu.be/undated" }, { id: "duplicate", url: "https://youtu.be/real-old" }, { id: "unsafe", url: "javascript:alert(1)" }] }, new Date(STAMP));
    expect(parseGatheringStore(imported).occurrences).toHaveLength(2);
    const publicValue = serializePublicGatherings(imported, new Date(STAMP));
    expect(publicValue.recent).toEqual(expect.arrayContaining([expect.objectContaining({ title: "Real old message", replayUrl: "https://youtu.be/real-old" }), expect.objectContaining({ title: "An undated message", dateUnknown: true })]));
    expect(importLegacyRecordings(imported, { youtubeVideos: [{ url: "https://youtu.be/new" }] }).occurrences).toHaveLength(2);
  });
});
