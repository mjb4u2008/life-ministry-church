"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Download,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  MINISTRY_JOIN_WINDOW_MINUTES,
  MINISTRY_TIMEZONE,
  MINISTRY_TIMEZONE_LABEL,
  buildOccurrenceTimesFromLocalRange,
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
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    read("weekday"),
  );
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

function addMinutes(localTime: string, minutes: number) {
  const [hour, minute] = localTime.split(":").map(Number);
  const value = new Date(Date.UTC(2000, 0, 1, hour, minute + minutes));
  return `${String(value.getUTCHours()).padStart(2, "0")}:${String(
    value.getUTCMinutes(),
  ).padStart(2, "0")}`;
}

function localDateWeekday(localDate: string) {
  const [year, month, day] = localDate.split("-").map(Number);
  if (!year || !month || !day) return -1;
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function formatPreviewTime(
  instant: string,
  timezone = MINISTRY_TIMEZONE,
) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(instant));
}

function formatEndTime(instant: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: MINISTRY_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(instant));
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
  return store.occurrences
    .filter(
      (item) =>
        item.seriesId === seriesId &&
        item.status !== "cancelled" &&
        item.status !== "completed" &&
        Date.parse(item.endsAt) > now,
    )
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))[0];
}

function expectedDay(series: GatheringSeries): GatheringSchedule["dayOfWeek"] {
  if (series.kind === "sunday") return 0;
  if (series.kind === "wednesday") return 3;
  return series.schedule?.dayOfWeek ?? 0;
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

  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("20:30");
  const [meetUrl, setMeetUrl] = useState("");

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

  const populate = useCallback(
    (nextStore: GatheringStoreV1) => {
      const nextSeries = nextStore.series.find((item) => item.id === seriesId);
      if (!nextSeries) {
        setStore(nextStore);
        setError("This gathering series does not exist.");
        return;
      }

      const fallbackTime = nextSeries.kind === "sunday" ? "10:00" : "19:00";
      const schedule = nextSeries.schedule ?? {
        dayOfWeek: expectedDay(nextSeries),
        localTime: fallbackTime,
        timezone: MINISTRY_TIMEZONE,
        durationMinutes: 90,
      };
      const occurrence = currentOccurrence(nextStore, seriesId);
      const nextStartTime = occurrence
        ? localParts(new Date(occurrence.startsAt), MINISTRY_TIMEZONE).time
        : schedule.localTime;
      const nextEndTime = occurrence
        ? localParts(new Date(occurrence.endsAt), MINISTRY_TIMEZONE).time
        : addMinutes(nextStartTime, schedule.durationMinutes);

      setStore(nextStore);
      setStartTime(nextStartTime);
      setEndTime(nextEndTime);
      setMeetUrl(nextSeries.defaultMeetUrl);
      setOccurrenceId(occurrence?.id ?? null);
      setLocalDate(
        occurrence?.localDate ??
          nextScheduledLocalDate(
            expectedDay(nextSeries),
            nextStartTime,
            MINISTRY_TIMEZONE,
          ),
      );
      setTitle(occurrence?.title ?? "");
      setScripture(occurrence?.scripture ?? "");
      setDescription(occurrence?.description ?? "");
      setStatus(occurrence?.status ?? "draft");
      setReplayUrl(occurrence?.replayUrl ?? "");
      setBanner(null);
      setBannerMime(null);
      setBannerError("");
    },
    [seriesId],
  );

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
    if (!localDate || !startTime || !endTime) return null;
    try {
      return buildOccurrenceTimesFromLocalRange(
        localDate,
        startTime,
        endTime,
        MINISTRY_TIMEZONE,
      );
    } catch {
      return null;
    }
  }, [endTime, localDate, startTime]);

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
      if (response.status === 409) throw new Error("CONFLICT");
      throw new Error(
        Array.isArray(payload.issues)
          ? payload.issues.join(". ")
          : payload.error || "Save failed",
      );
    }
    return payload as GatheringStoreV1;
  };

  const generateBanner = async () => {
    if (!series || series.kind !== "sunday") return;
    if (!title.trim()) {
      setBannerError("Add the message title first.");
      return;
    }
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
      if (
        !response.ok ||
        typeof payload.image !== "string" ||
        typeof payload.mimeType !== "string"
      ) {
        throw new Error(payload.error || "Header generation failed.");
      }
      setBanner(payload.image);
      setBannerMime(payload.mimeType);
    } catch (generationError) {
      setBannerError(
        generationError instanceof Error
          ? generationError.message
          : "Header generation failed.",
      );
    } finally {
      setGeneratingBanner(false);
    }
  };

  const publish = async () => {
    if (!store || !series) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      if (!title.trim()) throw new Error("Add the message title.");
      if (!localDate || !previewTimes) {
        throw new Error("Choose a valid date, start time, and end time.");
      }
      const requiredDay = expectedDay(series);
      if (localDateWeekday(localDate) !== requiredDay) {
        const dayName = requiredDay === 0 ? "Sunday" : requiredDay === 3 ? "Wednesday" : "correct";
        throw new Error(`Choose a ${dayName} date for ${series.name}.`);
      }
      if (!meetUrl.trim()) throw new Error("Add the Google Meet link.");

      const durationMinutes = Math.round(
        (Date.parse(previewTimes.endsAt) - Date.parse(previewTimes.startsAt)) /
          60_000,
      );
      if (durationMinutes < 15 || durationMinutes > 480) {
        throw new Error("The gathering must be between 15 minutes and 8 hours.");
      }

      const now = new Date().toISOString();
      const nextSeries: GatheringSeries = {
        ...series,
        enabled: true,
        schedule: {
          dayOfWeek: requiredDay,
          localTime: startTime,
          timezone: MINISTRY_TIMEZONE,
          durationMinutes,
        },
        defaultMeetUrl: meetUrl.trim(),
        joinWindowMinutes: MINISTRY_JOIN_WINDOW_MINUTES,
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
        status: "published",
        title: title.trim(),
        scripture: scripture.trim(),
        description: description.trim(),
        updatedAt: now,
        publishedAt: existing?.publishedAt ?? now,
        ...(replayUrl.trim() ? { replayUrl: replayUrl.trim() } : {}),
      };
      const afterOccurrence = await put({
        operation: "upsert-occurrence",
        expectedRevision: afterSeries.revision,
        occurrence,
      });
      setStore(afterOccurrence);
      setOccurrenceId(occurrence.id);
      setStatus("published");
      setSuccess(
        `${nextSeries.name} is on the website. The Meet button will open automatically 30 minutes before it starts.`,
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error && saveError.message === "SESSION_EXPIRED"
          ? "Your session expired. Please sign in again."
          : saveError instanceof Error && saveError.message === "CONFLICT"
            ? "Someone else changed this gathering. Reload the latest version before saving again."
            : saveError instanceof Error
              ? saveError.message
              : "The gathering could not be published.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!store || !series || !occurrenceId) return;
    const confirmed = window.confirm(
      `Delete ${title.trim() ? `“${title.trim()}”` : "this gathering"} from the website?`,
    );
    if (!confirmed) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const nextStore = await put({
        operation: "delete-occurrence",
        expectedRevision: store.revision,
        occurrenceId,
      });
      populate(nextStore);
      setSuccess(`${series.name} was deleted from the website.`);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error && deleteError.message === "SESSION_EXPIRED"
          ? "Your session expired. Please sign in again."
          : deleteError instanceof Error && deleteError.message === "CONFLICT"
            ? "Someone else changed this gathering. Reload the latest version before deleting it."
            : deleteError instanceof Error
              ? deleteError.message
              : "The gathering could not be deleted.",
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
    link.download = "LIFE-Ministry-Sermon-Header." + extension;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8] pt-20">
        <LoaderCircle
          className="size-8 animate-spin text-[#1a6fb5]"
          aria-label="Loading editor"
        />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] px-4 pb-20 pt-28 text-center">
        <h1 className="font-display text-3xl font-bold text-[#0a1a2f]">
          Gathering not found
        </h1>
        <p className="mt-3 text-[#4a6580]">{error}</p>
        <Button className="mt-6" render={<Link href="/admin" />}>
          Back to admin
        </Button>
      </div>
    );
  }

  const isOnWebsite = status === "published" || status === "live";

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-24 pt-20">
      <header className="border-b border-[#dce8f2] bg-white">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:px-8">
          <Link
            className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#1a6fb5]"
            href="/admin"
          >
            <ArrowLeft className="size-4" /> This Week
          </Link>
          <h1 className="mt-2 font-display text-3xl font-bold text-[#0a1a2f] sm:text-4xl">
            Prepare {series.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#4a6580] sm:text-base">
            Add the message and time, generate the Sunday header if you want it,
            then put this gathering on the website.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            role="alert"
          >
            {error}
            {error.includes("Reload") && (
              <Button
                className="mt-3 min-h-11 w-full sm:w-auto"
                onClick={() => void load()}
                variant="outline"
              >
                <RefreshCw className="size-4" /> Reload latest
              </Button>
            )}
          </div>
        )}
        {success && (
          <div
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
            role="status"
          >
            {success}
          </div>
        )}

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Gathering details</CardTitle>
            <p className="text-sm text-[#4a6580]">
              All dates and times use {MINISTRY_TIMEZONE_LABEL}. The website
              automatically shows whichever published gathering comes next.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="text-sm font-bold">
                Date
                <Input
                  className="mt-2 h-12 px-4 text-base"
                  onChange={(event) => setLocalDate(event.target.value)}
                  type="date"
                  value={localDate}
                />
              </label>
              <label className="text-sm font-bold">
                Start time
                <Input
                  className="mt-2 h-12 px-4 text-base"
                  onChange={(event) => setStartTime(event.target.value)}
                  type="time"
                  value={startTime}
                />
              </label>
              <label className="text-sm font-bold">
                End time
                <Input
                  className="mt-2 h-12 px-4 text-base"
                  onChange={(event) => setEndTime(event.target.value)}
                  type="time"
                  value={endTime}
                />
              </label>
            </div>
            <label className="block text-sm font-bold">
              Message title
              <Input
                className="mt-2 h-12 px-4 text-base"
                maxLength={120}
                onChange={(event) => setTitle(event.target.value)}
                value={title}
              />
            </label>
            <label className="block text-sm font-bold">
              Scripture
              <Input
                className="mt-2 h-12 px-4 text-base"
                maxLength={100}
                onChange={(event) => setScripture(event.target.value)}
                placeholder="For example: James 1:5"
                value={scripture}
              />
            </label>
            <label className="block text-sm font-bold">
              Description
              <Textarea
                className="mt-2 min-h-32 px-4 py-3 text-base"
                maxLength={2000}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="A short invitation or summary of the message"
                value={description}
              />
            </label>

            {series.kind === "sunday" && (
              <div className="rounded-2xl border border-[#dce8f2] bg-[#f7fafc] p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-[#0a1a2f]">Sunday sermon header</p>
                    <p className="mt-1 text-sm text-[#4a6580]">
                      Uses the same image style Pastor Mike already knows.
                    </p>
                  </div>
                  <Button
                    className="min-h-12 w-full bg-[#0a1a2f] text-white sm:w-auto"
                    disabled={generatingBanner || !title.trim()}
                    onClick={() => void generateBanner()}
                  >
                    {generatingBanner ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                    {generatingBanner ? "Generating header…" : "Generate header"}
                  </Button>
                </div>
                {bannerError && (
                  <p className="mt-4 text-sm text-red-700">{bannerError}</p>
                )}
                {banner && bannerMime && (
                  <div className="mt-5 space-y-4">
                    <Image
                      alt="Generated sermon header"
                      className="h-auto w-full rounded-xl"
                      height={450}
                      src={`data:${bannerMime};base64,${banner}`}
                      unoptimized
                      width={800}
                    />
                    <Button
                      className="min-h-11 w-full sm:w-auto"
                      onClick={downloadBanner}
                      variant="outline"
                    >
                      <Download className="size-4" /> Download header
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <label className="block text-sm font-bold">
              Google Meet link
              <Input
                className="mt-2 h-12 px-4 text-base"
                onChange={(event) => setMeetUrl(event.target.value)}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                type="url"
                value={meetUrl}
              />
              <span className="mt-2 block font-normal leading-relaxed text-[#4a6580]">
                The Join button opens automatically 30 minutes before preaching
                starts. The link stays hidden before then.
              </span>
            </label>
            <label className="block text-sm font-bold">
              Replay URL <span className="font-normal text-[#4a6580]">(optional)</span>
              <Input
                className="mt-2 h-12 px-4 text-base"
                onChange={(event) => setReplayUrl(event.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                type="url"
                value={replayUrl}
              />
            </label>
          </CardContent>
        </Card>

        <Card className="border border-[#bfd5e5] shadow-sm">
          <CardHeader className="flex-row items-center justify-between gap-3">
            <CardTitle>Website preview</CardTitle>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                isOnWebsite
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-[#eef3f7] text-[#4a6580]"
              }`}
            >
              {isOnWebsite ? "On website" : "Not on website yet"}
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-bold uppercase tracking-widest text-[#1a6fb5]">
              {series.name}
            </p>
            <h2 className="mt-2 break-words font-display text-3xl font-bold text-[#0a1a2f]">
              {title || "Message title"}
            </h2>
            {scripture && (
              <p className="mt-2 font-semibold text-[#1a6fb5]">{scripture}</p>
            )}
            {description && (
              <p className="mt-4 whitespace-pre-wrap text-[#4a6580]">
                {description}
              </p>
            )}
            {previewTimes && (
              <p className="mt-4 text-sm text-[#4a6580]">
                {formatPreviewTime(previewTimes.startsAt)} to{" "}
                {formatEndTime(previewTimes.endsAt)}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <Button
            className="min-h-14 bg-[#1a6fb5] text-base font-bold text-white"
            disabled={saving}
            onClick={() => void publish()}
          >
            {saving ? "Working…" : "Put on website"}
          </Button>
          <Button
            className="min-h-14 text-red-700"
            disabled={saving || !occurrenceId}
            onClick={() => void remove()}
            variant="outline"
          >
            <Trash2 className="size-4" /> Delete this gathering
          </Button>
        </div>
      </main>
    </div>
  );
}
