import { kv } from "@vercel/kv";
import { compareAndSetRevision } from "@/lib/revision-storage";
import { applyWeeklyDefaults, importLegacyRecordings, normalizeLegacyGatherings } from "./legacy";
import { scheduledOccurrences } from "./recurrence";
import { GatheringValidationError, parseGatheringStore } from "./schema";
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
  compareAndSet?<T>(
    key: string,
    expectedRevision: number,
    value: T,
  ): Promise<{ saved: boolean; actualRevision: number }>;
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
  compareAndSet: compareAndSetRevision,
};

export class GatheringRepository {
  constructor(private readonly storage: GatheringStorage = vercelStorage) {}

  async getPersistedStore(): Promise<GatheringStoreV1 | null> {
    const value = await this.storage.get<unknown>(GATHERINGS_KEY);
    return value === null ? null : parseGatheringStore(value);
  }

  async getEffectiveStore(now = new Date()): Promise<GatheringStoreV1> {
    const persisted = await this.getPersistedStore();
    const legacy = !persisted?.legacyRecordingsImported
      ? await this.storage.get<unknown>(LEGACY_CONTENT_KEY)
      : null;
    return persisted
      ? applyWeeklyDefaults(importLegacyRecordings(persisted, legacy, now))
      : normalizeLegacyGatherings(legacy, now);
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
    if (occurrence.status === "completed" && Date.parse(occurrence.endsAt) > now.getTime()) {
      throw new GatheringValidationError(["A replay can only be attached after the gathering ends"]);
    }
    return this.saveChange(expectedRevision, now, (current) => ({
      ...current,
      occurrences: replaceById(current.occurrences, occurrence),
    }));
  }

  async publishOccurrence(
    series: GatheringSeries,
    occurrence: GatheringOccurrence,
    expectedRevision: number,
    now = new Date(),
  ): Promise<GatheringStoreV1> {
    const issues: string[] = [];
    if (occurrence.seriesId !== series.id) {
      issues.push("occurrence.seriesId must match series.id");
    }
    if (!series.enabled) {
      issues.push("series.enabled must be true when publishing");
    }
    if (occurrence.status !== "published") {
      issues.push("occurrence.status must be published");
    }
    const endsAt = Date.parse(occurrence.endsAt);
    if (Number.isNaN(endsAt)) {
      issues.push("occurrence.endsAt must be a canonical ISO timestamp");
    } else if (endsAt <= now.getTime()) {
      issues.push("occurrence.endsAt must be in the future when publishing");
    }
    if (issues.length > 0) throw new GatheringValidationError(issues);

    return this.saveChange(expectedRevision, now, (current) => ({
      ...current,
      series: replaceById(current.series, series),
      occurrences: replaceById(current.occurrences, occurrence),
    }));
  }

  async deleteOccurrence(
    occurrenceId: string,
    expectedRevision: number,
    now = new Date(),
  ): Promise<GatheringStoreV1> {
    return this.saveChange(expectedRevision, now, (current) => {
      const occurrence = scheduledOccurrences(current, now, true).find((item) => item.id === occurrenceId);
      if (!occurrence) throw new GatheringValidationError(["Gathering not found"]);
      // Retain a date exception so automatic recurrence cannot recreate a skipped service.
      const cancelled = { ...occurrence, status: "cancelled" as const, updatedAt: now.toISOString() };
      return {
        ...current,
        occurrences: replaceById(current.occurrences, cancelled),
        reminderDeliveries: current.reminderDeliveries.filter((delivery) => delivery.occurrenceId !== occurrenceId),
      };
    });
  }

