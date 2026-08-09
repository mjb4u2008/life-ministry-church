"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, LoaderCircle, ShieldCheck } from "lucide-react";
import type { PublicGivingSettings } from "@/lib/giving";
import { Button } from "@/components/ui/button";

export function ZeffyPanel() {
  const [settings, setSettings] = useState<PublicGivingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/giving", { cache: "no-store" });
      if (!response.ok) throw new Error("Giving unavailable");
      setSettings(await response.json());
    } catch { setError("Online giving couldn’t load right now."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);

  if (loading) return <div className="flex min-h-72 items-center justify-center"><LoaderCircle className="size-8 animate-spin text-[#1a6fb5]" aria-label="Loading online giving" /></div>;
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-7 text-center text-red-800"><p>{error}</p><Button className="mt-4 min-h-11" onClick={() => void load()} variant="outline">Try again</Button></div>;
  if (!settings?.configured || !settings.campaignUrl || !settings.embedUrl) return <div className="rounded-2xl border border-[#dce8f2] bg-white p-8 text-center"><ShieldCheck className="mx-auto size-10 text-[#1a6fb5]" /><h2 className="mt-4 font-display text-2xl font-bold text-[#0a1a2f]">Online giving is being configured.</h2><p className="mt-2 font-body text-[#4a6580]">Please check back soon.</p></div>;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#c9dce9] bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-6 shrink-0 text-emerald-700" /><div><h2 className="font-display text-2xl font-bold text-[#0a1a2f]">Give securely through Zeffy</h2><p className="mt-2 font-body text-sm leading-relaxed text-[#4a6580]">Zeffy processes the donation and provides transaction confirmation. The church website does not receive your card or bank details.</p></div></div>
        <Button className="mt-5 min-h-12 w-full bg-[#1a6fb5] text-white sm:w-auto" render={<a href={settings.campaignUrl} rel="noopener noreferrer" target="_blank" />}>Open full Zeffy form <ExternalLink className="size-4" /></Button>
        <p className="mt-3 text-xs leading-relaxed text-[#4a6580]">Use the full form if the embed does not load or if you prefer wallet payment options. Zeffy may offer an optional contribution to support its platform; review the form before submitting.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#dce8f2] bg-white">
        <iframe
          allow="payment"
          className="h-[950px] w-full border-0 sm:h-[1050px]"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
          src={settings.embedUrl}
          title="Donation form powered by Zeffy"
        />
      </div>
      <p className="text-center text-xs leading-relaxed text-[#4a6580]">Zeffy supplies the transaction confirmation and any receipt it is configured to issue. Whether a gift qualifies for tax treatment depends on the ministry’s Zeffy setup and applicable law.</p>
    </div>
  );
}
