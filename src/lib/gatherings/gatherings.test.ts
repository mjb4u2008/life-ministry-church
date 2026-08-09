import { describe, expect, it } from "vitest";
import { normalizeLegacyGatherings } from "./legacy";
import {
  GATHERINGS_KEY,
  GatheringRepository,
  GatheringRevisionConflictError,
  LEGACY_BACKUP_KEY,
  LEGACY_CONTENT_KEY,
  type GatheringStorage,
} from "./repository";
import {
  GatheringValidationError,
  parseGatheringPutCommand,
  parseGatheringSeries,
  parseGatheringStore,
} from "./schema";
import {
  selectFeaturedOccurrence,
  serializePublicGatherings,
} from "./selectors";
import {
  MINISTRY_JOIN_WINDOW_MINUTES,
  MINISTRY_TIMEZONE,
  MINISTRY_TIMEZONE_LABEL,
  buildOccurrenceTimes,
  buildOccurrenceTimesFromLocalRange,
  zonedDateTimeToUtc,
} from "./time";
import type {
  GatheringOccurrence,
  GatheringSeries,
  GatheringStoreV1,
} from "./types";

const UPDATED_AT = "2026-08-01T12:00:00.000Z";
const MEET_URL = "https://meet.google.com/abc-defg-hij";

function series(
  values: Partial<GatheringSeries> & Pick<GatheringSeries, "id" | "kind">,
): GatheringSeries {
  return {
    slug: values.id,
    name: values.kind === "sunday" ? "Sunday Worship" : "Wednesday Word",
    enabled: true,
    themeKey: values.kind,
    schedule: {
      dayOfWeek: values.kind === "sunday" ? 0 : 3,
      localTime: values.kind === "sunday" ? "11:30" : "19:00",
      timezone: "America/New_York",
      durationMinutes: 90,
    },
    defaultMeetUrl: MEET_URL,
    joinWindowMinutes: 30,
    updatedAt: UPDATED_AT,
    ...values,
    id: values.id,
    kind: values.kind,
  };
}

function occurrence(
  values: Partial<GatheringOccurrence> &
    Pick<GatheringOccurrence, "id" | "seriesId" | "startsAt" | "endsAt">,
): GatheringOccurrence {
  return {
    localDate: values.startsAt.slice(0, 10),
    status: "published",
    title: "A message",
    scripture: "John 3:16",
    description: "A weekly message.",
    publishedAt: UPDATED_AT,
    updatedAt: UPDATED_AT,
    ...values,
    id: values.id,
    seriesId: values.seriesId,
    startsAt: values.startsAt,
    endsAt: values.endsAt,
  };
}

function store(overrides: Partial<GatheringStoreV1> = {}): GatheringStoreV1 {
  return {
    schemaVersion: 1,
    revision: 0,
    series: [
      series({ id: "sunday-worship", kind: "sunday" }),
      series({ id: "wednesday-word", kind: "wednesday" }),
    ],
    occurrences: [],
    reminderDeliveries: [],
    updatedAt: UPDATED_AT,
    ...overrides,
  };
}

class MemoryStorage implements GatheringStorage {
  readonly values = new Map<string, unknown>();
  failGet = false;
  failSet = false;

  async get<T>(key: string): Promise<T | null> {
    if (this.failGet) throw new Error("read unavailable");
    return this.values.has(key) ? (this.values.get(key) as T) : null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (this.failSet) throw new Error("write unavailable");
    this.values.set(key, structuredClone(value));
  }

  async compareAndSet<T>(
    key: string,
    expectedRevision: number,
    value: T,
  ): Promise<{ saved: boolean; actualRevision: number }> {
    if (this.failSet) throw new Error("write unavailable");
    const current = this.values.get(key) as { revision?: number } | undefined;
    const actualRevision = current?.revision ?? 0;
    if (actualRevision !== expectedRevision) {
      return { saved: false, actualRevision };
    }
    this.values.set(key, structuredClone(value));
    return { saved: true, actualRevision: expectedRevision + 1 };
  }
}