  async claimReminderDelivery(
    occurrenceId: string,
    reminderType: string,
    now = new Date(),
    allowStaleRecovery = false,
  ): Promise<
    | { claimed: true; leaseId: string; store: GatheringStoreV1 }
    | { claimed: false; store: GatheringStoreV1 }
  > {
    const leaseMilliseconds = 10 * 60 * 1000;
    const leaseId = crypto.randomUUID();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const current = await this.getEffectiveStore(now);
      const existing = current.reminderDeliveries.find(
        (delivery) =>
          delivery.occurrenceId === occurrenceId &&
          delivery.reminderType === reminderType,
      );
      const staleLeaseCanBeRecovered = existing?.status === "sending" &&
        allowStaleRecovery &&
        now.getTime() - Date.parse(existing.sentAt) >= leaseMilliseconds;
      if (existing && !staleLeaseCanBeRecovered) {
        return { claimed: false, store: current };
      }
      try {
        const store = await this.saveChange(current.revision, now, (value) => ({
          ...value,
          reminderDeliveries: [
            ...value.reminderDeliveries.filter(
              (delivery) =>
                delivery.occurrenceId !== occurrenceId ||
                delivery.reminderType !== reminderType,
            ),
            { occurrenceId, reminderType, status: "sending", leaseId, sentAt: now.toISOString() },
          ],
        }));
        return { claimed: true, leaseId, store };
      } catch (error) {
        if (!(error instanceof GatheringRevisionConflictError) || attempt === 2) throw error;
      }
    }
    throw new Error("Unable to claim gathering reminder");
  }

  async ownsReminderLease(
    occurrenceId: string,
    reminderType: string,
    leaseId: string,
    now = new Date(),
  ): Promise<boolean> {
    const current = await this.getEffectiveStore(now);
    return current.reminderDeliveries.some(
      (delivery) =>
        delivery.occurrenceId === occurrenceId &&
        delivery.reminderType === reminderType &&
        delivery.status === "sending" &&
        delivery.leaseId === leaseId,
    );
  }

  async completeReminderDelivery(
    occurrenceId: string,
    reminderType: string,
    leaseId: string,
    now = new Date(),
  ): Promise<{ updated: boolean; store: GatheringStoreV1 }> {
    return this.updateReminderDelivery(occurrenceId, reminderType, leaseId, now, "complete");
  }

  async releaseReminderDelivery(
    occurrenceId: string,
    reminderType: string,
    leaseId: string,
    now = new Date(),
  ): Promise<{ updated: boolean; store: GatheringStoreV1 }> {
    return this.updateReminderDelivery(occurrenceId, reminderType, leaseId, now, "release");
  }

  private async updateReminderDelivery(
    occurrenceId: string,
    reminderType: string,
    leaseId: string,
    now: Date,
    operation: "complete" | "release",
  ): Promise<{ updated: boolean; store: GatheringStoreV1 }> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const current = await this.getEffectiveStore(now);
      const ownsLease = current.reminderDeliveries.some(
        (delivery) =>
          delivery.occurrenceId === occurrenceId &&
          delivery.reminderType === reminderType &&
          delivery.status === "sending" &&
          delivery.leaseId === leaseId,
      );
      if (!ownsLease) return { updated: false, store: current };
      try {
        const store = await this.saveChange(current.revision, now, (value) => ({
          ...value,
          reminderDeliveries: operation === "release"
            ? value.reminderDeliveries.filter(
              (delivery) =>
                delivery.occurrenceId !== occurrenceId ||
                delivery.reminderType !== reminderType ||
                delivery.leaseId !== leaseId,
            )
            : value.reminderDeliveries.map((delivery) =>
              delivery.occurrenceId === occurrenceId &&
              delivery.reminderType === reminderType &&
              delivery.leaseId === leaseId
                ? { ...delivery, status: "sent" as const, sentAt: now.toISOString() }
                : delivery,
            ),
        }));
        return { updated: true, store };
      } catch (error) {
        if (!(error instanceof GatheringRevisionConflictError) || attempt === 2) throw error;
      }
    }
    throw new Error(`Unable to ${operation} gathering reminder`);
  }

  private async saveChange(
    expectedRevision: number,
    now: Date,
    change: (current: GatheringStoreV1) => GatheringStoreV1,
  ): Promise<GatheringStoreV1> {
    const persisted = await this.getPersistedStore();
    const legacy = !persisted?.legacyRecordingsImported
      ? await this.storage.get<unknown>(LEGACY_CONTENT_KEY)
      : null;
    const current = persisted
      ? applyWeeklyDefaults(importLegacyRecordings(persisted, legacy, now))
      : normalizeLegacyGatherings(legacy, now);
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

    if (this.storage.compareAndSet) {
      const result = await this.storage.compareAndSet(
        GATHERINGS_KEY,
        expectedRevision,
        next,
      );
      if (!result.saved) {
        throw new GatheringRevisionConflictError(
          expectedRevision,
          result.actualRevision,
        );
      }
    } else {
      await this.storage.set(GATHERINGS_KEY, next);
    }
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
