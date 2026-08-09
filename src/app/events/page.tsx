"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, CalendarPlus, Clock, ExternalLink, LoaderCircle, MapPin, Video } from "lucide-react";
import type { PublicGatheringOccurrence } from "@/lib/gatherings";
import type { PublicMinistryEvent } from "@/lib/events";
import { Button } from "@/components/ui/button";

type GatheringView = PublicGatheringOccurrence & { timezone: string };

function eventTime(startsAt: string, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(startsAt));
}

function EventCard({ event }: { event: PublicMinistryEvent }) {
  return (
    <article className="rounded-2xl border border-[#dce8f2] bg-white p-6 shadow-sm sm:p-7">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1a6fb5]">Special event</p>
      <h2 className="mt-3 font-display text-3xl font-bold text-[#0a1a2f]">{event.title}</h2>
      <div className="mt-4 space-y-2 text-sm text-[#4a6580]">
        <p className="flex items-start gap-2"><Clock className="mt-0.5 size-4 shrink-0 text-[#1a6fb5]" /> {eventTime(event.startsAt, event.timezone)}</p>
        <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-[#1a6fb5]" /> {event.locationLabel || (event.locationType === "online" ? "Online" : "Location shared by the ministry")}</p>
      </div>
      <p className="mt-5 whitespace-pre-wrap font-body leading-relaxed text-[#4a6580]">{event.description}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {event.registrationUrl && <Button className="min-h-12 bg-[#1a6fb5] text-white" render={<a href={event.registrationUrl} rel="noopener noreferrer" target="_blank" />}>Register <ExternalLink className="size-4" /></Button>}
        {event.joinUrl && <Button className="min-h-12 bg-emerald-700 text-white" render={<a href={event.joinUrl} rel="noopener noreferrer" target="_blank" />}>Join online <Video className="size-4" /></Button>}
        <Button className="min-h-12" render={<a href={`/api/events/${encodeURIComponent(event.id)}/calendar`} />} variant="outline"><CalendarPlus className="size-4" /> Add to calendar</Button>
      </div>
    </article>
  );
}

function GatheringCard({ gathering }: { gathering: GatheringView }) {
  return (
    <article className="rounded-2xl border border-[#c9dce9] bg-[#f7fbfe] p-5 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1a6fb5]">Weekly gathering</p>
      <h3 className="mt-2 font-display text-2xl font-bold text-[#0a1a2f]">{gathering.title}</h3>
      <p className="mt-3 flex items-start gap-2 text-sm text-[#4a6580]"><Clock className="mt-0.5 size-4 shrink-0 text-[#1a6fb5]" /> {eventTime(gathering.startsAt, gathering.timezone)}</p>
      {gathering.description && <p className="mt-4 font-body text-sm leading-relaxed text-[#4a6580]">{gathering.description}</p>}
      <Button className="mt-5 min-h-11" render={<Link href="/watch" />} variant="outline">Gathering details</Button>
    </article>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<PublicMinistryEvent[]>([]);
  const [gatherings, setGatherings] = useState<GatheringView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [eventResponse, gatheringResponse] = await Promise.all([
        fetch("/api/events", { cache: "no-store" }),
        fetch("/api/gatherings", { cache: "no-store" }),
      ]);
      if (!eventResponse.ok || !gatheringResponse.ok) throw new Error("Unable to load events");
      const eventPayload = await eventResponse.json();
      const gatheringPayload = await gatheringResponse.json();
      setEvents(eventPayload.events ?? []);
      const candidates: PublicGatheringOccurrence[] = [
        ...(gatheringPayload.featured && Date.parse(gatheringPayload.featured.startsAt) > Date.now() ? [gatheringPayload.featured] : []),
        ...(gatheringPayload.upcoming ?? []),
      ];
      const seriesTimezones = new Map<string, string>((gatheringPayload.series ?? []).map((series: { id: string; schedule?: { timezone?: string } | null }) => [series.id, series.schedule?.timezone ?? "UTC"]));
      setGatherings([...new Map(candidates.map((item) => [item.id, { ...item, timezone: seriesTimezones.get(item.seriesId) ?? "UTC" }])).values()].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)));
    } catch { setError("Events couldn’t load right now. Please try again."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);
  const sortedEvents = useMemo(() => [...events].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)), [events]);

  return (
    <main className="min-h-screen bg-[#fafcff] pb-24 pt-20">
      <section className="bg-[#0a1a2f] px-4 py-20 text-center text-white sm:py-28">
        <Calendar className="mx-auto size-9 text-[#00d4ff]" />
        <h1 className="mt-5 font-display text-5xl font-black sm:text-7xl">Events & Gatherings</h1>
        <p className="mx-auto mt-5 max-w-2xl font-body text-lg text-white/70">Real dates from the ministry calendar—special events plus our Wednesday and Sunday gatherings.</p>
      </section>
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        {loading ? <div className="flex min-h-72 items-center justify-center"><LoaderCircle className="size-9 animate-spin text-[#1a6fb5]" aria-label="Loading events" /></div>
          : error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-800"><p>{error}</p><Button className="mt-5 min-h-11" onClick={() => void load()} variant="outline">Try again</Button></div>
          : <>
            <section>
              <h2 className="font-display text-3xl font-bold text-[#0a1a2f]">Special events</h2>
              {sortedEvents.length ? <div className="mt-6 space-y-5">{sortedEvents.map((event) => <EventCard event={event} key={event.id} />)}</div>
                : <div className="mt-6 rounded-2xl border border-[#dce8f2] bg-white p-8 text-center"><Calendar className="mx-auto size-9 text-[#1a6fb5]" /><h3 className="mt-4 font-display text-2xl font-bold text-[#0a1a2f]">No special events are scheduled right now.</h3>{gatherings.length > 0 && <p className="mt-2 text-[#4a6580]">You can still join one of the published weekly gatherings below.</p>}</div>}
            </section>
            <section className="mt-14">
              <h2 className="font-display text-3xl font-bold text-[#0a1a2f]">Weekly gatherings</h2>
              {gatherings.length ? <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">{gatherings.map((gathering) => <GatheringCard gathering={gathering} key={gathering.id} />)}</div>
                : <div className="mt-6 rounded-2xl bg-[#f0f4f8] p-6 text-[#4a6580]">No upcoming gathering has been published yet. Check back soon.</div>}
            </section>
          </>}
      </div>
    </main>
  );
}