describe("gathering time helpers", () => {
  it("defines the shared Eastern ministry schedule", () => {
    expect(MINISTRY_TIMEZONE).toBe("America/New_York");
    expect(MINISTRY_TIMEZONE_LABEL).toBe("Eastern Time");
    expect(MINISTRY_JOIN_WINDOW_MINUTES).toBe(30);
  });

  it("converts Eastern wall time using the correct offset across DST", () => {
    expect(
      zonedDateTimeToUtc("2026-03-01", "11:30", "America/New_York").toISOString(),
    ).toBe("2026-03-01T16:30:00.000Z");
    expect(
      zonedDateTimeToUtc("2026-03-15", "11:30", "America/New_York").toISOString(),
    ).toBe("2026-03-15T15:30:00.000Z");
    expect(
      zonedDateTimeToUtc("2026-11-08", "11:30", "America/New_York").toISOString(),
    ).toBe("2026-11-08T16:30:00.000Z");
  });

  it("builds an exact end timestamp from the configured duration", () => {
    expect(
      buildOccurrenceTimes(
        "2026-08-12",
        "19:00",
        "America/New_York",
        90,
      ),
    ).toEqual({
      startsAt: "2026-08-12T23:00:00.000Z",
      endsAt: "2026-08-13T00:30:00.000Z",
    });
  });

  it("builds explicit Eastern start and end timestamps across standard and daylight time", () => {
    expect(
      buildOccurrenceTimesFromLocalRange(
        "2026-01-11",
        "11:30",
        "13:00",
        MINISTRY_TIMEZONE,
      ),
    ).toEqual({
      startsAt: "2026-01-11T16:30:00.000Z",
      endsAt: "2026-01-11T18:00:00.000Z",
    });
    expect(
      buildOccurrenceTimesFromLocalRange(
        "2026-08-12",
        "19:00",
        "20:30",
        MINISTRY_TIMEZONE,
      ),
    ).toEqual({
      startsAt: "2026-08-12T23:00:00.000Z",
      endsAt: "2026-08-13T00:30:00.000Z",
    });
  });

  it("rejects an explicit end time that is not later than the start", () => {
    expect(() =>
      buildOccurrenceTimesFromLocalRange(
        "2026-08-12",
        "19:00",
        "19:00",
        MINISTRY_TIMEZONE,
      ),
    ).toThrow("End time must be later than start time");
    expect(() =>
      buildOccurrenceTimesFromLocalRange(
        "2026-08-12",
        "19:00",
        "18:59",
        MINISTRY_TIMEZONE,
      ),
    ).toThrow("End time must be later than start time");
  });
});

describe("legacy gathering normalization", () => {
  it("preserves Sunday details and creates an unconfigured disabled Wednesday", () => {
    const normalized = normalizeLegacyGatherings(
      {
        thisSunday: {
          date: "2026-08-16",
          title: "Grace for Today",
          scripture: "2 Corinthians 12:9",
          description: "God meets us here.",
        },
        weeklyMessage: { title: "Old title" },
        serviceSchedule: {
          dayOfWeek: 0,
          hour: 11,
          minute: 30,
          timezone: "America/New_York",
        },
        googleMeetLink: MEET_URL,
        lastUpdated: UPDATED_AT,
      },
      new Date("2026-08-09T12:00:00.000Z"),
    );

    expect(normalized.revision).toBe(0);
    expect(normalized.series[0]).toMatchObject({
      id: "sunday-worship",
      defaultMeetUrl: MEET_URL,
      schedule: {
        localTime: "11:30",
        timezone: "America/New_York",
      },
    });
    expect(normalized.series[1]).toMatchObject({
      id: "wednesday-word",
      enabled: false,
      schedule: null,
    });
    expect(normalized.occurrences[0]).toMatchObject({
      title: "Grace for Today",
      scripture: "2 Corinthians 12:9",
      description: "God meets us here.",
      startsAt: "2026-08-16T15:30:00.000Z",
    });
  });

  it("uses weeklyMessage only for missing Sunday fields", () => {
    const normalized = normalizeLegacyGatherings(
      {
        thisSunday: { date: "2026-08-16", title: "" },
        weeklyMessage: {
          title: "Fallback title",
          scripture: "Psalm 23",
          description: "Fallback description",
        },
      },
      new Date("2026-08-09T12:00:00.000Z"),
    );
    expect(normalized.occurrences[0]).toMatchObject({
      title: "Fallback title",
      scripture: "Psalm 23",
      description: "Fallback description",
    });
  });
});

