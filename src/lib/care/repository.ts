import { kv } from "@vercel/kv";
import { normalizeLegacyCare } from "./legacy";
import { parseCareStore } from "./schema";
import type { CareAdminUpdates, CareRecord, CareStoreV1, PublicCareSubmission } from "./types";

export const CARE_KEY = "care:v1";
export const LEGACY_PRAYERS_KEY = "prayers";
export const LEGACY_PRAYERS_BACKUP_KEY = "prayers:backup:care-v1";

export interface CareStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<unknown>;
  compareAndSet?<T>(key: string, expectedRevision: number, value: T): Promise<{ saved: boolean; actualRevision: number }>;
}

export class CareRevisionConflictError extends Error {
  constructor(public readonly expectedRevision: number, public readonly actualRevision: number) {
    super(`Expected care revision ${expectedRevision}, but found ${actualRevision}`);
    this.name = "CareRevisionConflictError";
  }
}

const vercelStorage: CareStorage = {
  get: <T>(key: string) => kv.get<T>(key),
  set: <T>(key: string, value: T) => kv.set(key, value),
  compareAndSet: async <T>(key: string, expectedRevision: number, value: T) => {
    const result = await kv.eval<[string, string], number>(
      `
        local current = redis.call("GET", KEYS[1])
        if current then
          local decoded = cjson.decode(current)
          local actual = tonumber(decoded.revision)
          if actual ~= tonumber(ARGV[1]) then return actual end
        elseif tonumber(ARGV[1]) ~= 0 then return -1 end
        redis.call("SET", KEYS[1], ARGV[2])
        return tonumber(ARGV[1]) + 1
      `,
      [key],
      [String(expectedRevision), JSON.stringify(value)],
    );
    return { saved: result === expectedRevision + 1, actualRevision: result };
  },
};

export class CareRepository {
  constructor(private readonly storage: CareStorage = vercelStorage) {}

  async getStore(now = new Date()): Promise<CareStoreV1> {
    const persisted = await this.storage.get<unknown>(CARE_KEY);
    if (persisted !== null) return parseCareStore(persisted);
    return normalizeLegacyCare(await this.storage.get<unknown>(LEGACY_PRAYERS_KEY), now);
  }

  async addSubmission(submission: PublicCareSubmission, now = new Date()): Promise<{ store: CareStoreV1; record: CareRecord }> {
    const record: CareRecord = {
      ...submission,
      id: crypto.randomUUID(),
      moderationStatus: "pending",
      careStatus: "new",
      prayerCount: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    const store = await this.retryingChange(now, (current) => ({
      ...current,
      records: [record, ...current.records],
    }));
    return { store, record };
  }

  async updateRecord(id: string, updates: CareAdminUpdates, expectedRevision: number, now = new Date()) {
    return this.saveChange(expectedRevision, now, (current) => {
      const existing = current.records.find((record) => record.id === id);
      if (!existing) throw new CareRecordNotFoundError(id);
      if (existing.kind === "visitor" && updates.visibility === "public") {
        throw new Error("Visitor records cannot be public");
      }
      if (existing.visibility === "private" && updates.visibility === "public") {
        throw new Error("Public sharing requires consent from the original submission");
      }
      if (
        updates.moderationStatus === "approved" &&
        (existing.kind !== "prayer" || (updates.visibility ?? existing.visibility) !== "public")
      ) {
        throw new Error("Only consented public prayer requests can be approved");
      }
      return {
        ...current,
        records: current.records.map((record) =>
          record.id === id ? { ...record, ...updates, updatedAt: now.toISOString() } : record,
        ),
      };
    });
  }

  async incrementPrayer(id: string, now = new Date()) {
    let updated: CareRecord | null = null;
    const store = await this.retryingChange(now, (current) => {
      const candidate = current.records.find((record) => record.id === id);
      if (
        !candidate || candidate.kind !== "prayer" || candidate.visibility !== "public" ||
        candidate.moderationStatus !== "approved" || candidate.careStatus === "closed"
      ) throw new CareRecordNotFoundError(id);
      updated = { ...candidate, prayerCount: candidate.prayerCount + 1, updatedAt: now.toISOString() };
      return {
        ...current,
        records: current.records.map((record) => record.id === id ? updated as CareRecord : record),
      };
    }, () => updated !== null);
    if (!updated) throw new CareRecordNotFoundError(id);
    return { store, record: updated as CareRecord };
  }

  private async retryingChange(
    now: Date,
    change: (current: CareStoreV1) => CareStoreV1,
    changed: () => boolean = () => true,
  ) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const current = await this.getStore(now);
      try {
        const next = await this.saveChange(current.revision, now, change);
        if (!changed()) throw new CareRecordNotFoundError("unknown");
        return next;
      } catch (error) {
        if (!(error instanceof CareRevisionConflictError) || attempt === 2) throw error;
      }
    }
    throw new Error("Unable to save care record");
  }

  private async saveChange(
    expectedRevision: number,
    now: Date,
    change: (current: CareStoreV1) => CareStoreV1,
  ): Promise<CareStoreV1> {
    const current = await this.getStore(now);
    if (current.revision !== expectedRevision) {
      throw new CareRevisionConflictError(expectedRevision, current.revision);
    }
    const next = parseCareStore({
      ...change(current),
      schemaVersion: 1,
      revision: current.revision + 1,
      updatedAt: now.toISOString(),
    });
    const persisted = await this.storage.get<unknown>(CARE_KEY);
    if (persisted === null) {
      const legacy = await this.storage.get<unknown>(LEGACY_PRAYERS_KEY);
      const backup = await this.storage.get<unknown>(LEGACY_PRAYERS_BACKUP_KEY);
      if (legacy !== null && backup === null) {
        await this.storage.set(LEGACY_PRAYERS_BACKUP_KEY, legacy);
      }
    }
    if (this.storage.compareAndSet) {
      const result = await this.storage.compareAndSet(CARE_KEY, expectedRevision, next);
      if (!result.saved) throw new CareRevisionConflictError(expectedRevision, result.actualRevision);
    } else {
      await this.storage.set(CARE_KEY, next);
    }
    return next;
  }
}

export class CareRecordNotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`Care record ${id} was not found`);
    this.name = "CareRecordNotFoundError";
  }
}
