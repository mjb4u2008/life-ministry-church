import { kv } from "@vercel/kv";
import { normalizeLegacyEvents } from "./legacy";
import { parseEventStore, parseMinistryEvent } from "./schema";
import type { EventStoreV1, MinistryEvent, MinistryEventInput } from "./types";

export const EVENTS_KEY = "events:v1";
export const EVENTS_LEGACY_KEY = "site-content";
export const EVENTS_BACKUP_KEY = "site-content:backup:events-v1";

export interface EventStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<unknown>;
  compareAndSet?<T>(key: string, expectedRevision: number, value: T): Promise<{ saved: boolean; actualRevision: number }>;
}

export class EventRevisionConflictError extends Error {
  constructor(public readonly expectedRevision: number, public readonly actualRevision: number) {
    super(`Expected event revision ${expectedRevision}, but found ${actualRevision}`);
    this.name = "EventRevisionConflictError";
  }
}

export class EventNotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`Event ${id} was not found`);
    this.name = "EventNotFoundError";
  }
}

const vercelStorage: EventStorage = {
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

export class EventRepository {
  constructor(private readonly storage: EventStorage = vercelStorage) {}

  async getStore(now = new Date()): Promise<EventStoreV1> {
    const persisted = await this.storage.get<unknown>(EVENTS_KEY);
    if (persisted !== null) {
      try { return parseEventStore(persisted); }
      catch { throw new Error("Stored event data is invalid"); }
    }
    return normalizeLegacyEvents(await this.storage.get<unknown>(EVENTS_LEGACY_KEY), now);
  }

  async create(input: MinistryEventInput, expectedRevision: number, now = new Date()) {
    const event = parseMinistryEvent({
      ...input,
      id: crypto.randomUUID(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    const store = await this.saveChange(expectedRevision, now, (current) => ({ ...current, events: [...current.events, event] }));
    return { store, event };
  }

  async update(id: string, input: MinistryEventInput, expectedRevision: number, now = new Date()) {
    let event: MinistryEvent | undefined;
    const store = await this.saveChange(expectedRevision, now, (current) => {
      const existing = current.events.find((item) => item.id === id);
      if (!existing) throw new EventNotFoundError(id);
      event = parseMinistryEvent({ ...input, id, createdAt: existing.createdAt, updatedAt: now.toISOString() });
      return { ...current, events: current.events.map((item) => item.id === id ? event! : item) };
    });
    if (!event) throw new Error("Updated event was not produced");
    return { store, event };
  }

  async delete(id: string, expectedRevision: number, now = new Date()) {
    return this.saveChange(expectedRevision, now, (current) => {
      if (!current.events.some((item) => item.id === id)) throw new EventNotFoundError(id);
      return { ...current, events: current.events.filter((item) => item.id !== id) };
    });
  }

  private async saveChange(expectedRevision: number, now: Date, change: (store: EventStoreV1) => EventStoreV1) {
    const persisted = await this.storage.get<unknown>(EVENTS_KEY);
    const legacy = persisted === null ? await this.storage.get<unknown>(EVENTS_LEGACY_KEY) : null;
    let current: EventStoreV1;
    try { current = persisted === null ? normalizeLegacyEvents(legacy, now) : parseEventStore(persisted); }
    catch { throw new Error("Stored event data is invalid"); }
    if (current.revision !== expectedRevision) throw new EventRevisionConflictError(expectedRevision, current.revision);
    const next = parseEventStore({
      ...change(current),
      schemaVersion: 1,
      revision: current.revision + 1,
      updatedAt: now.toISOString(),
    });
    if (persisted === null && legacy !== null) {
      const backup = await this.storage.get<unknown>(EVENTS_BACKUP_KEY);
      if (backup === null) await this.storage.set(EVENTS_BACKUP_KEY, legacy);
    }
    if (this.storage.compareAndSet) {
      const result = await this.storage.compareAndSet(EVENTS_KEY, expectedRevision, next);
      if (!result.saved) throw new EventRevisionConflictError(expectedRevision, result.actualRevision);
    } else {
      await this.storage.set(EVENTS_KEY, next);
    }
    return next;
  }
}