describe("gathering selection and public privacy", () => {
  const sunday = occurrence({
    id: "sunday-worship:2026-08-16",
    seriesId: "sunday-worship",
    startsAt: "2026-08-16T15:30:00.000Z",
    endsAt: "2026-08-16T17:00:00.000Z",
  });
  const wednesday = occurrence({
    id: "wednesday-word:2026-08-12",
    seriesId: "wednesday-word",
    startsAt: "2026-08-12T23:00:00.000Z",
    endsAt: "2026-08-13T00:30:00.000Z",
  });
  const fixture = store({ occurrences: [sunday, wednesday] });

  it("selects Wednesday on Monday and Sunday after Wednesday", () => {
    expect(
      selectFeaturedOccurrence(
        fixture,
        new Date("2026-08-10T12:00:00.000Z"),
      )?.id,
    ).toBe(wednesday.id);
    expect(
      selectFeaturedOccurrence(
        fixture,
        new Date("2026-08-13T12:00:00.000Z"),
      )?.id,
    ).toBe(sunday.id);
  });

  it("keeps stored Meet URLs private until the join window", () => {
    const early = serializePublicGatherings(
      fixture,
      new Date("2026-08-12T22:00:00.000Z"),
    );
    expect(early.featured?.id).toBe(wednesday.id);
    expect(early.featured).not.toHaveProperty("joinUrl");
    expect(JSON.stringify(early)).not.toContain(MEET_URL);

    const joinable = serializePublicGatherings(
      fixture,
      new Date("2026-08-12T22:45:00.000Z"),
    );
    expect(joinable.featured?.joinUrl).toBe(MEET_URL);
    expect(joinable.series[0]).not.toHaveProperty("defaultMeetUrl");
  });

  it("excludes draft occurrences and disabled series", () => {
    const hidden = store({
      series: [fixture.series[0], { ...fixture.series[1], enabled: false }],
      occurrences: [
        sunday,
        { ...wednesday, status: "draft" },
      ],
    });
    const result = serializePublicGatherings(
      hidden,
      new Date("2026-08-10T12:00:00.000Z"),
    );
    expect(result.featured?.id).toBe(sunday.id);
    expect(result.upcoming.map((item) => item.id)).toEqual([sunday.id]);
  });
});

