import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

/**
 * Existing Stripe integration, used only while no Zeffy campaign is configured.
 */
export async function legacyStripeCheckout(request: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Online giving is not configured yet. Please contact the ministry." },
        { status: 503 },
      );
    }

    const stripe = new Stripe(secretKey);
    const { amount, fund, isRecurring, frequency } = await request.json();
    const parsedAmount = typeof amount === "string" || typeof amount === "number" ? Number(amount) : NaN;
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0.01 || parsedAmount > 50000) {
      return NextResponse.json({ error: "Invalid amount. Must be between $0.01 and $50,000." }, { status: 400 });
    }

    const amountInCents = Math.round(parsedAmount * 100);
    if (typeof isRecurring !== "boolean" || (isRecurring && !["weekly", "biweekly", "monthly", "quarterly"].includes(frequency))) {
      return NextResponse.json({ error: "Choose a valid giving frequency." }, { status: 400 });
    }
    const fundLabels: Record<string, string> = {
      tithe: "Tithe",
      offering: "General Offering",
      missions: "Missions",
      benevolence: "Benevolence Fund",
    };
    if (typeof fund !== "string" || !Object.hasOwn(fundLabels, fund)) {
      return NextResponse.json({ error: "Invalid fund. Must be one of: tithe, offering, missions, benevolence." }, { status: 400 });
    }

    const fundName = fundLabels[fund];
    const recurring = isRecurring
      ? {
          interval: frequency === "weekly" || frequency === "biweekly" ? "week" as const : "month" as const,
          interval_count: frequency === "biweekly" ? 2 : frequency === "quarterly" ? 3 : 1,
        }
      : undefined;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: isRecurring ? "subscription" : "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `L.I.F.E. Ministry — ${fundName}`,
            description: `${isRecurring ? `Recurring ${frequency}` : "One-time"} gift to ${fundName}`,
          },
          unit_amount: amountInCents,
          ...(recurring ? { recurring } : {}),
        },
        quantity: 1,
      }],
      success_url: `${request.nextUrl.origin}/give?success=true`,
      cancel_url: `${request.nextUrl.origin}/give?canceled=true`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Legacy Stripe checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
