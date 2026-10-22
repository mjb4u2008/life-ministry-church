// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ settings: vi.fn(), create: vi.fn() }));
vi.mock("@/lib/giving", () => ({ GivingRepository: class { get = mocks.settings; } }));
vi.mock("stripe", () => ({ default: class { checkout = { sessions: { create: mocks.create } }; } }));
import { POST } from "./route";
const request = (updates = {}) => new NextRequest("https://church.example/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: "25", fund: "tithe", isRecurring: false, frequency: "monthly", ...updates }) });

describe("giving provider transition without real payment calls", () => {
  beforeEach(() => {
    vi.resetAllMocks(); vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_isolated_fixture");
    mocks.settings.mockResolvedValue({ zeffyCampaignUrl: "" });
    mocks.create.mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/fixture" });
  });
  afterEach(() => vi.unstubAllEnvs());
  it("preserves existing Stripe checkout while Zeffy is unconfigured", async () => {
    const response = await POST(request({ isRecurring: true, frequency: "biweekly" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ url: "https://checkout.stripe.com/c/pay/fixture" });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ mode: "subscription", line_items: [expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 2500, recurring: { interval: "week", interval_count: 2 } }) })] }));
  });
  it("does not create Stripe sessions after Zeffy is configured", async () => {
    mocks.settings.mockResolvedValue({ zeffyCampaignUrl: "https://www.zeffy.com/donation-form/fixture" });
    expect((await POST(request())).status).toBe(404);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("fails closed if the active giving provider cannot be read", async () => {
    mocks.settings.mockRejectedValue(new Error("isolated read failure"));
    expect((await POST(request())).status).toBe(503);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it.each([{ amount: "25junk" }, { amount: "0.001" }, { fund: "toString" }, { isRecurring: true, frequency: "daily" }])("rejects invalid checkout input %j", async (input) => {
    expect((await POST(request(input))).status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