describe("gathering validation", () => {
  it("rejects invalid timezone and Meet hosts", () => {
    expect(() =>
      parseGatheringSeries({
        ...series({ id: "sunday-worship", kind: "sunday" }),
        defaultMeetUrl: "https://example.com/not-a-meet",
        schedule: {
          dayOfWeek: 0,
          localTime: "11:30",
          timezone: "Mars/Olympus_Mons",
          durationMinutes: 90,
        },
      }),
    ).toThrow(GatheringValidationError);
  });

  it("rejects an occurrence that references a missing series", () => {
    expect(() =>
      parseGatheringStore(
        store({
          occurrences: [
            occurrence({
              id: "unknown:2026-08-12",
              seriesId: "unknown",
              startsAt: "2026-08-12T23:00:00.000Z",
              endsAt: "2026-08-13T00:30:00.000Z",
            }),
          ],
        }),
      ),
    ).toThrow(/references missing series/);
  });

  it("parses a revision-protected delete occurrence command", () => {
    expect(
      parseGatheringPutCommand({
        operation: "delete-occurrence",
        expectedRevision: 4,
        occurrenceId: "wednesday-word:2026-08-12",
      }),
    ).toEqual({
      operation: "delete-occurrence",
      expectedRevision: 4,
      occurrenceId: "wednesday-word:2026-08-12",
    });
  });

  it("rejects malformed delete IDs and revisions", () => {
    expect(() =>
      parseGatheringPutCommand({
        operation: "delete-occurrence",
        expectedRevision: 4,
        occurrenceId: "Not a valid ID!",
      }),
    ).toThrow(/occurrenceId is invalid/);
    expect(() =>
      parseGatheringPutCommand({
        operation: "delete-occurrence",
        expectedRevision: -1,
        occurrenceId: "wednesday-word:2026-08-12",
      }),
    ).toThrow(/expectedRevision must be a non-negative integer/);
  });

  it("keeps every existing stored occurrence status readable", () => {
    const statuses: GatheringOccurrence["status"][] = [
      "draft",
      "published",
      "live",
      "completed",
      "cancelled",
    ];
    expect(() =>
      parseGatheringStore(
        store({
          occurrences: statuses.map((status, index) =>
            occurrence({
              id: `sunday-worship:2026-08-${String(10 + index).padStart(2, "0")}`,
              seriesId: "sunday-worship",
              startsAt: `2026-08-${String(10 + index).padStart(2, "0")}T15:30:00.000Z`,
              endsAt: `2026-08-${String(10 + index).padStart(2, "0")}T17:00:00.000Z`,
              status,
            }),
          ),
        }),
      ),
    ).not.toThrow();
  });
});

