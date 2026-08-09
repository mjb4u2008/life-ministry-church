"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, LoaderCircle, Save } from "lucide-react";
import type { GivingSettingsV1 } from "@/lib/giving";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GivingSettings({ token, logout }: { token: string; logout: () => void }) {
  const [settings, setSettings] = useState<GivingSettingsV1 | null>(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/giving?admin=1", { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 401 || response.status === 403) { logout(); return; }
      if (!response.ok) throw new Error("Unable to load giving settings");
      const payload = await response.json() as GivingSettingsV1;
      setSettings(payload); setUrl(payload.zeffyCampaignUrl);
    } catch { setError("Giving settings could not be loaded."); }
    finally { setLoading(false); }
  }, [logout, token]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);

  const save = async () => {
    if (!settings) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/giving", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ expectedRevision: settings.revision, zeffyCampaignUrl: url }),
      });
      if (response.status === 401 || response.status === 403) { logout(); return; }
      const payload = await response.json();
      if (!response.ok) throw new Error(response.status === 409 ? "Giving settings changed. Reload before saving." : payload.error || "Save failed");
      setSettings(payload); setUrl(payload.zeffyCampaignUrl); setSuccess(payload.zeffyCampaignUrl ? "Zeffy giving is live on the Give page." : "Online giving is now hidden until a Zeffy link is added.");
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Giving settings could not be saved."); }
    finally { setSaving(false); }
  };

  return (
    <main className="min-h-screen bg-[#f0f4f8] pb-24 pt-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-[#1a6fb5]">Ministry admin</p><h1 className="mt-2 font-display text-4xl font-bold text-[#0a1a2f]">Online Giving</h1></div><Button className="min-h-11" onClick={logout} variant="outline">Sign out</Button></div>
        {loading ? <div className="flex min-h-64 items-center justify-center"><LoaderCircle className="size-8 animate-spin text-[#1a6fb5]" /></div>
          : !settings ? <div className="mt-8 rounded-2xl bg-red-50 p-7 text-center text-red-800"><p>{error}</p><Button className="mt-4 min-h-11" onClick={() => void load()} variant="outline">Try again</Button></div>
          : <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-2xl font-bold text-[#0a1a2f]">Connect the Zeffy donation form</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 font-body text-sm leading-relaxed text-[#4a6580]"><li>Open the campaign in Zeffy.</li><li>Choose Share, then copy the direct donation-form link.</li><li>Paste it below and save.</li></ol>
            <label className="mt-7 block font-body text-sm font-bold">Zeffy donation-form URL
              <Input className="mt-2 h-12 px-4 text-base" onChange={(event) => setUrl(event.target.value)} placeholder="https://www.zeffy.com/en-US/donation-form/..." type="url" value={url} />
            </label>
            <p className="mt-2 text-xs text-[#4a6580]">Only HTTPS donation links on zeffy.com are accepted. Clear the field to hide online giving.</p>
            {error && <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700" aria-live="polite">{error}{error.includes("Reload") && <Button className="mt-3 block" onClick={() => void load()} variant="outline">Reload latest</Button>}</div>}
            {success && <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700" role="status">{success}</p>}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button className="min-h-12 bg-[#1a6fb5] text-white" disabled={saving} onClick={() => void save()}><Save className="size-4" /> {saving ? "Saving…" : "Save giving settings"}</Button>
              {settings.zeffyCampaignUrl && <Button className="min-h-12" render={<a href={settings.zeffyCampaignUrl} rel="noopener noreferrer" target="_blank" />} variant="outline">Open Zeffy form <ExternalLink className="size-4" /></Button>}
            </div>
          </section>}
      </div>
    </main>
  );
}
