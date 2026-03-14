import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Stripe is not configured yet. Please add STRIPE_SECRET_KEY to environment variables." },
        { status: 503 }
      );
    }

    const stripe = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });

    const { amount, fund, isRecurring, frequency } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Convert dollars to cents
    const amountInCents = Math.round(parseFloat(amount) * 100);

    const fundLabels: Record<string, string> = {
      tithe: "Tithe",
      offering: "General Offering",
      missions: "Missions",
      benevolence: "Benevolence Fund",
    };

    const fundName = fundLabels[fund] || "General Offering";

    if (isRecurring) {
      // Create a recurring subscription via Stripe Checkout
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `L.I.F.E. Ministry — ${fundName}`,
                description: `Recurring ${frequency} gift to ${fundName}`,
              },
              unit_amount: amountInCents,
              recurring: {
                interval: frequency === "weekly" ? "week" : frequency === "biweekly" ? "week" : "month",
                interval_count: frequency === "biweekly" ? 2 : frequency === "quarterly" ? 3 : 1,
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${request.nextUrl.origin}/give?success=true`,
        cancel_url: `${request.nextUrl.origin}/give?canceled=true`,
      });

      return NextResponse.json({ url: session.url });
    } else {
      // One-time payment via Stripe Checkout
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `L.I.F.E. Ministry — ${fundName}`,
                description: `One-time gift to ${fundName}`,
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        success_url: `${request.nextUrl.origin}/give?success=true`,
        cancel_url: `${request.nextUrl.origin}/give?canceled=true`,
      });

      return NextResponse.json({ url: session.url });
    }
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
