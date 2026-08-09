import { kv } from "@vercel/kv";
import { normalizeLegacySubscribers, parseSubscriberInput, parseSubscriberStore } from "./schema";
import type { SubscriberInput, SubscriberStoreV1, SuppressionReason } from "./types";

export const SUBSCRIBERS_KEY = "subscribers:v1";
export const LEGACY_SUBSCRIBERS_KEY = "subscribers";
export const LEGACY_SUBSCRIBERS_BACKUP_KEY = "subscribers:backup:v1";

export interface MessagingStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<unknown>;
  compareAndSet?<T>(key: string, expectedRevision: number, value: T): Promise<{ saved: boolean; actualRevision: number }>;
}

export class SubscriberAlreadyActiveError extends Error {
  constructor() { super("Already subscribed"); this.name = "SubscriberAlreadyActiveError"; }
}

export class SubscriberSuppressedError extends Error {
  constructor() { super("Subscriber is suppressed"); this.name = "SubscriberSuppressedError"; }
}

export class SubscriberNotFoundError extends Error {
  constructor() { super("Subscriber not found"); this.name = "SubscriberNotFoundError"; }
}

export class SubscriberRevisionConflictError extends Error {
  constructor(public readonly expectedRevision: number, public readonly actualRevision: number) {
    super(`Expected subscriber revision ${expectedRevision}, found ${actualRevision}`);
    this.name = "SubscriberRevisionConflictError";
  }
}

const vercelStorage: MessagingStorage = {
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

export class MessagingRepository {
  constructor(private readonly storage: MessagingStorage = vercelStorage) {}

  async getStore(now = new Date()): Promise<SubscriberStoreV1> {
    const persisted = await this.storage.get<unknown>(SUBSCRIBERS_KEY);
    if (persisted !== null) return parseSubscriberStore(persisted);
    return normalizeLegacySubscribers(await this.storage.get<unknown>(LEGACY_SUBSCRIBERS_KEY), now);
  }

  async getActiveSubscribers(now = new Date()) {
    const subscribers = (await this.getStore(now)).subscribers;
    const suppressed = new Set(subscribers.filter((subscriber) => subscriber.suppressedAt !== null).map(deliveryIdentity));
    const seen = new Set<string>();
    return subscribers.filter((subscriber) => {
      const identity = deliveryIdentity(subscriber);
      if (subscriber.suppressedAt !== null || suppressed.has(identity) || seen.has(identity)) return false;
      seen.add(identity);
      return true;
    });
  }

  async add(input: SubscriberInput, now = new Date(), allowReactivation = false) {
    const parsed = parseSubscriberInput(input);
    let resultId = "";
    const store = await this.retryingChange(now, (current) => {
      const existing = current.subscribers.find((subscriber) =>
        subscriber.contactType === parsed.contactType && subscriber.contact.toLowerCase() === parsed.contact.toLowerCase(),
      );
      if (existing && existing.suppressedAt === null) throw new SubscriberAlreadyActiveError();
      if (existing && !allowReactivation) throw new SubscriberSuppressedError();
      if (existing) {
        resultId = existing.id;
        return {
          ...current,
          subscribers: current.subscribers.map((subscriber) => subscriber.id === existing.id ? {
            ...subscriber,
            name: parsed.name,
            consent: { recordedAt: now.toISOString(), source: parsed.consentSource, version: parsed.consentVersion },
            suppressedAt: null,
            suppressionReason: null,
          } : subscriber),
        };
      }
      resultId = crypto.randomUUID();
      return {
        ...current,
        subscribers: [...current.subscribers, {
          id: resultId,
          name: parsed.name,
          contactType: parsed.contactType,
          contact: parsed.contact,
          createdAt: now.toISOString(),
          consent: { recordedAt: now.toISOString(), source: parsed.consentSource, version: parsed.consentVersion },
          suppressedAt: null,
          suppressionReason: null,
        }],
      };
    });
    const subscriber = store.subscribers.find((item) => item.id === resultId);
    if (!subscriber) throw new Error("Subscriber save did not return a record");
    return subscriber;
  }

  async suppress(id: string, reason: SuppressionReason, now = new Date()) {
    return this.retryingChange(now, (current) => {
      const existing = current.subscribers.find((subscriber) => subscriber.id === id);
      if (!existing) throw new SubscriberNotFoundError();
      const identity = deliveryIdentity(existing);
      return {
        ...current,
        subscribers: current.subscribers.map((subscriber) => deliveryIdentity(subscriber) === identity && subscriber.suppressedAt === null ? {
          ...subscriber,
          suppressedAt: now.toISOString(),
          suppressionReason: reason,
        } : subscriber),
      };
    });
  }

  async delete(id: string, now = new Date()) {
    await this.retryingChange(now, (current) => {
      if (!current.subscribers.some((subscriber) => subscriber.id === id)) throw new SubscriberNotFoundError();
      return { ...current, subscribers: current.subscribers.filter((subscriber) => subscriber.id !== id) };
    });
  }

  private async retryingChange(now: Date, change: (store: SubscriberStoreV1) => SubscriberStoreV1) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const current = await this.getStore(now);
      const next = parseSubscriberStore({
        ...change(current),
        schemaVersion: 1,
        revision: current.revision + 1,
        updatedAt: now.toISOString(),
      });
      const persisted = await this.storage.get<unknown>(SUBSCRIBERS_KEY);
      if (persisted === null) {
        const legacy = await this.storage.get<unknown>(LEGACY_SUBSCRIBERS_KEY);
        if (legacy !== null && await this.storage.get<unknown>(LEGACY_SUBSCRIBERS_BACKUP_KEY) === null) {
          await this.storage.set(LEGACY_SUBSCRIBERS_BACKUP_KEY, legacy);
        }
      }
      try {
        if (this.storage.compareAndSet) {
          const result = await this.storage.compareAndSet(SUBSCRIBERS_KEY, current.revision, next);
          if (!result.saved) throw new SubscriberRevisionConflictError(current.revision, result.actualRevision);
        } else await this.storage.set(SUBSCRIBERS_KEY, next);
        return next;
      } catch (error) {
        if (!(error instanceof SubscriberRevisionConflictError) || attempt === 2) throw error;
      }
    }
    throw new Error("Unable to save subscriber");
  }
}

function deliveryIdentity(subscriber: Pick<SubscriberInput, "contactType" | "contact">) {
  return `${subscriber.contactType}:${subscriber.contact.toLowerCase()}`;
}
