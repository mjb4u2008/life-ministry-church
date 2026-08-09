"use client";

import { AlertCircle, CalendarDays, LoaderCircle } from "lucide-react";
import type {
  PublicGatheringOccurrence,
  PublicGatheringSeries,
} from "@/lib/gatherings";
import { GatheringCard } from "./GatheringCard";
import { GatheringHero } from "./GatheringHero";
import { useGatherings } from "./useGatherings";

function seriesFor(
  series: PublicGatheringSeries[],
  occurrence: PublicGatheringOccurrence,
) {
  return series.find((item) => item.id === occurrence.seriesId);
}

export function GatheringExperience({ mode }: { mode: "home" | "watch" }) {
  const { data, error, loading, retry } = useGatherings();

  if (loading && !data) {
    return (
      <section
        aria-live="polite"
        className="flex min-h-[420px] items-center justify-center bg-[#0a1a2f] px-5 py-20 text-white"
        id="next-gathering"
      >
        <div className="text-center font-body">
          <LoaderCircle className="mx-auto size-8 animate-spin text-[#77e5ff]" />
          <p className="mt-4">Loading gathering details…</p>
        </div>
      </section>
    );
  }

  if (error && !data) {
    return (
      <section
        className="flex min-h-[420px] items-center justify-center bg-[#0a1a2f] px-5 py-20 text-white"
        id="next-gathering"
      >
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto size-9 text-[#77e5ff]" />
          <h2 className="mt-5 font-display text-3xl font-bold">Schedule temporarily unavailable</h2>
          <p className="mt-3 font-body text-white/70">{error}</p>
          <button
            className="mt-6 min-h-12 rounded-xl border border-white/30 px-6 py-3 font-body font-bold hover:bg-white/10"
            onClick={retry}
            type="button"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (!data?.featured) {
    return (
      <section className="bg-[#0a1a2f] px-5 py-20 text-center text-white" id="next-gathering">
        <CalendarDays className="mx-auto size-10 text-[#77e5ff]" />
        <h2 className="mt-5 font-display text-3xl font-bold">No gathering is published yet</h2>
        <p className="mx-auto mt-3 max-w-lg font-body leading-relaxed text-white/70">
          We’re preparing the next gathering. Please check back soon for the time and joining details.
        </p>
      </section>
    );
  }

  const featured = data.featured;
  const otherUpcoming = data.upcoming.filter((item) => item.id !== featured.id).slice(0, 2);
  const recent = data.recent.filter((item) => item.id !== featured.id);
  const featuredIsReplay = featured.status === "completed" && Boolean(featured.replayUrl);

  return (
    <>
      <GatheringHero occurrence={featured} series={seriesFor(data.series, featured)} />

      {otherUpcoming.length > 0 && (
        <section className="bg-[#fafcff] py-16 sm:py-20">
          <div className="mx-auto max-w-screen-xl px-4 min-[360px]:px-5 sm:px-6 lg:px-12">
            <h2 className="font-display text-3xl font-black text-[#0a1a2f]">Also coming up</h2>
            <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2">
              {otherUpcoming.map((occurrence) => (
                <GatheringCard
                  key={occurrence.id}
                  occurrence={occurrence}
                  series={seriesFor(data.series, occurrence)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {mode === "watch" && (
        <section className="bg-[#f0f4f8] py-16 sm:py-24">
          <div className="mx-auto max-w-screen-xl px-4 min-[360px]:px-5 sm:px-6 lg:px-12">
            <h2 className="font-display text-3xl font-black text-[#0a1a2f] sm:text-4xl">
              Past messages
            </h2>
            <p className="mt-3 font-body text-[#4a6580]">Only published recordings appear here.</p>
            {recent.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                {recent.map((occurrence) => (
                  <GatheringCard
                    key={occurrence.id}
                    occurrence={occurrence}
                    series={seriesFor(data.series, occurrence)}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-[#dce8f2] bg-white p-7 font-body text-[#4a6580]">
                {featuredIsReplay
                  ? "No additional message recordings have been published yet."
                  : "No message recordings have been published yet."}
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
