// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), eval: vi.fn() }));
vi.mock("@vercel/kv", () => ({ kv: mocks }));
vi.mock("@/lib/auth", () => ({ verifyToken: (token: string) => token === "local-test" }));
import { ContentRevisionConflictError, getAdminContent, updateContent, type SiteContent } from "./data";
import { GET, PUT } from "@/app/api/content/route";

const original = { id: "1", url: "https://www.tiktok.com/@local/video/1", title: "Original video" };
const added = { id: "2", url: "https://www.tiktok.com/@local/video/2", title: "New video" };
const legacy = { tiktokVideos: [original], featuredVideosInitialized: true, socialLinks: { tiktok: "", instagram: "" }, contactEmail: "original@example.test", contactPhone: "", lastUpdated: "2026-10-22T00:00:00.000Z" } as SiteContent;
let values: Map<string, unknown>;
let compete: (() => void) | undefined;
const request = (body: unknown, ifMatch?: string, authorization = "Bearer local-test") => new NextRequest("https://church.example/api/content", {
  method: "PUT", headers: { "Content-Type": "application/json", Authorization: authorization, ...(ifMatch === undefined ? {} : { "If-Match": ifMatch }) }, body: JSON.stringify(body),
});

beforeEach(() => {
  vi.resetAllMocks(); values = new Map([["site-content", structuredClone(legacy)]]); compete = undefined;
  mocks.get.mockImplementation(async (key: string) => structuredClone(values.get(key) ?? null));
  mocks.eval.mockImplementation(async (_script: string, keys: string[], args: string[]) => {
    compete?.(); compete = undefined;
    const actual = (values.get(keys[0]) as SiteContent | undefined)?.revision ?? 0;
    if (actual !== Number(args[0])) return [0, actual];
    values.set(keys[0], JSON.parse(args[1]));
    return [1, actual + 1];
  });
});

describe("legacy content revision compatibility", () => {
  it("normalizes a legacy revision to zero for admin only and upgrades on the first write", async () => {
    expect((await getAdminContent()).revision).toBe(0);
    const publicResponse = await GET(new NextRequest("https://church.example/api/content"));
    expect(await publicResponse.json()).not.toHaveProperty("revision");
    expect((await updateContent({ contactPhone: "555 0100" })).revision).toBe(1);
    expect(values.get("site-content")).toMatchObject({ revision: 1, tiktokVideos: [original], contactPhone: "555 0100" });
  });

  it("rejects a stale video snapshot without deleting a newer addition", async () => {
    const tab1 = await getAdminContent(); const tab2 = await getAdminContent();
    await updateContent({ tiktokVideos: [...tab1.tiktokVideos, added] }, tab1.revision);
    await expect(updateContent({ tiktokVideos: [{ ...tab2.tiktokVideos[0], title: "Stale title edit" }] }, tab2.revision)).rejects.toBeInstanceOf(ContentRevisionConflictError);
    expect((await getAdminContent()).tiktokVideos).toEqual([original, added]);
  });

  it("returns conflict when a write races after the initial read", async () => {
    compete = () => values.set("site-content", { ...legacy, revision: 1, contactEmail: "concurrent@example.test" });
    const response = await PUT(request({ tiktokVideos: [] }, "0"));
    expect(response.status).toBe(409);
    expect(values.get("site-content")).toMatchObject({ revision: 1, contactEmail: "concurrent@example.test", tiktokVideos: [original] });
  });

  it("retries unversioned legacy settings writes and preserves unrelated concurrent fields", async () => {
    compete = () => values.set("site-content", { ...legacy, revision: 1, contactEmail: "concurrent@example.test" });
    const response = await PUT(request({ contactPhone: "555 0100" }));
    expect(response.status).toBe(200);
    expect(values.get("site-content")).toMatchObject({ revision: 2, contactEmail: "concurrent@example.test", contactPhone: "555 0100", tiktokVideos: [original] });
    expect(mocks.eval).toHaveBeenCalledTimes(2);
  });

  it("bounds legacy merge retries and never falls back to an unconditional write", async () => {
    mocks.eval.mockResolvedValue([0, 1]);
    await expect(updateContent({ contactPhone: "555 0100" })).rejects.toBeInstanceOf(ContentRevisionConflictError);
    expect(mocks.eval).toHaveBeenCalledTimes(3);
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("cannot save defaults over a storage read or write outage", async () => {
    mocks.get.mockRejectedValueOnce(new Error("read unavailable"));
    await expect(getAdminContent()).rejects.toThrow("read unavailable");
    mocks.get.mockRejectedValueOnce(new Error("read unavailable"));
    await expect(updateContent({ contactPhone: "555 0100" })).rejects.toThrow("read unavailable");
    expect(mocks.eval).not.toHaveBeenCalled();
    mocks.eval.mockRejectedValueOnce(new Error("write unavailable"));
    await expect(updateContent({ contactPhone: "555 0100" })).rejects.toThrow("write unavailable");
    expect(values.get("site-content")).toEqual(legacy);
  });

  it("fails closed on an invalid stored revision", async () => {
    values.set("site-content", { ...legacy, revision: "bad" });
    await expect(updateContent({ contactPhone: "555 0100" })).rejects.toThrow("Stored content revision is invalid");
    expect(mocks.eval).not.toHaveBeenCalled();
  });
});

describe("video HTTP preconditions", () => {
  it("requires authentication before checking the snapshot header", async () => {
    expect((await PUT(request({ tiktokVideos: [] }, undefined, "Bearer invalid"))).status).toBe(401);
    expect(mocks.get).not.toHaveBeenCalled();
  });
  it("requires an explicit version for replacing a video list", async () => {
    expect((await PUT(request({ tiktokVideos: [] }))).status).toBe(428);
    expect(mocks.eval).not.toHaveBeenCalled();
  });
  it.each(["*", "-1", 'W/"0"', '"0", "1"', "1e3", "9007199254740992"])("rejects invalid precondition %s", async (value) => {
    expect((await PUT(request({ tiktokVideos: [] }, value))).status).toBe(400);
    expect(mocks.eval).not.toHaveBeenCalled();
  });
  it.each(["0", '"0"'])("accepts version %s and preserves an intentional empty list", async (value) => {
    const response = await PUT(request({ tiktokVideos: [] }, value));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ revision: 1, tiktokVideos: [], featuredVideosInitialized: true });
    expect((await getAdminContent()).tiktokVideos).toEqual([]);
  });
});
