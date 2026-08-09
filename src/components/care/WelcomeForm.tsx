"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function WelcomeForm({ compact = false }: { compact?: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredContact, setPreferredContact] = useState<"email" | "phone">("email");
  const [message, setMessage] = useState("");
  const [permission, setPermission] = useState(false);
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/care", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "visitor",
          name,
          message: message || "I joined L.I.F.E. Ministry for the first time.",
          contactPermission: permission,
          email: email || undefined,
          phone: phone || undefined,
          preferredContact,
          website,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "We could not send your welcome note.");
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "We could not send your welcome note.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-6 text-emerald-900" role="status">
        <CheckCircle2 className="size-7" />
        <h3 className="mt-3 font-display text-2xl font-bold">You’re welcome here.</h3>
        <p className="mt-2 font-body">Pastor Mike received your private note and can follow up using your chosen contact.</p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className={compact ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>
        <label className="block font-body text-sm font-bold">First name
          <Input className="mt-2 h-12 px-4 text-base" maxLength={120} onChange={(event) => setName(event.target.value)} required value={name} />
        </label>
        <label className="block font-body text-sm font-bold">Email
          <Input className="mt-2 h-12 px-4 text-base" maxLength={254} onChange={(event) => setEmail(event.target.value)} required={preferredContact === "email"} type="email" value={email} />
        </label>
        <label className="block font-body text-sm font-bold">Phone
          <Input className="mt-2 h-12 px-4 text-base" maxLength={40} onChange={(event) => setPhone(event.target.value)} required={preferredContact === "phone"} type="tel" value={phone} />
        </label>
        <label className="block font-body text-sm font-bold">Best way to reach you
          <select className="mt-2 h-12 w-full rounded-lg border border-input bg-white px-4 text-base" onChange={(event) => setPreferredContact(event.target.value as "email" | "phone")} value={preferredContact}>
            <option value="email">Email</option>
            <option value="phone">Phone or text</option>
          </select>
        </label>
      </div>
      <label className="block font-body text-sm font-bold">Anything you’d like Pastor Mike to know? (optional)
        <Textarea className="mt-2 min-h-28 px-4 py-3 text-base" maxLength={4000} onChange={(event) => setMessage(event.target.value)} value={message} />
      </label>
      <label className="hidden" aria-hidden="true">Website
        <Input autoComplete="off" onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} value={website} />
      </label>
      <label className="flex min-h-11 items-start gap-3 rounded-xl bg-[#f0f4f8] p-4 font-body text-sm text-[#0a1a2f]">
        <input checked={permission} className="mt-0.5 size-5 shrink-0" onChange={(event) => setPermission(event.target.checked)} required type="checkbox" />
        Pastor Mike may contact me about my visit. This does not subscribe me to marketing or reminders.
      </label>
      {error && <p aria-live="polite" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <Button className="min-h-12 w-full bg-[#1a6fb5] font-body font-bold text-white" disabled={submitting || !permission || (!email && !phone)} type="submit">
        {submitting ? <><LoaderCircle className="size-4 animate-spin" /> Sending…</> : "Let Pastor Mike know I’m new"}
      </Button>
      <p className="font-body text-xs leading-relaxed text-[#4a6580]">Your note and contact information stay in the private pastoral care inbox.</p>
    </form>
  );
}
