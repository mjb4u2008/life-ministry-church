"use client";

import { useId, useState } from "react";
import type { SiteContent } from "@/lib/data";
import { nextWednesdayDate } from "@/lib/service-schedule";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type WednesdayContent = Pick<SiteContent, "thisWednesday" | "wednesdayMeetLink" | "googleMeetLink">;
const labelClass = "block text-sm font-semibold font-body text-[#0a1a2f] mb-1.5";

function validWednesday(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && date.getUTCDay() === 3;
}

function normalizeMeetLink(value: string) {
  if (!value.trim()) return "";
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.hostname !== "meet.google.com" || url.username || url.password || url.port || url.hash || !/^\/(?:[a-z]{3}-[a-z]{4}-[a-z]{3}|lookup\/[a-zA-Z0-9_-]+)\/?$/.test(url.pathname)) return null;
    return url.href;
  } catch { return null; }
}

export function WednesdaySessionEditor({ token, content, onSaved }: {
  token: string;
  content: WednesdayContent;
  onSaved: (updated: SiteContent) => void;
}) {
  const id = useId();
  const nextDate = nextWednesdayDate();
  const savedMessage = content.thisWednesday;
  const currentMessage = savedMessage?.date && savedMessage.date >= nextDate ? savedMessage : undefined;
  const [date, setDate] = useState(currentMessage?.date || nextDate);
  const [title, setTitle] = useState(currentMessage?.title || "");
  const [scripture, setScripture] = useState(currentMessage?.scripture || "");
  const [description, setDescription] = useState(currentMessage?.description || "");
  const [meetLink, setMeetLink] = useState(content.wednesdayMeetLink || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const changed = () => { setSaved(false); setError(""); };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setError(""); setSaved(false);
    if (!validWednesday(date)) { setError("Choose a valid Wednesday date."); return; }
    const normalizedMeet = normalizeMeetLink(meetLink);
    if (normalizedMeet === null) { setError("Enter a full Google Meet meeting link beginning with https://meet.google.com/, or leave it blank to use Sunday’s link."); return; }
    const message = { date, title: title.trim(), scripture: scripture.trim(), description: description.trim() };
    setSaving(true);
    try {
      const response = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ thisWednesday: message, wednesdayMeetLink: normalizedMeet }),
        signal: AbortSignal.timeout(12_000),
      });
      if (response.status === 401 || response.status === 403) throw new Error("Your sign-in has expired. Keep a copy of your changes, then reload the page and sign in again.");
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string" ? payload.error : "Wednesday’s session could not be saved. Please try again.");
      if (!payload || typeof payload !== "object") throw new Error("The save wasn’t confirmed. Your changes are still here. Please try again.");
      const updated = payload as SiteContent;
      if (!updated.thisWednesday || Object.entries(message).some(([key, value]) => updated.thisWednesday?.[key as keyof typeof message] !== value) || (updated.wednesdayMeetLink || "") !== normalizedMeet || typeof updated.googleMeetLink !== "string" || !updated.thisSunday) throw new Error("The save wasn’t confirmed. Your changes are still here. Please try again.");
      setMeetLink(normalizedMeet);
      onSaved(updated);
      setSaved(true);
    } catch (failure) {
      setError(failure instanceof Error && failure.name !== "TimeoutError" ? failure.message : "The connection took too long. Your changes are still here. Please try again.");
    } finally { setSaving(false); }
  };

  return <div className="space-y-6 animate-fade-in">
    <div>
      <h2 className="text-xl font-display font-semibold text-[#0a1a2f] mb-1">This Wednesday</h2>
      <p className="text-sm font-body text-[#4a6580] mb-2">Wednesday sessions run from 7:30–9:30 PM Eastern.</p>
      <Badge variant="secondary" className="h-auto max-w-full whitespace-normal font-body text-xs leading-relaxed">This content appears on your homepage and Watch page when Wednesday is next.</Badge>
    </div>
    <Card className="shadow-sm border-0">
      <CardContent className="pt-6">
        <form onSubmit={save}>
          <fieldset disabled={saving} className="min-w-0 space-y-5">
            <legend className="sr-only">Wednesday session details</legend>
            <div>
              <label htmlFor={`${id}-date`} className={labelClass}>Wednesday Date</label>
              <Input id={`${id}-date`} type="date" value={date} required onChange={(event) => { setDate(event.target.value); changed(); }} className="h-11 px-4 font-body" />
              <p className="text-xs font-body text-[#4a6580] mt-1">Message details apply to this date. The weekly session continues even if no message is entered.</p>
            </div>
            <div>
              <label htmlFor={`${id}-title`} className={labelClass}>Message Title</label>
              <Input id={`${id}-title`} value={title} maxLength={60} onChange={(event) => { setTitle(event.target.value); changed(); }} placeholder="Wednesday Service" className="h-11 px-4 font-body" />
              <p className="text-xs font-body text-[#4a6580] mt-1">{title.length}/60 characters</p>
            </div>
            <div>
              <label htmlFor={`${id}-scripture`} className={labelClass}>Scripture Reference</label>
              <Input id={`${id}-scripture`} value={scripture} maxLength={40} onChange={(event) => { setScripture(event.target.value); changed(); }} placeholder="John 8:12" className="h-11 px-4 font-body" />
              <p className="text-xs font-body text-[#4a6580] mt-1">{scripture.length}/40 characters</p>
            </div>
            <div>
              <label htmlFor={`${id}-description`} className={labelClass}>Description</label>
              <Textarea id={`${id}-description`} rows={6} value={description} maxLength={300} onChange={(event) => { setDescription(event.target.value); changed(); }} placeholder="Write about this Wednesday’s message..." className="px-4 py-3 font-body resize-y" />
              <p className="text-xs font-body text-[#4a6580] mt-1">{description.length}/300 characters</p>
            </div>
            <Separator />
            <div>
              <label htmlFor={`${id}-meet`} className={labelClass}>Wednesday Google Meet Link (optional)</label>
              <Input id={`${id}-meet`} type="url" value={meetLink} maxLength={2048} onChange={(event) => { setMeetLink(event.target.value); changed(); }} placeholder="https://meet.google.com/xxx-xxxx-xxx" className="h-11 px-4 font-body" />
              <p className="text-xs font-body text-[#4a6580] mt-1">Leave blank to use the same Google Meet link as Sunday.</p>
              {content.googleMeetLink && <p className="text-xs font-body text-[#4a6580] mt-1 break-all">Sunday’s link: {content.googleMeetLink}</p>}
            </div>
          </fieldset>
          {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm font-body text-red-800">{error}</p>}
          {saved && <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-4 text-sm font-body text-emerald-800">Wednesday session saved.</p>}
          <div className="mt-8 flex justify-end"><Button type="submit" disabled={saving} className="h-11 px-8 bg-[#1a6fb5] hover:bg-[#155d99] text-white font-semibold font-body" size="lg">{saving ? "Saving..." : "Save This Wednesday"}</Button></div>
        </form>
      </CardContent>
    </Card>
  </div>;
}
