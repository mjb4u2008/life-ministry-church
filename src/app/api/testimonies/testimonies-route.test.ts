// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
vi.mock("@vercel/kv", () => ({ kv: mocks }));
import { GET, PATCH } from "./route";

const record = { id: "synthetic-id", name: "Synthetic person", text: "Pending private testimony", isAnonymous: false, blessedCount: 0, createdAt: "2026-10-22T00:00:00.000Z", approved: false };
const increment = () => new NextRequest("https://church.example/api/testimonies", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: record.id, increment: true }) });

describe("public testimony moderation boundary with real data helper", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.get.mockResolvedValue([structuredClone(record)]); });
  it("does not disclose a pending testimony even when its ID is known", async () => {
    const listed = await GET(new NextRequest("https://church.example/api/testimonies"));
    expect(await listed.json()).toEqual({ testimonies: [] });
    const response = await PATCH(increment());
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain(record.text);
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it("still increments a moderated public testimony", async () => {
    mocks.get.mockResolvedValue([{ ...record, approved: true }]);
    const response = await PATCH(increment());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: record.id, blessedCount: 1, approved: true });
    expect(mocks.set).toHaveBeenCalledWith("testimonies", [expect.objectContaining({ blessedCount: 1 })]);
  });
});
