import { describe, expect, it } from "vitest";
import {
  EventRepository,
  EventRevisionConflictError,
  EventValidationError,
  type EventStorage,
  eventCalendar,
  normalizeLegacyEvents,
  parseMinistryEvent,
  parseMinistryEventInput,
  serializePublicEvents,
  selectPublicEvent,
} from "./index";

class MemoryStorage implements EventStorage {
  values = new Map<string, unknown>();
  failWrites = false;
  async get<T>(key: string) { return (this.values.get(key) as T | undefined) ?? null; }
  async set<T>(key: string, value: T) { if (this.failWrites) throw new Error("storage unavailable"); this.values.set(key, structuredClone(value)); }
  async compareAndSet<T>(key: string, expectedRevision: number, value: T) {
    if (this.failWrites) throw new Error("storage unavailable");
    const current = this.values.get(key) as { revision?: number } | undefined;
    const actualRevision = current?.revision ?? 0;
    if (actualRevision !== expectedRevision) return { saved: false, actualRevision };
    this.values.set(key, structuredClone(value));
    return { saved: true, actualRevision: expectedRevision + 1 };
  }
}

const NOW = new Date("2030-08-09T12:00:00.000Z");
const input = {
  title: "Community Bible Workshop",
  description: "Bring your Bible and your questions.",
  startsAt: "2030-08-10T23:00:00.000Z",
  endsAt: "2030-08-11T00:30:00.000Z",
  timezone: "America/New_York",
  status: "published" as const,
  locationType: "online" as const,
  locationLabel: "Online",
  meetUrl: "https://meet.google.com/abc-defg-hij",
  registrationUrl: "https://example.org/register",
};

function stored(overrides: Record<string, unknown> = {}) {
  return parseMinistryEvent({
    ...input,
    id: "event-1",
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    ...overrides,
  });
}

describe("events domain", () => {
  it("rejects unknown fields, invalid timestamps, date order, timezone, and unsafe URLs", () => {
    expect(() => parseMinistryEventInput({ ...input, id: "client-id" })).toThrow(/Unsupported event fields/);
    expect(() => parseMinistryEventInput({ ...input, startsAt: "2030-08-10" })).toThrow(EventValidationError);
    expect(() => parseMinistryEventInput({ ...input, endsAt: input.startsAt })).toThrow(/after start/);
    expect(() => parseMinistryEventInput({ ...input, timezone: "Not/AZone" })).toThrow(/Timezone/);
    expect(() => parseMinistryEventInput({ ...input, meetUrl: "https://evil.example/room" })).toThrow(/meet.google.com/);
    expect(() => parseMinistryEventInput({ ...input, registrationUrl: "javascript:alert(1)" })).toThrow(/HTTPS/);
    expect(() => parseMinistryEventInput({ ...input, registrationUrl: "https://user:pass@example.org" })).toThrow(/HTTPS/);
  });

  it("requires a location/action before publishing while allowing valid drafts", () => {
    expect(() => parseMinistryEventInput({ ...input, meetUrl: "", registrationUrl: "" })).toThrow(/require a Meet or registration link/);
    expect(parseMinistryEventInput({ ...input, status: "draft", meetUrl: "", registrationUrl: "" }).status).toBe("draft");
    expect(() => parseMinistryEventInput({ ...input, locationType: "in-person", locationLabel: "", meetUrl: "" })).toThrow(/require a location/);
  });

  it("shows only published future events and hides Meet until the join window", () => {
    const draft = stored({ id: "draft", status: "draft" });
    const cancelled = stored({ id: "cancelled", status: "cancelled" });
    const past = stored({ id: "past", startsAt: "2030-08-01T23:00:00.000Z", endsAt: "2030-08-02T00:00:00.000Z" });
    const future = stored();
    const store = { schemaVersion: 1 as const, revision: 0, events: [draft, cancelled, past, future], updatedAt: NOW.toISOString() };
    const publicEvents = serializePublicEvents(store, NOW);
    expect(publicEvents).toHaveLength(1);
    expect(publicEvents[0]).not.toHaveProperty("joinUrl");
    expect(publicEvents[0]).not.toHaveProperty("meetUrl");
    expect(publicEvents[0]).not.toHaveProperty("status");
    expect(serializePublicEvents(store, new Date("2030-08-10T22:45:00.000Z"))[0].joinUrl).toBe(input.meetUrl);
    expect(serializePublicEvents(store, new Date("2030-08-10T23:30:00.000Z"))[0].joinUrl).toBe(input.meetUrl);
    expect(selectPublicEvent(store, "draft", NOW)).toBeNull();
    expect(selectPublicEvent(store, "cancelled", NOW)).toBeNull();
    expect(selectPublicEvent(store, "past", NOW)).toBeNull();
    expect(selectPublicEvent(store, "event-1", NOW)?.id).toBe("event-1");
  });

  it("migrates legacy event candidates as drafts for human review", () => {
    const store = normalizeLegacyEvents({ upcomingEvents: [{ id: "old", title: "Legacy event", description: "Review me", date: "2030-08-12", time: "19:00" }] }, NOW);
    expect(store.events[0]).toMatchObject({ id: "old", title: "Legacy event", status: "draft", timezone: "America/New_York" });
    expect(serializePublicEvents(store, NOW)).toEqual([]);
  });

  it("uses server IDs, atomic revisions, conflicts, and fail-loud storage", async () => {
    const storage = new MemoryStorage();
    const repository = new EventRepository(storage);
    const created = await repository.create(input, 0, NOW);
    expect(created.event.id).not.toBe("event-1");
    expect(created.store.revision).toBe(1);
    await expect(repository.update(created.event.id, { ...input, title: "Stale edit" }, 0, NOW)).rejects.toBeInstanceOf(EventRevisionConflictError);
    storage.failWrites = true;
    await expect(repository.create(input, 1, NOW)).rejects.toThrow("storage unavailable");
  });

  it("escapes and folds calendar content without exposing Meet", () => {
    const event = stored({
      title: "Workshop, prayer; and fellowship \\ together",
      description: `Line one\r\nATTENDEE:mailto:evil@example.com\rX-EVIL:yes\n${"Grace 🙏 ".repeat(20)}`,
      locationLabel: "Room 1; Building A",
    });
    const calendar = eventCalendar(event, NOW);
    expect(calendar).toContain("SUMMARY:Workshop\\, prayer\\; and fellowship \\\\ together");
    expect(calendar).toContain("Line one\\nATTENDEE:mailto:evil@example.com");
    expect(calendar).not.toContain("\r\nATTENDEE:");
    expect(calendar).not.toContain("\rX-EVIL:");
    expect(calendar).not.toContain(input.meetUrl);
    for (const line of calendar.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    const withoutEnd = eventCalendar(stored({ endsAt: undefined }), NOW);
    expect(withoutEnd).toContain("DTEND:20300811T030000Z");
  });
});
