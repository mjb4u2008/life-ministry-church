"use client";

import Image from "next/image";
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
        className={`relative isolate flex items-center justify-center overflow-hidden bg-[#071521] px-5 text-white ${mode === "home" ? "min-h-screen pt-20" : "min-h-[540px] pt-20"}`}
        id="next-gathering"
      >
        <Image alt="" aria-hidden="true" className="-z-20 object-cover object-[67%_center] opacity-45" fill priority={mode === "home"} sizes="100vw" src="/images/life-ministry-hero.jpg" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,21,33,0.96),rgba(7,21,33,0.55))]" />
        <div className="max-w-xl text-center font-body">
          {mode === "home" && <h1 className="mb-7 font-display text-5xl font-black">God is with you.</h1>}
          <LoaderCircle className="mx-auto size-8 animate-spin text-[#e4b75d]" />
          <p className="mt-4 text-lg font-bold">Loading the next gathering…</p>
          <p className="mt-3 leading-7 text-white/68">
            L.I.F.E. meets online every Wednesday and Sunday. If this is taking a while,
            Pastor Mike can help you join.
          </p>
          <a className="mt-5 inline-flex min-h-12 items-center rounded-full border border-white/30 px-6 py-3 font-bold hover:bg-white/10" href="/welcome">
            Get help joining
          </a>
        </div>
      </section>
    );
  }

  if (error && !data) {
    return (
      <section
        className={`relative isolate flex items-center justify-center overflow-hidden bg-[#071521] px-5 text-white ${mode === "home" ? "min-h-screen pt-20" : "min-h-[540px] pt-20"}`}
        id="next-gathering"
      >
        <Image alt="" aria-hidden="true" className="-z-20 object-cover object-[67%_center] opacity-45" fill priority={mode === "home"} sizes="100vw" src="/images/life-ministry-hero.jpg" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,21,33,0.96),rgba(7,21,33,0.55))]" />
        <div className="max-w-md text-center">
          {mode === "home" && <h1 className="mb-7 font-display text-5xl font-black">God is with you.</h1>}
          <AlertCircle className="mx-auto size-9 text-[#e4b75d]" />
          <h2 className="mt-5 font-display text-3xl font-bold">Schedule temporarily unavailable</h2>
          <p className="mt-3 font-body text-white/70">{error}</p>
          <button
            className="mt-6 min-h-12 rounded-full border border-white/30 px-6 py-3 font-body font-bold hover:bg-white/10"
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
      <section className={`relative isolate overflow-hidden bg-[#071521] px-5 text-white ${mode === "home" ? "flex min-h-screen flex-col justify-end pb-16 pt-32 sm:pb-24" : "py-24 pt-40"}`} id="next-gathering">
        <Image alt="An open Bible in a warm worship setting" className="-z-20 object-cover object-[67%_center]" fill priority={mode === "home"} sizes="100vw" src="/images/life-ministry-hero.jpg" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,21,33,0.98)_0%,rgba(7,21,33,0.82)_42%,rgba(7,21,33,0.2)_100%)]" />
        <div className="mx-auto w-full max-w-screen-xl lg:px-7">
          {mode === "home" && <h1 className="max-w-3xl font-display text-5xl font-black leading-[0.94] sm:text-7xl lg:text-8xl">God is with you, right where you are.</h1>}
          <div className="mt-8 max-w-xl rounded-[1.5rem] border border-white/18 bg-[#071521]/75 p-6 backdrop-blur-sm">
            <CalendarDays className="size-8 text-[#e4b75d]" />
            <h2 className="mt-4 font-display text-2xl font-bold">The next gathering is being prepared</h2>
            <p className="mt-3 font-body leading-relaxed text-white/70">
              Please check back soon for the Wednesday or Sunday time and joining details.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const featured = data.featured;
  const otherUpcoming = data.upcoming.filter((item) => item.id !== featured.id).slice(0, 2);
  const recent = data.recent.filter((item) => item.id !== featured.id);
  const featuredIsReplay = featured.status === "completed" && Boolean(featured.replayUrl);

  return (
    <>
      <GatheringHero mode={mode} occurrence={featured} series={seriesFor(data.series, featured)} />

      {otherUpcoming.length > 0 && (
        <section className="bg-[#f3efe6] py-16 sm:py-20">
          <div className="mx-auto max-w-screen-xl px-4 min-[360px]:px-5 sm:px-6 lg:px-12">
            <h2 className="font-display text-3xl font-black text-[#071521]">Also coming up</h2>
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
