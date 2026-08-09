"use client";

import Image from "next/image";
import Link from "next/link";
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
        className={`life-modernist border-b-2 border-[#201e1d]/35 bg-[#f3f2f2] text-[#201e1d] ${mode === "home" ? "pt-[4.5rem] md:pt-20" : "pt-20"}`}
        id="next-gathering"
      >
        <div className="mx-auto grid max-w-[1200px] gap-9 px-5 py-10 sm:px-8 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-[clamp(2rem,5vw,4.5rem)] lg:py-24">
          <div className="max-w-xl">
            {mode === "home" && <h1 className="font-display text-[clamp(2.5rem,5.6vw,4.875rem)] font-black leading-[0.98] tracking-[-0.035em]">Come as you are.<br />Worship from anywhere.</h1>}
            <div className={mode === "home" ? "mt-8" : ""}>
              <LoaderCircle className="size-8 animate-spin text-[#1677a8]" />
              <p className="mt-4 text-lg font-extrabold">Loading the next gathering…</p>
              <p className="mt-3 text-[1.05rem] leading-7 text-[#201e1d]/68">
                L.I.F.E. meets online every Wednesday and Sunday. If this is taking a while,
                Pastor Mike can help you join.
              </p>
              <a className="mt-5 inline-flex min-h-12 items-center border-2 border-[#201e1d]/35 px-6 py-3 font-extrabold hover:bg-[#201e1d] hover:text-white" href="/welcome">
                Get help joining
              </a>
            </div>
          </div>
          <figure className="relative aspect-[16/10] overflow-hidden border-2 border-[#201e1d]/40 bg-[#eae9e9]">
            <Image alt="" aria-hidden="true" className="object-cover object-[67%_center] grayscale contrast-[1.08]" fill priority={mode === "home"} sizes="(min-width: 1024px) 50vw, 100vw" src="/images/life-ministry-hero.jpg" />
            <figcaption className="absolute bottom-0 left-0 bg-[#1677a8] px-4 py-3 text-xs font-extrabold uppercase tracking-[0.11em] text-white">Finding the next service</figcaption>
          </figure>
        </div>
      </section>
    );
  }

  if (error && !data) {
    return (
      <section
        className={`life-modernist border-b-2 border-[#201e1d]/35 bg-[#f3f2f2] text-[#201e1d] ${mode === "home" ? "pt-[4.5rem] md:pt-20" : "pt-20"}`}
        id="next-gathering"
        role="alert"
      >
        <div className="mx-auto grid max-w-[1200px] gap-9 px-5 py-10 sm:px-8 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-[clamp(2rem,5vw,4.5rem)] lg:py-24">
          <div className="max-w-xl">
            {mode === "home" && <h1 className="font-display text-[clamp(2.5rem,5.6vw,4.875rem)] font-black leading-[0.98] tracking-[-0.035em]">Come as you are.<br />Worship from anywhere.</h1>}
            <div className={mode === "home" ? "mt-8" : ""}>
              <AlertCircle className="size-9 text-[#1677a8]" />
              <h2 className="mt-5 font-display text-3xl font-black">Schedule temporarily unavailable</h2>
              <p className="mt-3 font-body text-[#201e1d]/70">{error}</p>
              <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row">
            <button
              className="min-h-12 border-2 border-[#1677a8] bg-[#1677a8] px-6 py-3 font-body font-extrabold text-white hover:bg-[#0b5e8e]"
              onClick={retry}
              type="button"
            >
              Try again
            </button>
            <Link
              className="inline-flex min-h-12 items-center border-2 border-[#201e1d]/35 px-6 py-3 font-body font-extrabold hover:bg-[#201e1d] hover:text-white"
              href="/welcome"
            >
              Get help joining
            </Link>
              </div>
            </div>
          </div>
          <figure className="relative aspect-[16/10] overflow-hidden border-2 border-[#201e1d]/40 bg-[#eae9e9]">
            <Image alt="" aria-hidden="true" className="object-cover object-[67%_center] grayscale contrast-[1.08]" fill priority={mode === "home"} sizes="(min-width: 1024px) 50vw, 100vw" src="/images/life-ministry-hero.jpg" />
            <figcaption className="absolute bottom-0 left-0 bg-[#1677a8] px-4 py-3 text-xs font-extrabold uppercase tracking-[0.11em] text-white">Help is available</figcaption>
          </figure>
        </div>
      </section>
    );
  }

  if (!data?.featured) {
    return (
      <section className={`life-modernist border-b-2 border-[#201e1d]/35 bg-[#f3f2f2] text-[#201e1d] ${mode === "home" ? "pt-[4.5rem] md:pt-20" : "pt-20"}`} id="next-gathering">
        <div className="mx-auto grid max-w-[1200px] gap-9 px-5 py-10 sm:px-8 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-[clamp(2rem,5vw,4.5rem)] lg:py-24">
          <div className="min-w-0">
            {mode === "home" && <h1 className="max-w-[12ch] font-display text-[clamp(2.5rem,5.6vw,4.875rem)] font-black leading-[0.98] tracking-[-0.035em]">Come as you are.<br />Worship from anywhere.</h1>}
          <div className={`${mode === "home" ? "mt-8" : ""} max-w-xl border-2 border-[#201e1d]/35 bg-[#e9eef2] p-6`}>
            <CalendarDays className="size-8 text-[#1677a8]" />
            <h2 className="mt-4 font-display text-2xl font-black">The next gathering is being prepared</h2>
            <p className="mt-3 font-body leading-relaxed text-[#201e1d]/70">
              Please check back soon for the Wednesday or Sunday time and joining details.
            </p>
          </div>
          </div>
          <figure className="relative aspect-[16/10] overflow-hidden border-2 border-[#201e1d]/40 bg-[#eae9e9]">
            <Image alt="An open Bible in a worship setting" className="object-cover object-[67%_center] grayscale contrast-[1.08]" fill priority={mode === "home"} sizes="(min-width: 1024px) 50vw, 100vw" src="/images/life-ministry-hero.jpg" />
            <figcaption className="absolute inset-x-0 bottom-0 bg-[#1677a8] px-4 py-3 text-xs font-extrabold uppercase tracking-[0.11em] text-white sm:inset-x-auto sm:left-0">Schedule coming soon</figcaption>
          </figure>
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
