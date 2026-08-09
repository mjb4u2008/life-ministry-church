import { describe, expect, it } from "vitest";
import {
  GivingRepository,
  GivingRevisionConflictError,
  GivingValidationError,
  type GivingStorage,
  parseZeffyCampaignUrl,
  serializePublicGiving,
  zeffyEmbedUrl,
} from "./index";

class MemoryStorage implements GivingStorage {
  value: unknown = null;
  failWrites = false;
  async get<T>() { return this.value as T | null; }
  async set<T>(_key: string, value: T) { if (this.failWrites) throw new Error("storage unavailable"); this.value = structuredClone(value); }
  async compareAndSet<T>(_key: string, expectedRevision: number, value: T) {
    if (this.failWrites) throw new Error("storage unavailable");
    const actualRevision = (this.value as { revision?: number } | null)?.revision ?? 0;
    if (actualRevision !== expectedRevision) return { saved: false, actualRevision };
    this.value = structuredClone(value);
    return { saved: true, actualRevision: expectedRevision + 1 };
  }
}

const CAMPAIGN = "https://www.zeffy.com/en-US/donation-form/life-ministry-123";

describe("Zeffy giving settings", () => {
  it("accepts official donation links and derives the official embed path", () => {
    expect(parseZeffyCampaignUrl(CAMPAIGN)).toBe(CAMPAIGN);
    expect(zeffyEmbedUrl(CAMPAIGN)).toBe("https://www.zeffy.com/en-US/embed/donation-form/life-ministry-123");
    expect(parseZeffyCampaignUrl("https://zeffy.com/donation-form/support-life?utm_source=church")).toBe("https://www.zeffy.com/donation-form/support-life?utm_source=church");
  });

  it("rejects lookalikes, unsafe schemes, credentials, ports, fragments, and non-donation forms", () => {
    for (const value of [
      "http://www.zeffy.com/donation/give",
      "javascript:alert(1)",
      "https://www.zeffy.com.evil.example/donation/give",
      "https://user:pass@www.zeffy.com/donation/give",
      "https://www.zeffy.com:8443/donation/give",
      "https://www.zeffy.com/donation/give#fake-success",
      "https://www.zeffy.com/donation/support-life",
      "https://www.zeffy.com/en-US/embed/donation-form/support-life",
      "https://www.zeffy.com/en-US/not-a-form/donation-form/support-life",
      "https://www.zeffy.com/en-US/donation-form/support-life/extra",
      "https://www.zeffy.com/ticketing/event",
      '<iframe src="https://www.zeffy.com/donation/give"></iframe>',
    ]) expect(() => parseZeffyCampaignUrl(value)).toThrow(GivingValidationError);
  });

  it("returns no URL when giving is unconfigured and allowlists configured public data", () => {
    expect(serializePublicGiving({ schemaVersion: 1, revision: 0, zeffyCampaignUrl: "", updatedAt: "2030-08-09T12:00:00.000Z" })).toEqual({ configured: false });
    const output = serializePublicGiving({ schemaVersion: 1, revision: 9, zeffyCampaignUrl: CAMPAIGN, updatedAt: "2030-08-09T12:00:00.000Z" });
    expect(output).toEqual({ configured: true, campaignUrl: CAMPAIGN, embedUrl: "https://www.zeffy.com/en-US/embed/donation-form/life-ministry-123" });
    expect(output).not.toHaveProperty("revision");
  });

  it("uses atomic revisions and fails loudly on storage errors", async () => {
    const storage = new MemoryStorage();
    const repository = new GivingRepository(storage);
    const saved = await repository.update(CAMPAIGN, 0, new Date("2030-08-09T12:00:00.000Z"));
    expect(saved.revision).toBe(1);
    await expect(repository.update(CAMPAIGN, 0)).rejects.toBeInstanceOf(GivingRevisionConflictError);
    storage.failWrites = true;
    await expect(repository.update(CAMPAIGN, 1)).rejects.toThrow("storage unavailable");
  });
});
