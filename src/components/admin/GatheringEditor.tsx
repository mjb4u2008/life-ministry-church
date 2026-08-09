"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, LoaderCircle, RefreshCw } from "lucide-react";
import {
  buildOccurrenceTimes,
  type GatheringOccurrence,
  type GatheringSchedule,
  type GatheringSeries,
  type GatheringStatus,
  type GatheringStoreV1,
} from "@/lib/gatherings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
];

function localParts(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(read("weekday"));
  return {
    date: `${read("year")}-${read("month")}-${read("day")}`,
    time: `${read("hour")}:${read("minute")}`,
    weekday,
  };
}

function addLocalDays(localDate: string, days: number) {
  const [year, month, day] = localDate.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days));
  return value.toISOString().slice(0, 10);
}

export function formatPreviewTime(startsAt: string, timezone: string) {
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

export function nextScheduledLocalDate(
  dayOfWeek: number,
  localTime: string,
  timezone: string,
  now = new Date(),
) {
  const local = localParts(now, timezone);
  let daysUntil = (dayOfWeek - local.weekday + 7) % 7;
  if (daysUntil === 0 && local.time >= localTime) daysUntil = 7;
  return addLocalDays(local.date, daysUntil);
}

function currentOccurrence(store: GatheringStoreV1, seriesId: string) {
  const now = Date.now();
  const occurrences = store.occurrences
    .filter((item) => item.seriesId === seriesId)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  return occurrences.find((item) => Date.parse(item.endsAt) > now);
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export function GatheringEditor({
  token,
  seriesId,
  onUnauthorized,
}: {
  token: string;
  seriesId: string;
  onUnauthorized: () => void;
}) {
  const [store, setStore] = useState<GatheringStoreV1 | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState(3);
  const [localTime, setLocalTime] = useState("19:00");
  const [timezone, setTimezone] = useState("America/New_York");
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [meetUrl, setMeetUrl] = useState("");
  const [joinWindowMinutes, setJoinWindowMinutes] = useState(30);

  const [occurrenceId, setOccurrenceId] = useState<string | null>(null);
  const [localDate, setLocalDate] = useState("");
  const [title, setTitle] = useState("");
  const [scripture, setScripture] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<GatheringStatus>("draft");
  const [replayUrl, setReplayUrl] = useState("");

  const [banner, setBanner] = useState<string | null>(null);
  const [bannerMime, setBannerMime] = useState<string | null>(null);
  const [generatingBanner, setGeneratingBanner] = useState(false);
  const [bannerError, setBannerError] = useState("");

  const series = store?.series.find((item) => item.id === seriesId);

  const populate = useCallback((nextStore: GatheringStoreV1) => {
    const nextSeries = nextStore.series.find((item) => item.id === seriesId);
    if (!nextSeries) {
      setStore(nextStore);
      setError("This gathering series does not exist.");
      return;
    }
    const fallbackDay = nextSeries.kind === "sunday" ? 0 : 3;
    const fallbackTime = nextSeries.kind === "sunday" ? "10:00" : "19:00";
    const schedule = nextSeries.schedule ?? {
      dayOfWeek: fallbackDay as 0 | 3,
      localTime: fallbackTime,
      timezone: "America/New_York",
      durationMinutes: 90,
    };
    const occurrence = currentOccurrence(nextStore, seriesId);

    setStore(nextStore);
    setName(nextSeries.name);
    setEnabled(nextSeries.enabled);
    setDayOfWeek(schedule.dayOfWeek);
    setLocalTime(schedule.localTime);
    setTimezone(schedule.timezone);
    setDurationMinutes(schedule.durationMinutes);
    setMeetUrl(nextSeries.defaultMeetUrl);
    setJoinWindowMinutes(nextSeries.joinWindowMinutes);

    setOccurrenceId(occurrence?.id ?? null);
    setLocalDate(
      occurrence?.localDate ??
        nextScheduledLocalDate(schedule.dayOfWeek, schedule.localTime, schedule.timezone),
    );
    setTitle(occurrence?.title ?? "");
    setScripture(occurrence?.scripture ?? "");
    setDescription(occurrence?.description ?? "");
    setStatus(occurrence?.status ?? "draft");
    setReplayUrl(occurrence?.replayUrl ?? "");
  }, [seriesId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/gatherings?admin=1", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) {
        onUnauthorized();
        return;
      }
      if (!response.ok) throw new Error("Unable to load gathering");
      populate(await response.json());
    } catch {
      setError("This gathering could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized, populate, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const previewTimes = useMemo(() => {
    if (!localDate || !localTime || !timezone) return null;
    try {
      return buildOccurrenceTimes(localDate, localTime, timezone, durationMinutes);
    } catch {
      return null;
    }
  }, [durationMinutes, localDate, localTime, timezone]);

  const put = async (body: unknown) => {
    const response = await fetch("/api/gatherings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const payload = await readJson(response);
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        onUnauthorized();
        throw new Error("SESSION_EXPIRED");
      }
      if (response.status === 409) {
        throw new Error("CONFLICT");
      }
      throw new Error(
        Array.isArray(payload.issues) ? payload.issues.join(". ") : payload.error || "Save failed",
      );
    }
    return payload as GatheringStoreV1;
  };

  const generateSundayBanner = async () => {
    if (!series || series.kind !== "sunday" || !title.trim()) return;
    setGeneratingBanner(true);
    setBannerError("");
    try {
      const response = await fetch("/api/sermon-banner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, scripture }),
      });
      if (response.status === 401 || response.status === 403) {
        onUnauthorized();
        return;
      }
      const payload = await readJson(response);
      if (!response.ok || typeof payload.image !== "string") {
        throw new Error(payload.error || "Banner generation failed.");
      }
      setBanner(payload.image);
      setBannerMime(payload.mimeType);
    } catch (generationError) {
      setBannerError(
        generationError instanceof Error ? generationError.message : "Banner generation failed.",
      );
    } finally {
      setGeneratingBanner(false);
    }
  };

  const save = async (nextStatus: GatheringStatus = status) => {
    if (!store || !series) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      if (!name.trim()) throw new Error("Gathering name is required.");
      if (!localDate || !previewTimes) throw new Error("Choose a valid date, time, and timezone.");
      const now = new Date().toISOString();
      const nextSeries: GatheringSeries = {
        ...series,
        name: name.trim(),
        enabled,
        schedule: {
          dayOfWeek: dayOfWeek as GatheringSchedule["dayOfWeek"],
          localTime,
          timezone,
          durationMinutes,
        },
        defaultMeetUrl: meetUrl.trim(),
        joinWindowMinutes,
        updatedAt: now,
      };
      const afterSeries = await put({
        operation: "upsert-series",
        expectedRevision: store.revision,
        series: nextSeries,
      });
      const existing = occurrenceId
        ? store.occurrences.find((item) => item.id === occurrenceId)
        : undefined;
      const occurrence: GatheringOccurrence = {
        id: occurrenceId ?? `${series.id}:${localDate}`,
        seriesId: series.id,
        localDate,
        startsAt: previewTimes.startsAt,
        endsAt: previewTimes.endsAt,
        status: nextStatus,
        title: title.trim(),
        scripture: scripture.trim(),
        description: description.trim(),
        updatedAt: now,
        ...(replayUrl.trim() ? { replayUrl: replayUrl.trim() } : {}),
        ...(nextStatus === "published" || nextStatus === "live" || nextStatus === "completed"
          ? { publishedAt: existing?.publishedAt ?? now }
          : {}),
        ...(nextStatus === "completed" ? { completedAt: existing?.completedAt ?? now } : {}),
      };
      const afterOccurrence = await put({
        operation: "upsert-occurrence",
        expectedRevision: afterSeries.revision,
        occurrence,
      });
      setStore(afterOccurrence);
      setOccurrenceId(occurrence.id);
      setStatus(nextStatus);
      setSuccess(`${nextSeries.name} saved as ${nextStatus}.`);
      if (series.kind === "sunday" && title.trim()) void generateSundayBanner();
    } catch (saveError) {
      setError(
        saveError instanceof Error && saveError.message === "SESSION_EXPIRED"
          ? "Your session expired. Please sign in again."
          : saveError instanceof Error && saveError.message === "CONFLICT"
          ? "Someone else changed this gathering. Reload the latest version before saving again."
          : saveError instanceof Error
            ? saveError.message
            : "The gathering could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  const downloadBanner = () => {
    if (!banner || !bannerMime) return;
    const extension = bannerMime.includes("png") ? "png" : "jpg";
    const link = document.createElement("a");
    link.href = `data:${bannerMime};base64,${banner}`;
    link.download = `LIFE-Ministry-Sermon-Banner.${extension}`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8] pt-20">
        <LoaderCircle className="size-8 animate-spin text-[#1a6fb5]" aria-label="Loading editor" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] px-4 pb-20 pt-28 text-center">
        <h1 className="font-display text-3xl font-bold text-[#0a1a2f]">Gathering not found</h1>
        <p className="mt-3 text-[#4a6580]">{error}</p>
        <Button className="mt-6" render={<Link href="/admin" />}>Back to admin</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-24 pt-20">
      <header className="border-b border-[#dce8f2] bg-white">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
          <Link className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#1a6fb5]" href="/admin">
            <ArrowLeft className="size-4" /> This Week
          </Link>
          <h1 className="mt-2 font-display text-3xl font-bold text-[#0a1a2f] sm:text-4xl">
            Prepare {series.name}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
            {error.includes("Reload") && (
              <Button className="mt-3 min-h-11 w-full sm:w-auto" onClick={() => void load()} variant="outline">
                <RefreshCw className="size-4" /> Reload latest
              </Button>
            )}
          </div>
        )}
        {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{success}</div>}

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Schedule and joining</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <label className="flex min-h-11 items-center justify-between gap-4 rounded-xl bg-[#f7fafc] p-4">
              <span><span className="block font-body font-bold">Enabled</span><span className="text-sm text-[#4a6580]">Show this gathering publicly when published.</span></span>
              <input checked={enabled} className="size-5" onChange={(event) => setEnabled(event.target.checked)} type="checkbox" />
            </label>
            <label className="block font-body text-sm font-bold">Gathering name
              <Input className="mt-2 h-12 px-4 text-base" maxLength={120} onChange={(event) => setName(event.target.value)} value={name} />
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="font-body text-sm font-bold">Day
                <select className="mt-2 h-12 w-full rounded-lg border border-input bg-white px-4 text-base" onChange={(event) => setDayOfWeek(Number(event.target.value))} value={dayOfWeek}>
                  {DAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}
                </select>
              </label>
              <label className="font-body text-sm font-bold">Local time
                <Input className="mt-2 h-12 px-4 text-base" onChange={(event) => setLocalTime(event.target.value)} type="time" value={localTime} />
              </label>
              <label className="font-body text-sm font-bold">Timezone
                <select className="mt-2 h-12 w-full rounded-lg border border-input bg-white px-4 text-base" onChange={(event) => setTimezone(event.target.value)} value={timezone}>
                  {TIMEZONES.map((zone) => <option key={zone} value={zone}>{zone.replace("America/", "").replace("_", " ")}</option>)}
                </select>
              </label>
              <label className="font-body text-sm font-bold">Duration (minutes)
                <Input className="mt-2 h-12 px-4 text-base" max={480} min={15} onChange={(event) => setDurationMinutes(Number(event.target.value))} type="number" value={durationMinutes} />
              </label>
            </div>
            <label className="block font-body text-sm font-bold">Default Google Meet link
              <Input className="mt-2 h-12 px-4 text-base" onChange={(event) => setMeetUrl(event.target.value)} placeholder="https://meet.google.com/xxx-xxxx-xxx" type="url" value={meetUrl} />
            </label>
            <label className="block font-body text-sm font-bold">Open join link this many minutes before
              <Input className="mt-2 h-12 px-4 text-base" max={1440} min={0} onChange={(event) => setJoinWindowMinutes(Number(event.target.value))} type="number" value={joinWindowMinutes} />
            </label>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Message and publishing</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <label className="block font-body text-sm font-bold">Date
              <Input className="mt-2 h-12 px-4 text-base" onChange={(event) => setLocalDate(event.target.value)} type="date" value={localDate} />
            </label>
            <label className="block font-body text-sm font-bold">Message title
              <Input className="mt-2 h-12 px-4 text-base" maxLength={120} onChange={(event) => setTitle(event.target.value)} value={title} />
            </label>
            <label className="block font-body text-sm font-bold">Scripture
              <Input className="mt-2 h-12 px-4 text-base" maxLength={100} onChange={(event) => setScripture(event.target.value)} value={scripture} />
            </label>
            <label className="block font-body text-sm font-bold">Description
              <Textarea className="mt-2 min-h-32 px-4 py-3 text-base" maxLength={2000} onChange={(event) => setDescription(event.target.value)} value={description} />
            </label>
            <label className="block font-body text-sm font-bold">Replay URL
              <Input className="mt-2 h-12 px-4 text-base" onChange={(event) => setReplayUrl(event.target.value)} placeholder="https://youtube.com/watch?v=..." type="url" value={replayUrl} />
            </label>
          </CardContent>
        </Card>

        <Card className="border border-[#bfd5e5] shadow-sm">
          <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs font-bold uppercase tracking-widest text-[#1a6fb5]">{name || "Gathering"}</p>
            <h2 className="mt-2 break-words font-display text-3xl font-bold text-[#0a1a2f]">{title || "Message title"}</h2>
            {scripture && <p className="mt-2 font-semibold text-[#1a6fb5]">{scripture}</p>}
            {description && <p className="mt-4 whitespace-pre-wrap text-[#4a6580]">{description}</p>}
            {previewTimes && (
              <p className="mt-4 text-sm text-[#4a6580]">Starts {formatPreviewTime(previewTimes.startsAt, timezone)}</p>
            )}
            <p className="mt-3 text-sm font-bold capitalize text-[#0a1a2f]">Status: {status}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Button className="min-h-12" disabled={saving} onClick={() => void save("draft")} variant="outline">Save draft</Button>
          <Button className="min-h-12 bg-[#1a6fb5] text-white" disabled={saving} onClick={() => void save("published")}>Publish</Button>
          <Button className="min-h-12 bg-emerald-700 text-white" disabled={saving} onClick={() => void save("live")}>Go live</Button>
          <Button className="min-h-12 bg-[#0a1a2f] text-white" disabled={saving} onClick={() => void save("completed")}>Complete</Button>
          <Button className="min-h-12 text-red-700" disabled={saving} onClick={() => void save("cancelled")} variant="outline">Cancel gathering</Button>
        </div>
        {saving && <p className="text-center text-sm text-[#4a6580]">Saving gathering…</p>}

        {series.kind === "sunday" && (
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle>Sunday sermon banner</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-[#4a6580]">The same sermon banner generator runs automatically after every Sunday save.</p>
              {generatingBanner && <p className="mt-4 text-sm text-[#4a6580]">Creating your sermon banner…</p>}
              {bannerError && <p className="mt-4 text-sm text-red-700">{bannerError}</p>}
              {banner && bannerMime && (
                <div className="mt-5 space-y-4">
                  <Image alt="Sermon banner" className="h-auto w-full rounded-xl" height={450} src={`data:${bannerMime};base64,${banner}`} unoptimized width={800} />
                  <Button className="min-h-11" onClick={downloadBanner} variant="outline"><Download className="size-4" /> Download banner</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
