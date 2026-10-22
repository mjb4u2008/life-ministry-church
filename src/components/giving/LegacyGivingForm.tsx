"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Preserve the original Stripe fund, amount and recurring-gift choices while
// Zeffy is being configured. Card details stay on Stripe's hosted checkout.
const funds = [
  ["tithe", "Tithe"], ["offering", "General Offering"],
  ["missions", "Missions"], ["benevolence", "Benevolence Fund"],
];

export function LegacyGivingForm() {
  const [fund, setFund] = useState("tithe");
  const [amount, setAmount] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState("monthly");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  async function checkout(event: React.FormEvent) {
    event.preventDefault();
    setProcessing(true); setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, fund, isRecurring: recurring, frequency }),
      });
      const payload = await response.json();
      if (!response.ok || typeof payload.url !== "string") throw new Error(payload.error || "Payment could not be started. Please try again.");
      const target = new URL(payload.url);
      if (target.protocol !== "https:" || target.hostname !== "checkout.stripe.com") throw new Error("Payment could not be started. Please try again.");
      window.location.assign(target.toString());
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Payment could not be started. Please try again.");
      setProcessing(false);
    }
  }

  return <form className="space-y-6 rounded-2xl border border-[#dce8f2] bg-white p-6 text-[#0a1a2f] sm:p-8" onSubmit={(event) => void checkout(event)}>
    <div><h2 className="font-display text-2xl font-bold">Give securely through Stripe</h2><p className="mt-2 text-sm text-[#4a6580]">Choose your gift below, then continue to Stripe to enter payment details. Giving is always optional.</p></div>
    <label className="block text-sm font-bold">Choose a fund<select className="mt-2 min-h-12 w-full rounded-lg border border-input bg-white px-4 text-base" onChange={(event) => setFund(event.target.value)} value={fund}>{funds.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <fieldset><legend className="text-sm font-bold">Gift amount (USD)</legend><div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">{[25, 50, 100, 250, 500].map((preset) => <Button aria-pressed={amount === String(preset)} className="min-h-12" key={preset} onClick={() => setAmount(String(preset))} type="button" variant="outline">${preset}</Button>)}</div><label className="mt-4 block text-sm font-bold">Amount in US dollars<Input className="mt-2 h-12 px-4 text-base" max={50000} min={0.01} onChange={(event) => setAmount(event.target.value)} required step="0.01" type="number" value={amount} /></label></fieldset>
    <label className="flex min-h-11 items-center gap-3 text-sm font-bold"><input checked={recurring} className="size-5" onChange={(event) => setRecurring(event.target.checked)} type="checkbox" />Make this a recurring gift</label>
    {recurring && <label className="block text-sm font-bold">Frequency<select className="mt-2 min-h-12 w-full rounded-lg border border-input bg-white px-4 text-base" onChange={(event) => setFrequency(event.target.value)} value={frequency}><option value="weekly">Weekly</option><option value="biweekly">Every 2 weeks</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option></select></label>}
    {error && <p className="rounded-lg bg-red-50 p-4 text-red-800" role="alert">{error}</p>}
    <Button className="min-h-12 w-full bg-[#1a6fb5] text-white" disabled={processing || !amount || Number(amount) < 0.01 || Number(amount) > 50000} type="submit">{processing ? "Opening payment…" : "Continue to Payment"}</Button>
    <p className="text-center text-xs text-[#4a6580]">Stripe provides payment confirmation. This page does not confirm or charge your gift.</p>
  </form>;
}
