import { describe, expect, it } from "vitest";
import {
  CARE_KEY,
  CareRecordNotFoundError,
  CareRepository,
  CareValidationError,
  type CareStorage,
  normalizeLegacyCare,
  parsePublicCareSubmission,
  serializePublicPrayers,
} from "./index";

class MemoryStorage implements CareStorage {
  values = new Map<string, unknown>();
  failWrites = false;

  async get<T>(key: string) {
    return (this.values.get(key) as T | undefined) ?? null;
  }

  async set<T>(key: string, value: T) {
    if (this.failWrites) throw new Error("storage unavailable");
    this.values.set(key, structuredClone(value));
  }

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

function prayer(overrides: Record<string, unknown> = {}) {
  return parsePublicCareSubmission({
    kind: "prayer",
    name: "Jordan",
    message: "Please pray for my family.",
    isAnonymous: false,
    contactPermission: false,
    ...overrides,
  });
}

describe("pastoral care domain", () => {
  it("defaults public prayer intake to private, pending, new, and normal", async () => {
    const repository = new CareRepository(new MemoryStorage());
    const { record } = await repository.addSubmission(prayer(), NOW);

    expect(record).toMatchObject({
      kind: "prayer",
      visibility: "private",
      moderationStatus: "pending",
      careStatus: "new",
      urgency: "normal",
      source: "prayer-form",
    });
  });

  it("treats public sharing as a review request, not instant publication", async () => {
    const repository = new CareRepository(new MemoryStorage());
    const { record, store } = await repository.addSubmission(prayer({ sharePublic: true }), NOW);
    expect(serializePublicPrayers(store)).toEqual([]);

    const approved = await repository.updateRecord(
      record.id,
      { moderationStatus: "approved" },
      store.revision,
      NOW,
    );
    expect(serializePublicPrayers(approved)).toHaveLength(1);
  });

  it("public serialization is an allowlist and hides every private field", async () => {
    const repository = new CareRepository(new MemoryStorage());
    const { record, store } = await repository.addSubmission(prayer({
      sharePublic: true,
      isAnonymous: true,
      contactPermission: true,
      email: "jordan@example.com",
      preferredContact: "email",
    }), NOW);
    const approved = await repository.updateRecord(
      record.id,
      {
        moderationStatus: "approved",
        urgency: "urgent",
        assignee: "Pastor Mike",
        followUpAt: "2030-08-10T12:00:00.000Z",
        privateNotes: "Call after work",
      },
      store.revision,
      NOW,
    );
    const output = JSON.stringify(serializePublicPrayers(approved));

    expect(output).toContain('"name":"Anonymous"');
    for (const forbidden of [
      "jordan@example.com", "contactPermission", "preferredContact", "urgency",
      "careStatus", "moderationStatus", "assignee", "followUpAt", "privateNotes",
      "source", "updatedAt",
    ]) expect(output).not.toContain(forbidden);
  });

  it("never permits visitor records to become public", async () => {
    const repository = new CareRepository(new MemoryStorage());
    const visitor = parsePublicCareSubmission({
      kind: "visitor",
      name: "Taylor",
      message: "I joined for the first time.",
      sharePublic: true,
      contactPermission: true,
      email: "taylor@example.com",
      preferredContact: "email",
    });
    const { record, store } = await repository.addSubmission(visitor, NOW);
    expect(record.visibility).toBe("private");
    await expect(repository.updateRecord(record.id, { visibility: "public" }, store.revision, NOW))
      .rejects.toThrow("Visitor records cannot be public");
  });

  it("rejects contact details without permission and internal field injection", () => {
    expect(() => prayer({ email: "private@example.com" })).toThrow(CareValidationError);
    expect(() => prayer({ urgency: "urgent" })).toThrow(/Unsupported submission fields/);
    expect(() => prayer({ privateNotes: "injected" })).toThrow(/Unsupported submission fields/);
  });

  it("quarantines legacy prayers as private and pending while preserving identity", () => {
    const store = normalizeLegacyCare([{
      id: "legacy-1",
      name: "Sam",
      request: "Sensitive family request",
      prayerCount: 4,
      createdAt: "2026-01-01T00:00:00.000Z",
      isAnonymous: false,
    }], NOW);
    expect(store.records[0]).toMatchObject({
      id: "legacy-1",
      prayerCount: 4,
      visibility: "private",
      moderationStatus: "pending",
      source: "legacy-prayer",
    });
    expect(serializePublicPrayers(store)).toEqual([]);
  });

  it("increments only approved public prayers", async () => {
    const repository = new CareRepository(new MemoryStorage());
    const pending = await repository.addSubmission(prayer({ sharePublic: true }), NOW);
    await expect(repository.incrementPrayer(pending.record.id, NOW)).rejects.toBeInstanceOf(CareRecordNotFoundError);
    const approved = await repository.updateRecord(
      pending.record.id,
      { moderationStatus: "approved" },
      pending.store.revision,
      NOW,
    );
    const incremented = await repository.incrementPrayer(pending.record.id, NOW);
    expect(incremented.store.revision).toBe(approved.revision + 1);
    expect(incremented.record.prayerCount).toBe(1);
  });

  it("preserves concurrent public submissions with atomic revisions", async () => {
    const storage = new MemoryStorage();
    const first = new CareRepository(storage);
    const second = new CareRepository(storage);
    await Promise.all([
      first.addSubmission(prayer({ message: "First request" }), NOW),
      second.addSubmission(prayer({ message: "Second request" }), NOW),
    ]);
    const stored = await storage.get<{ records: unknown[]; revision: number }>(CARE_KEY);
    expect(stored).toMatchObject({ revision: 2 });
    expect(stored?.records).toHaveLength(2);
  });

  it("fails loudly when durable storage cannot save", async () => {
    const storage = new MemoryStorage();
    storage.failWrites = true;
    await expect(new CareRepository(storage).addSubmission(prayer(), NOW))
      .rejects.toThrow("storage unavailable");
  });
});
