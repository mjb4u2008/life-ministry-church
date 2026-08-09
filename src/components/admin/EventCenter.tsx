"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarPlus, LoaderCircle, Save, Trash2 } from "lucide-react";
import {
  MINISTRY_TIMEZONE,
  MINISTRY_TIMEZONE_LABEL,
  zonedDateTimeToUtc,
} from "@/lib/gatherings";
import type { EventLocationType, EventStoreV1, MinistryEvent, MinistryEventStatus } from "@/lib/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function localFields(instant: string, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(instant));
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return { date: `${read("year")}-${read("month")}-${read("day")}`, time: `${read("hour")}:${read("minute")}` };
}

function tomorrow() {
  const easternToday = localFields(new Date().toISOString(), MINISTRY_TIMEZONE).date;
  const [year, month, day] = easternToday.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

export function EventCenter({ token, logout }: { token: string; logout: () => void }) {
  const [store, setStore] = useState<EventStoreV1 | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(tomorrow());
  const [startTime, setStartTime] = useState("19:00");
  const [endDate, setEndDate] = useState(tomorrow());
  const [endTime, setEndTime] = useState("20:30");
  const [locationType, setLocationType] = useState<EventLocationType>("online");
  const [locationLabel, setLocationLabel] = useState("Online");
  const [meetUrl, setMeetUrl] = useState("");
  const [registrationUrl, setRegistrationUrl] = useState("");
  const [status, setStatus] = useState<MinistryEventStatus>("draft");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const reset = () => {
    const date = tomorrow();
    setSelectedId(null); setTitle(""); setDescription(""); setStartDate(date); setEndDate(date);
    setStartTime("19:00"); setEndTime("20:30");
    setLocationType("online"); setLocationLabel("Online"); setMeetUrl(""); setRegistrationUrl(""); setStatus("draft"); setError(""); setSuccess("");
  };

  const choose = (event: MinistryEvent) => {
    const start = localFields(event.startsAt, MINISTRY_TIMEZONE);
    const end = localFields(
      event.endsAt ?? new Date(Date.parse(event.startsAt) + 60 * 60_000).toISOString(),
      MINISTRY_TIMEZONE,
    );
    setSelectedId(event.id); setTitle(event.title); setDescription(event.description);
    setStartDate(start.date); setStartTime(start.time); setEndDate(end.date); setEndTime(end.time);
    setLocationType(event.locationType); setLocationLabel(event.locationLabel ?? "");
    setMeetUrl(event.meetUrl ?? ""); setRegistrationUrl(event.registrationUrl ?? ""); setStatus(event.status); setError(""); setSuccess("");
  };

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/events?admin=1", { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 401 || response.status === 403) { logout(); return; }
      if (!response.ok) throw new Error("Unable to load events");
      setStore(await response.json());
    } catch { setError("Events could not be loaded. Please try again."); }
    finally { setLoading(false); }
  }, [logout, token]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);

  const preview = useMemo(() => {
    try {
      const startsAt = zonedDateTimeToUtc(startDate, startTime, MINISTRY_TIMEZONE).toISOString();
      const endsAt = zonedDateTimeToUtc(endDate, endTime, MINISTRY_TIMEZONE).toISOString();
      return Date.parse(endsAt) > Date.parse(startsAt) ? { startsAt, endsAt } : null;
    } catch { return null; }
  }, [endDate, endTime, startDate, startTime]);

  const save = async (nextStatus: MinistryEventStatus) => {
    if (!store) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      if (!preview) throw new Error("Choose a valid start and end time. The end must be later than the start.");
      const event = { title, description, ...preview, timezone: MINISTRY_TIMEZONE, status: nextStatus, locationType, locationLabel, meetUrl, registrationUrl };
      const response = await fetch("/api/events", {
        method: selectedId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(selectedId
          ? { id: selectedId, expectedRevision: store.revision, event }
          : { expectedRevision: store.revision, event }),
      });
      if (response.status === 401 || response.status === 403) { logout(); return; }
      const payload = await response.json();
      if (!response.ok) throw new Error(response.status === 409 ? "Events changed. Reload the latest version before saving." : payload.error || "Save failed");
      setStore(payload.store); setSelectedId(payload.event.id); setStatus(nextStatus); setSuccess(`${title} saved as ${nextStatus}.`);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Event could not be saved."); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!store || !selectedId || !window.confirm("Delete this event permanently? Use Cancel for an event people may already know about.")) return;
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/events?id=${encodeURIComponent(selectedId)}&expectedRevision=${store.revision}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 401 || response.status === 403) { logout(); return; }
      const payload = await response.json();
      if (!response.ok) throw new Error(response.status === 409 ? "Events changed. Reload before deleting." : payload.error || "Delete failed");
      setStore(payload); reset();
    } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "Event could not be deleted."); }
    finally { setSaving(false); }
  };

  return (
    <main className="min-h-screen bg-[#f0f4f8] pb-24 pt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-widest text-[#1a6fb5]">Ministry admin</p><h1 className="mt-2 font-display text-4xl font-bold text-[#0a1a2f]">Events Center</h1></div>
          <div className="flex gap-2"><Button className="min-h-11" onClick={reset} variant="outline"><CalendarPlus className="size-4" /> New event</Button><Button className="min-h-11" onClick={logout} variant="outline">Sign out</Button></div>
        </div>
        {loading ? <div className="flex min-h-64 items-center justify-center"><LoaderCircle className="size-8 animate-spin text-[#1a6fb5]" /></div>
          : !store ? <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-7 text-center text-red-800"><p>{error || "Events could not be loaded."}</p><Button className="mt-4 min-h-11" onClick={() => void load()} variant="outline">Try again</Button></div>
          : (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[0.7fr_1.3fr]">
            <aside className="space-y-3">
              <h2 className="font-display text-xl font-bold text-[#0a1a2f]">Saved events</h2>
              {store?.events.length ? [...store.events].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)).map((event) => (
                <button className={`w-full rounded-xl border bg-white p-4 text-left ${selectedId === event.id ? "border-[#1a6fb5] ring-2 ring-[#1a6fb5]/10" : "border-[#dce8f2]"}`} key={event.id} onClick={() => choose(event)}>
                  <span className="block font-body text-xs font-bold uppercase text-[#1a6fb5]">{event.status}</span><span className="mt-1 block font-display text-lg font-bold text-[#0a1a2f]">{event.title}</span><span className="mt-1 block text-sm text-[#4a6580]">{new Intl.DateTimeFormat("en-US", { timeZone: MINISTRY_TIMEZONE }).format(new Date(event.startsAt))}</span>
                </button>
              )) : <p className="rounded-xl bg-white p-5 text-sm text-[#4a6580]">No special events yet.</p>}
            </aside>
            <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-7">
              <h2 className="font-display text-2xl font-bold text-[#0a1a2f]">{selectedId ? "Edit event" : "Create event"}</h2>
              <div className="mt-6 space-y-5">
                <label className="block text-sm font-bold">Title<Input className="mt-2 h-12 px-4 text-base" maxLength={120} onChange={(event) => setTitle(event.target.value)} value={title} /></label>
                <label className="block text-sm font-bold">Description<Textarea className="mt-2 min-h-32 px-4 py-3 text-base" maxLength={3000} onChange={(event) => setDescription(event.target.value)} value={description} /></label>
                <p className="rounded-xl bg-[#f0f4f8] p-4 text-sm text-[#4a6580]">All event times use <strong className="text-[#0a1a2f]">{MINISTRY_TIMEZONE_LABEL}</strong>.</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="text-sm font-bold">Start date<Input className="mt-2 h-12 px-4 text-base" onChange={(event) => setStartDate(event.target.value)} type="date" value={startDate} /></label>
                  <label className="text-sm font-bold">Start time<Input className="mt-2 h-12 px-4 text-base" onChange={(event) => setStartTime(event.target.value)} type="time" value={startTime} /></label>
                  <label className="text-sm font-bold">End date<Input className="mt-2 h-12 px-4 text-base" onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} /></label>
                  <label className="text-sm font-bold">End time<Input className="mt-2 h-12 px-4 text-base" onChange={(event) => setEndTime(event.target.value)} type="time" value={endTime} /></label>
                  <label className="text-sm font-bold">Location type<select className="mt-2 h-12 w-full rounded-lg border border-input bg-white px-4 text-base" onChange={(event) => setLocationType(event.target.value as EventLocationType)} value={locationType}><option value="online">Online</option><option value="in-person">In person</option><option value="hybrid">Hybrid</option></select></label>
                </div>
                <label className="block text-sm font-bold">Location name or address<Input className="mt-2 h-12 px-4 text-base" maxLength={200} onChange={(event) => setLocationLabel(event.target.value)} value={locationLabel} /></label>
                {(locationType === "online" || locationType === "hybrid") && <label className="block text-sm font-bold">Google Meet link<Input className="mt-2 h-12 px-4 text-base" onChange={(event) => setMeetUrl(event.target.value)} placeholder="https://meet.google.com/..." type="url" value={meetUrl} /></label>}
                <label className="block text-sm font-bold">Registration link (optional)<Input className="mt-2 h-12 px-4 text-base" onChange={(event) => setRegistrationUrl(event.target.value)} type="url" value={registrationUrl} /></label>
                {preview && <p className="rounded-xl bg-[#f0f4f8] p-4 text-sm text-[#4a6580]">Preview: {new Intl.DateTimeFormat("en-US", { timeZone: MINISTRY_TIMEZONE, dateStyle: "full", timeStyle: "short" }).format(new Date(preview.startsAt))} ({MINISTRY_TIMEZONE_LABEL}) · {status}</p>}
                {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700" aria-live="polite">{error}{error.includes("Reload") && <Button className="mt-3 block" onClick={() => void load()} variant="outline">Reload latest</Button>}</div>}
                {success && <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700" role="status">{success}</p>}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Button className="min-h-12" disabled={saving} onClick={() => void save("draft")} variant="outline"><Save className="size-4" /> Save draft</Button>
                  <Button className="min-h-12 bg-[#1a6fb5] text-white" disabled={saving} onClick={() => void save("published")}>Publish</Button>
                  <Button className="min-h-12 text-amber-800" disabled={saving || !selectedId} onClick={() => void save("cancelled")} variant="outline">Cancel event</Button>
                  <Button className="min-h-12 text-red-700" disabled={saving || !selectedId} onClick={() => void remove()} variant="outline"><Trash2 className="size-4" /> Delete mistake</Button>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
