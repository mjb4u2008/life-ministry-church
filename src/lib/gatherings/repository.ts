import { kv } from "@vercel/kv";
import { normalizeLegacyGatherings } from "./legacy";
import { parseGatheringStore } from "./schema";
import type {
  GatheringOccurrence,
  GatheringSeries,
  GatheringStoreV1,
} from "./types";

export const GATHERINGS_KEY = "gatherings:v1";
export const LEGACY_CONTENT_KEY = "site-content";
export const LEGACY_BACKUP_KEY = "site-content:backup:gatherings-v1";

export interface GatheringStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<unknown>;
}

export class GatheringRevisionConflictError extends Error {
  constructor(
    public readonly expectedRevision: number,
    public readonly actualRevision: number,
  ) {
    super(
      `Expected gathering revision ${expectedRevision}, but found ${actualRevision}`,
    );
    this.name = "GatheringRevisionConflictError";
  }
}

const vercelStorage: GatheringStorage = {
  get: <T>(key: string) => kv.get<T>(key),
  set: <T>(key: string, value: T) => kv.set(key, value),
};

export class GatheringRepository {
  constructor(private readonly storage: GatheringStorage = vercelStorage) {}

  async getPersistedStore(): Promise<GatheringStoreV1 | null> {
    const value = await this.storage.get<unknown>(GATHERINGS_KEY);
    return value === null ? null : parseGatheringStore(value);
  }

  async getEffectiveStore(now = new Date()): Promise<GatheringStoreV1> {
    const persisted = await this.getPersistedStore();
    if (persisted) return persisted;
    const legacy = await this.storage.get<unknown>(LEGACY_CONTENT_KEY);
    return normalizeLegacyGatherings(legacy, now);
  }

  async upsertSeries(
    series: GatheringSeries,
    expectedRevision: number,
    now = new Date(),
  ): Promise<GatheringStoreV1> {
    return this.saveChange(expectedRevision, now, (current) => ({
      ...current,
      series: replaceById(current.series, series),
    }));
  }

  async upsertOccurrence(
    occurrence: GatheringOccurrence,
    expectedRevision: number,
    now = new Date(),
  ): Promise<GatheringStoreV1> {
    return this.saveChange(expectedRevision, now, (current) => ({
      ...current,
      occurrences: replaceById(current.occurrences, occurrence),
    }));
  }

  private async saveChange(
    expectedRevision: number,
    now: Date,
    change: (current: GatheringStoreV1) => GatheringStoreV1,
  ): Promise<GatheringStoreV1> {
    const persisted = await this.getPersistedStore();
    const legacy = persisted
      ? null
      : await this.storage.get<unknown>(LEGACY_CONTENT_KEY);
    const current = persisted ?? normalizeLegacyGatherings(legacy, now);
    if (current.revision !== expectedRevision) {
      throw new GatheringRevisionConflictError(
        expectedRevision,
        current.revision,
      );
    }

    const changed = change(current);
    const next = parseGatheringStore({
      ...changed,
      schemaVersion: 1,
      revision: current.revision + 1,
      updatedAt: now.toISOString(),
    });

    if (!persisted && legacy !== null) {
      const existingBackup = await this.storage.get<unknown>(LEGACY_BACKUP_KEY);
      if (existingBackup === null) {
        await this.storage.set(LEGACY_BACKUP_KEY, legacy);
      }
    }

    await this.storage.set(GATHERINGS_KEY, next);
    return next;
  }
}

function replaceById<T extends { id: string }>(items: T[], item: T): T[] {
  const index = items.findIndex((candidate) => candidate.id === item.id);
  if (index < 0) return [...items, item];
  return items.map((candidate, candidateIndex) =>
    candidateIndex === index ? item : candidate,
  );
}
