import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ADMIN_CONSENT_VERSION,
  MessagingRepository,
  SubscriberAlreadyActiveError,
  createUnsubscribeToken,
  type MessagingStorage,
  verifyUnsubscribeToken,
} from "./index";

class MemoryStorage implements MessagingStorage {
  values = new Map<string, unknown>();
  failWrites = false;
  async get<T>(key: string) { return structuredClone(this.values.get(key) ?? null) as T | null; }
  async set<T>(key: string, value: T) {
    if (this.failWrites) throw new Error("storage unavailable");
    this.values.set(key, structuredClone(value));
  }
  async compareAndSet<T>(key: string, expectedRevision: number, value: T) {
    if (this.failWrites) throw new Error("storage unavailable");
    const actualRevision = (this.values.get(key) as { revision?: number } | undefined)?.revision ?? 0;
    if (actualRevision !== expectedRevision) return { saved: false, actualRevision };
    this.values.set(key, structuredClone(value));
    return { saved: true, actualRevision: expectedRevision + 1 };
  }
}

const NOW = new Date("2030-08-09T12:00:00.000Z");
const adminInput = { name: "Alex", contactType: "email" as const, contact: "ALEX@example.com", consentSource: "admin-manual" as const, consentVersion: ADMIN_CONSENT_VERSION };

describe("messaging subscriber records", () => {
  it("normalizes legacy records and preserves an exact backup on first mutation", async () => {
    const storage = new MemoryStorage();
    const legacy = [{ id: "legacy-1", name: "Legacy", contactType: "email", contact: "legacy@example.com", timestamp: "2028-01-02T03:04:05.000Z" }];
    storage.values.set("subscribers", legacy);
    const repository = new MessagingRepository(storage);
    const initial = await repository.getStore(NOW);
    expect(initial.subscribers[0].consent).toEqual({ recordedAt: legacy[0].timestamp, source: "legacy", version: "legacy-import" });
    await repository.add(adminInput, NOW);
    expect(storage.values.get("subscribers:backup:v1")).toEqual(legacy);
    expect((storage.values.get("subscribers:v1") as { revision: number }).revision).toBe(1);
  });

  it("deduplicates active contacts, suppresses them, and records fresh consent when they opt in again", async () => {
    const repository = new MessagingRepository(new MemoryStorage());
    const first = await repository.add(adminInput, NOW);
    await expect(repository.add(adminInput, NOW)).rejects.toBeInstanceOf(SubscriberAlreadyActiveError);
    await repository.suppress(first.id, "unsubscribe", new Date("2030-08-10T12:00:00.000Z"));
    expect(await repository.getActiveSubscribers()).toHaveLength(0);
    await expect(repository.add({ ...adminInput, name: "Attacker" }, new Date("2030-08-11T11:00:00.000Z"))).rejects.toMatchObject({ name: "SubscriberSuppressedError" });
    expect(await repository.getActiveSubscribers()).toHaveLength(0);
    const revived = await repository.add({ ...adminInput, name: "Alex Again" }, new Date("2030-08-11T12:00:00.000Z"), true);
    expect(revived.id).toBe(first.id);
    expect(revived.suppressedAt).toBeNull();
    expect(revived.consent.recordedAt).toBe("2030-08-11T12:00:00.000Z");
  });

  it("deduplicates legacy delivery identities and suppresses every matching variant", async () => {
    const storage = new MemoryStorage();
    storage.values.set("subscribers", [
      { id: "phone-a", name: "One", contactType: "phone", contact: "+1 (555) 123-4567", timestamp: "2028-01-02T03:04:05.000Z" },
      { id: "phone-b", name: "Two", contactType: "phone", contact: "15551234567", timestamp: "2028-01-03T03:04:05.000Z" },
      { id: "email-a", name: "Email", contactType: "email", contact: "Person@Example.com", timestamp: "2028-01-04T03:04:05.000Z" },
      { id: "email-b", name: "Email duplicate", contactType: "email", contact: "person@example.com", timestamp: "2028-01-05T03:04:05.000Z" },
    ]);
    const repository = new MessagingRepository(storage);
    const store = await repository.getStore(NOW);
    expect(store.subscribers).toHaveLength(2);
    expect(store.subscribers.find((item) => item.contactType === "phone")?.contact).toBe("+15551234567");
    const phone = store.subscribers.find((item) => item.contactType === "phone")!;
    await repository.suppress(phone.id, "unsubscribe", NOW);
    expect(await repository.getActiveSubscribers()).toHaveLength(1);
    expect((await repository.getActiveSubscribers())[0].contactType).toBe("email");
  });

  it("fails loudly when subscriber storage cannot be written", async () => {
    const storage = new MemoryStorage();
    storage.failWrites = true;
    await expect(new MessagingRepository(storage).add(adminInput, NOW)).rejects.toThrow("storage unavailable");
  });
});

describe("unsubscribe tokens", () => {
  const originalPassword = process.env.ADMIN_PASSWORD;
  beforeEach(() => { process.env.ADMIN_PASSWORD = "test-unsubscribe-secret"; });
  afterEach(() => {
    if (originalPassword === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = originalPassword;
  });

  it("signs only the record ID and rejects tampered, malformed, and oversized tokens", () => {
    const token = createUnsubscribeToken("subscriber-123");
    expect(verifyUnsubscribeToken(token)).toBe("subscriber-123");
    expect(token).not.toContain("example.com");
    expect(verifyUnsubscribeToken(`${token}x`)).toBeNull();
    expect(verifyUnsubscribeToken("not-a-token")).toBeNull();
    expect(verifyUnsubscribeToken("x".repeat(301))).toBeNull();
  });
});
