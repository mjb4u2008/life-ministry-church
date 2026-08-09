"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  HeartHandshake,
  ImageIcon,
  LoaderCircle,
  MessageSquareText,
  PlaySquare,
} from "lucide-react";
import type {
  GatheringOccurrence,
  GatheringSeries,
  GatheringStoreV1,
} from "@/lib/gatherings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function currentOccurrence(
  store: GatheringStoreV1,
  seriesId: string,
): GatheringOccurrence | undefined {
  const now = Date.now();
  const occurrences = store.occurrences
    .filter(
      (item) =>
        item.seriesId === seriesId && item.status !== "cancelled",
    )
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  return occurrences.find((item) => Date.parse(item.endsAt) > now);
}

function readiness(series: GatheringSeries, occurrence?: GatheringOccurrence) {
  const checks = [
    series.enabled,
    Boolean(series.schedule),
    Boolean(series.defaultMeetUrl),
    Boolean(occurrence?.title.trim()),
    Boolean(occurrence?.scripture.trim()),
    Boolean(
      occurrence &&
        (occurrence.status === "published" || occurrence.status === "live"),
    ),
  ];
  return { ready: checks.filter(Boolean).length, total: checks.length };
}

function GatheringReadinessCard({
  series,
  occurrence,
}: {
  series: GatheringSeries;
  occurrence?: GatheringOccurrence;
}) {
  const progress = readiness(series, occurrence);
  const complete = progress.ready === progress.total;
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-body text-xs font-bold uppercase tracking-widest text-[#1a6fb5]">
              {series.kind === "wednesday" ? "Midweek" : "Weekend"}
            </p>
            <h2 className="mt-2 break-words font-display text-2xl font-bold text-[#0a1a2f]">
              {series.name}
            </h2>
          </div>
          {complete ? (
            <CheckCircle2 className="size-6 shrink-0 text-emerald-600" aria-label="Ready" />
          ) : (
            <CircleAlert className="size-6 shrink-0 text-amber-600" aria-label="Needs attention" />
          )}
        </div>
        <p className="mt-4 font-body text-sm text-[#4a6580]">
          {series.enabled ? `${progress.ready} of ${progress.total} ready` : "Disabled — configure when ready"}
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e6eef5]">
          <div
            className="h-full rounded-full bg-[#1a6fb5]"
            style={{ width: `${(progress.ready / progress.total) * 100}%` }}
          />
        </div>
        <div className="mt-5 rounded-xl bg-[#f7fafc] p-4 font-body text-sm text-[#4a6580]">
          {occurrence ? (
            <>
              <p className="font-semibold text-[#0a1a2f]">{occurrence.title || "Message title needed"}</p>
              <p className="mt-1 capitalize">{occurrence.status} · {occurrence.localDate}</p>
            </>
          ) : (
            <p>No gathering occurrence prepared yet.</p>
          )}
        </div>
        <Button
          className="mt-5 min-h-11 w-full bg-[#1a6fb5] font-body font-bold text-white hover:bg-[#155d99]"
          render={<Link href={`/admin/gatherings/${series.id}`} />}
        >
          {series.enabled ? "Prepare gathering" : "Set up gathering"}
          <ChevronRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

export function AdminDashboard({ token, logout }: { token: string; logout: () => void }) {
  const [store, setStore] = useState<GatheringStoreV1 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/gatherings?admin=1", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) {
        logout();
        return;
      }
      if (!response.ok) throw new Error("Unable to load gatherings");
      setStore(await response.json());
    } catch {
      setError("Gatherings could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [logout, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <div className="min-h-screen bg-[#f0f4f8] pb-20 pt-20">
      <header className="border-b border-[#dce8f2] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="font-body text-xs font-bold uppercase tracking-widest text-[#1a6fb5]">Ministry admin</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-[#0a1a2f]">This Week</h1>
          </div>
          <Button className="min-h-11" onClick={logout} variant="outline">Sign out</Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="max-w-2xl font-body text-[#4a6580]">
          Prepare Wednesday and Sunday, then use the focused tools below when you need them.
        </p>

        {loading ? (
          <div className="flex min-h-56 items-center justify-center">
            <LoaderCircle className="size-8 animate-spin text-[#1a6fb5]" aria-label="Loading gatherings" />
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            <p>{error}</p>
            <Button className="mt-4" onClick={() => void load()} variant="outline">Try again</Button>
          </div>
        ) : store ? (
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            {store.series
              .filter((series) => series.kind === "sunday" || series.kind === "wednesday")
              .sort((a, b) => (a.kind === "wednesday" ? -1 : b.kind === "wednesday" ? 1 : 0))
              .map((series) => (
                <GatheringReadinessCard
                  key={series.id}
                  occurrence={currentOccurrence(store, series.id)}
                  series={series}
                />
              ))}
          </div>
        ) : null}

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold text-[#0a1a2f]">Creative and communication tools</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/admin/legacy?tab=flyer", label: "Flyer generator", icon: ImageIcon },
              { href: "/admin/legacy?tab=daily-scripture", label: "Daily Scripture", icon: BookOpen },
              { href: "/admin/legacy?tab=messaging", label: "Messaging", icon: MessageSquareText },
              { href: "/admin/legacy?tab=past-lessons", label: "Messages & media", icon: PlaySquare },
            ].map((tool) => (
              <Link
                className="flex min-h-20 items-center gap-3 rounded-xl border border-[#dce8f2] bg-white p-4 font-body font-bold text-[#0a1a2f] shadow-sm hover:border-[#1a6fb5]"
                href={tool.href}
                key={tool.href}
              >
                <tool.icon className="size-5 shrink-0 text-[#1a6fb5]" />
                {tool.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold text-[#0a1a2f]">Coming next</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link className="rounded-xl border border-[#dce8f2] bg-white p-5 shadow-sm hover:border-[#1a6fb5]" href="/admin/care">
              <HeartHandshake className="size-6 text-[#1a6fb5]" />
              <h3 className="mt-3 font-display text-xl font-bold text-[#0a1a2f]">Pastoral care inbox</h3>
              <p className="mt-2 font-body text-sm text-[#4a6580]">Review private prayers and welcome first-time visitors.</p>
            </Link>
            <div className="rounded-xl border border-dashed border-[#b8ccdc] bg-white/60 p-5">
              <CalendarDays className="size-6 text-[#1a6fb5]" />
              <h3 className="mt-3 font-display text-xl font-bold text-[#0a1a2f]">Events center</h3>
              <p className="mt-2 font-body text-sm text-[#4a6580]">Create and publish real ministry events from one place.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
