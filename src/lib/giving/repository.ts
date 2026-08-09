import { kv } from "@vercel/kv";
import { parseGivingSettings } from "./schema";
import type { GivingSettingsV1 } from "./types";

export const GIVING_SETTINGS_KEY = "giving-settings:v1";

export interface GivingStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<unknown>;
  compareAndSet?<T>(key: string, expectedRevision: number, value: T): Promise<{ saved: boolean; actualRevision: number }>;
}

export class GivingRevisionConflictError extends Error {
  constructor(public readonly expectedRevision: number, public readonly actualRevision: number) {
    super(`Expected giving revision ${expectedRevision}, but found ${actualRevision}`);
    this.name = "GivingRevisionConflictError";
  }
}

const vercelStorage: GivingStorage = {
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

function emptySettings(now = new Date()): GivingSettingsV1 {
  return { schemaVersion: 1, revision: 0, zeffyCampaignUrl: "", updatedAt: now.toISOString() };
}

export class GivingRepository {
  constructor(private readonly storage: GivingStorage = vercelStorage) {}

  async get(now = new Date()) {
    const value = await this.storage.get<unknown>(GIVING_SETTINGS_KEY);
    if (value === null) return emptySettings(now);
    try { return parseGivingSettings(value); }
    catch { throw new Error("Stored giving settings are invalid"); }
  }

  async update(zeffyCampaignUrl: string, expectedRevision: number, now = new Date()) {
    const current = await this.get(now);
    if (current.revision !== expectedRevision) throw new GivingRevisionConflictError(expectedRevision, current.revision);
    const next = parseGivingSettings({
      schemaVersion: 1,
      revision: current.revision + 1,
      zeffyCampaignUrl,
      updatedAt: now.toISOString(),
    });
    if (this.storage.compareAndSet) {
      const result = await this.storage.compareAndSet(GIVING_SETTINGS_KEY, expectedRevision, next);
      if (!result.saved) throw new GivingRevisionConflictError(expectedRevision, result.actualRevision);
    } else await this.storage.set(GIVING_SETTINGS_KEY, next);
    return next;
  }
}