describe("GatheringRepository", () => {
  const legacy = {
    thisSunday: {
      date: "2026-08-16",
      title: "Legacy Sunday",
      scripture: "Psalm 100",
      description: "Come worship.",
    },
    serviceSchedule: {
      dayOfWeek: 0,
      hour: 11,
      minute: 30,
      timezone: "America/New_York",
    },
    googleMeetLink: MEET_URL,
    lastUpdated: UPDATED_AT,
  };

  it("backs up legacy data on first save and keeps Sunday unchanged when editing Wednesday", async () => {
    const storage = new MemoryStorage();
    storage.values.set(LEGACY_CONTENT_KEY, structuredClone(legacy));
    const repository = new GatheringRepository(storage);
    const initial = await repository.getEffectiveStore(
      new Date("2026-08-09T12:00:00.000Z"),
    );
    const originalSunday = structuredClone(initial.series[0]);
    const wednesday = {
      ...initial.series[1],
      enabled: true,
      schedule: {
        dayOfWeek: 3 as const,
        localTime: "19:00",
        timezone: "America/New_York",
        durationMinutes: 90,
      },
      updatedAt: "2026-08-09T13:00:00.000Z",
    };

    const saved = await repository.upsertSeries(
      wednesday,
      0,
      new Date("2026-08-09T13:00:00.000Z"),
    );

    expect(saved.revision).toBe(1);
    expect(saved.series.find((item) => item.id === "sunday-worship")).toEqual(
      originalSunday,
    );
    expect(saved.series.find((item) => item.id === "wednesday-word")).toEqual(
      wednesday,
    );
    expect(storage.values.get(LEGACY_BACKUP_KEY)).toEqual(legacy);
    expect(storage.values.get(GATHERINGS_KEY)).toEqual(saved);
  });

  it("rejects stale revisions without changing persisted data", async () => {
    const storage = new MemoryStorage();
    const existing = store({ revision: 4 });
    storage.values.set(GATHERINGS_KEY, existing);
    const repository = new GatheringRepository(storage);

    await expect(
      repository.upsertSeries(existing.series[1], 3),
    ).rejects.toBeInstanceOf(GatheringRevisionConflictError);
    expect(storage.values.get(GATHERINGS_KEY)).toEqual(existing);
  });

  it("deletes only the selected occurrence and advances the revision", async () => {
    const storage = new MemoryStorage();
    const sunday = occurrence({
      id: "sunday-worship:2026-08-16",
      seriesId: "sunday-worship",
      startsAt: "2026-08-16T15:30:00.000Z",
      endsAt: "2026-08-16T17:00:00.000Z",
    });
    const wednesday = occurrence({
      id: "wednesday-word:2026-08-12",
      seriesId: "wednesday-word",
      startsAt: "2026-08-12T23:00:00.000Z",
      endsAt: "2026-08-13T00:30:00.000Z",
    });
    const existing = store({
      occurrences: [sunday, wednesday],
      reminderDeliveries: [
        {
          occurrenceId: wednesday.id,
          reminderType: "weekly-email:one",
          status: "sent",
          sentAt: "2026-08-10T12:00:00.000Z",
        },
      ],
    });
    storage.values.set(GATHERINGS_KEY, structuredClone(existing));

    const saved = await new GatheringRepository(storage).deleteOccurrence(
      wednesday.id,
      existing.revision,
      new Date("2026-08-10T13:00:00.000Z"),
    );

    expect(saved.revision).toBe(1);
    expect(saved.series).toEqual(existing.series);
    expect(saved.occurrences).toEqual([sunday]);
    expect(saved.reminderDeliveries).toEqual(existing.reminderDeliveries);
    expect(storage.values.get(GATHERINGS_KEY)).toEqual(saved);
  });

  it("rejects a stale occurrence delete without changing persisted data", async () => {
    const storage = new MemoryStorage();
    const existing = store({
      revision: 4,
      occurrences: [
        occurrence({
          id: "wednesday-word:2026-08-12",
          seriesId: "wednesday-word",
          startsAt: "2026-08-12T23:00:00.000Z",
          endsAt: "2026-08-13T00:30:00.000Z",
        }),
      ],
    });
    storage.values.set(GATHERINGS_KEY, structuredClone(existing));

    await expect(
      new GatheringRepository(storage).deleteOccurrence(
        "wednesday-word:2026-08-12",
        3,
      ),
    ).rejects.toBeInstanceOf(GatheringRevisionConflictError);
    expect(storage.values.get(GATHERINGS_KEY)).toEqual(existing);
  });

  it("surfaces storage read and write failures", async () => {
    const readStorage = new MemoryStorage();
    readStorage.failGet = true;
    await expect(
      new GatheringRepository(readStorage).getEffectiveStore(),
    ).rejects.toThrow("read unavailable");

    const writeStorage = new MemoryStorage();
    writeStorage.values.set(LEGACY_CONTENT_KEY, legacy);
    const repository = new GatheringRepository(writeStorage);
    const initial = await repository.getEffectiveStore(
      new Date("2026-08-09T12:00:00.000Z"),
    );
    writeStorage.failSet = true;
    await expect(
      repository.upsertSeries(initial.series[1], 0),
    ).rejects.toThrow("write unavailable");
    expect(writeStorage.values.has(GATHERINGS_KEY)).toBe(false);
  });

  it("allows only one writer to commit the same expected revision", async () => {
    const storage = new MemoryStorage();
    const existing = store({ revision: 2 });
    storage.values.set(GATHERINGS_KEY, existing);
    const first = new GatheringRepository(storage);
    const second = new GatheringRepository(storage);

    const results = await Promise.allSettled([
      first.upsertSeries(
        { ...existing.series[0], name: "First writer" },
        2,
        new Date("2026-08-09T14:00:00.000Z"),
      ),
      second.upsertSeries(
        { ...existing.series[0], name: "Second writer" },
        2,
        new Date("2026-08-09T14:00:00.000Z"),
      ),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect((storage.values.get(GATHERINGS_KEY) as GatheringStoreV1).revision).toBe(3);
  });

  it("atomically leases, completes, and retains one scheduled recipient reminder", async () => {
    const storage = new MemoryStorage();
    storage.values.set(GATHERINGS_KEY, store());
    const first = new GatheringRepository(storage);
    const second = new GatheringRepository(storage);
    const results = await Promise.all([
      first.claimReminderDelivery("wednesday:2030-08-14", "weekly-reminder", new Date("2030-08-10T12:00:00.000Z")),
      second.claimReminderDelivery("wednesday:2030-08-14", "weekly-reminder", new Date("2030-08-10T12:00:00.000Z")),
    ]);
    expect(results.filter((result) => result.claimed)).toHaveLength(1);
    expect((storage.values.get(GATHERINGS_KEY) as GatheringStoreV1).reminderDeliveries).toHaveLength(1);
    const lease = results.find((result) => result.claimed);
    if (!lease?.claimed) throw new Error("Expected one lease owner");
    await first.completeReminderDelivery(
      "wednesday:2030-08-14",
      "weekly-reminder",
      lease.leaseId,
      new Date("2030-08-10T12:01:00.000Z"),
    );
    const retry = await second.claimReminderDelivery(
      "wednesday:2030-08-14",
      "weekly-reminder",
      new Date("2030-08-10T12:20:00.000Z"),
    );
    expect(retry.claimed).toBe(false);
    expect((storage.values.get(GATHERINGS_KEY) as GatheringStoreV1).reminderDeliveries[0]).toMatchObject({ status: "sent" });
  });

  it("releases failed leases and recovers stale in-progress deliveries", async () => {
    const storage = new MemoryStorage();
    storage.values.set(GATHERINGS_KEY, store());
    const repository = new GatheringRepository(storage);
    const firstLease = await repository.claimReminderDelivery("wednesday:2030-08-14", "weekly-email:one", new Date("2030-08-10T12:00:00.000Z"));
    if (!firstLease.claimed) throw new Error("Expected first lease");
    await repository.releaseReminderDelivery("wednesday:2030-08-14", "weekly-email:one", firstLease.leaseId, new Date("2030-08-10T12:01:00.000Z"));
    expect((await repository.claimReminderDelivery("wednesday:2030-08-14", "weekly-email:one", new Date("2030-08-10T12:02:00.000Z"))).claimed).toBe(true);
    expect((await repository.claimReminderDelivery("wednesday:2030-08-14", "weekly-email:one", new Date("2030-08-10T12:20:00.000Z"), true)).claimed).toBe(true);
  });

  it("fences an expired worker from changing a replacement lease", async () => {
    const storage = new MemoryStorage();
    storage.values.set(GATHERINGS_KEY, store());
    const repository = new GatheringRepository(storage);
    const expired = await repository.claimReminderDelivery("wednesday:2030-08-14", "weekly-email:one", new Date("2030-08-10T12:00:00.000Z"));
    const replacement = await repository.claimReminderDelivery("wednesday:2030-08-14", "weekly-email:one", new Date("2030-08-10T12:20:00.000Z"), true);
    if (!expired.claimed || !replacement.claimed) throw new Error("Expected both sequential leases");

    expect(await repository.ownsReminderLease("wednesday:2030-08-14", "weekly-email:one", expired.leaseId)).toBe(false);
    expect(await repository.ownsReminderLease("wednesday:2030-08-14", "weekly-email:one", replacement.leaseId)).toBe(true);

    expect((await repository.releaseReminderDelivery("wednesday:2030-08-14", "weekly-email:one", expired.leaseId, new Date("2030-08-10T12:21:00.000Z"))).updated).toBe(false);
    expect((await repository.completeReminderDelivery("wednesday:2030-08-14", "weekly-email:one", expired.leaseId, new Date("2030-08-10T12:22:00.000Z"))).updated).toBe(false);
    expect((await repository.completeReminderDelivery("wednesday:2030-08-14", "weekly-email:one", replacement.leaseId, new Date("2030-08-10T12:23:00.000Z"))).updated).toBe(true);

    expect((storage.values.get(GATHERINGS_KEY) as GatheringStoreV1).reminderDeliveries[0]).toMatchObject({
      leaseId: replacement.leaseId,
      status: "sent",
    });
  });
});
