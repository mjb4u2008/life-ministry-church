// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), eval: vi.fn() }));
vi.mock("@vercel/kv", () => ({ kv: mocks }));
import { compareAndSetRevision } from "./revision-storage";
import { GivingRepository, GivingRevisionConflictError } from "./giving/repository";
import { MessagingRepository } from "./messaging/repository";

const NOW = "2026-10-22T12:00:00.000Z";
const subscriber = (id: string) => ({ id, name: id, contactType: "email", contact: `${id}@example.test`, createdAt: NOW, consent: { recordedAt: NOW, source: "homepage", version: "v1" }, suppressedAt: null, suppressionReason: null });

describe("production revision storage contract", () => {
  beforeEach(() => vi.resetAllMocks());

  it("distinguishes an adjacent competing revision from a successful save", async () => {
    mocks.eval.mockResolvedValueOnce([0, 2]).mockResolvedValueOnce([1, 2]);
    expect(await compareAndSetRevision("test", 1, { revision: 2 })).toEqual({ saved: false, actualRevision: 2 });
    expect(await compareAndSetRevision("test", 1, { revision: 2 })).toEqual({ saved: true, actualRevision: 2 });
  });

  it("uses an explicit success discriminator when upgrading a revision-zero legacy record", async () => {
    mocks.eval.mockResolvedValue([1, 1]);
    expect(await compareAndSetRevision("site-content", 0, { revision: 1 })).toEqual({ saved: true, actualRevision: 1 });
  });

  it.each([2, [2, 2], [1, 9], [1], [0, "2"], null])("fails closed on malformed adapter result %j", async (result) => {
    mocks.eval.mockResolvedValue(result);
    await expect(compareAndSetRevision("test", 1, { revision: 2 })).rejects.toThrow("Invalid revision storage response");
  });

  it("does not claim that an unsaved campaign URL was saved", async () => {
    mocks.get.mockResolvedValue({ schemaVersion: 1, revision: 1, zeffyCampaignUrl: "", updatedAt: NOW });
    mocks.eval.mockResolvedValue([0, 2]);
    await expect(new GivingRepository().update("https://www.zeffy.com/donation-form/new", 1)).rejects.toBeInstanceOf(GivingRevisionConflictError);
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("retries unsubscribe after a competing write and preserves both changes", async () => {
    let persisted = { schemaVersion: 1, revision: 1, updatedAt: NOW, subscribers: [subscriber("recipient")] };
    mocks.get.mockImplementation(async () => structuredClone(persisted));
    mocks.eval.mockImplementationOnce(async () => {
      persisted = { ...persisted, revision: 2, subscribers: [...persisted.subscribers, subscriber("concurrent-signup")] };
      return [0, 2];
    }).mockImplementationOnce(async (_script: string, _keys: string[], args: string[]) => {
      expect(args[0]).toBe("2");
      persisted = JSON.parse(args[1]);
      return [1, 3];
    });
    const repository = new MessagingRepository();
    await repository.suppress("recipient", "unsubscribe", new Date(NOW));
    expect(persisted.subscribers).toHaveLength(2);
    expect((await repository.getActiveSubscribers()).map((item) => item.id)).toEqual(["concurrent-signup"]);
    expect(mocks.eval).toHaveBeenCalledTimes(2);
  });
});
