import { NextRequest, NextResponse } from "next/server";
import { GivingRepository } from "@/lib/giving";
import { legacyStripeCheckout } from "./legacy-stripe-checkout";

export async function POST(request: NextRequest) {
  try {
    // Keep existing giving available until an administrator configures Zeffy.
    const settings = await new GivingRepository().get();
    if (settings.zeffyCampaignUrl) return NextResponse.json({ error: "The giving form has changed. Refresh the Give page to continue." }, { status: 404 });
    return await legacyStripeCheckout(request);
  } catch {
    return NextResponse.json({ error: "Giving is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
