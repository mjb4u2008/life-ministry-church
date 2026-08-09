"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  HeartHandshake,
  MessageCircleHeart,
  Play,
  User,
} from "lucide-react";

import { DailyScriptureSection } from "@/components/DailyScripture";
import { GatheringExperience } from "@/components/gatherings";
import { ReminderSignup } from "@/components/ReminderSignup";
import { WelcomeForm } from "@/components/care";

interface CommunityPreview {
  id: string;
  name: string;
  text: string;
  count: number;
}

const nextSteps = [
  {
    icon: Play,
    eyebrow: "Messages",
    title: "Watch and grow",
    description: "Join the next gathering or catch up on a message when you have time.",
    href: "/watch",
    label: "Watch messages",
  },
  {
    icon: HeartHandshake,
    eyebrow: "Pastoral care",
    title: "You can ask for prayer",
    description: "Share a private need with Pastor Mike or pray with the wider community.",
    href: "/community",
    label: "Request prayer",
  },
  {
    icon: CalendarDays,
    eyebrow: "What’s happening",
    title: "Stay connected",
    description: "See upcoming gatherings and simple ways to be part of the ministry.",
    href: "/events",
    label: "See events",
  },
] as const;

const lifeWords = [
  ["L", "Lord"],
  ["I", "Is"],
  ["F", "Forever"],
  ["E", "Emmanuel"],
] as const;

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"prayers" | "testimonies">("prayers");
  const [previewPrayers, setPreviewPrayers] = useState<CommunityPreview[]>([]);
  const [previewTestimonies, setPreviewTestimonies] = useState<CommunityPreview[]>([]);

  useEffect(() => {
    fetch("/api/prayers")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.prayers?.length) {
          setPreviewPrayers(
            data.prayers.slice(0, 3).map(
              (prayer: {
                id: string;
                name: string;
                request: string;
                prayerCount: number;
              }) => ({
                id: prayer.id,
                name: prayer.name,
                text: prayer.request,
                count: prayer.prayerCount,
              }),
            ),
          );
        }
      })
      .catch(() => {});

    fetch("/api/testimonies")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.testimonies?.length) {
          setPreviewTestimonies(
            data.testimonies.slice(0, 3).map(
              (testimony: {
                id: string;
                name: string;
                text: string;
                blessedCount: number;
              }) => ({
                id: testimony.id,
                name: testimony.name,
                text: testimony.text,
                count: testimony.blessedCount,
              }),
            ),
          );
        }
      })
      .catch(() => {});
  }, []);

  const communityItems =
    activeTab === "prayers" ? previewPrayers : previewTestimonies;

  return (
    <div className="life-modernist bg-[var(--modernist-paper)]">
      <GatheringExperience mode="home" />

      <section className="border-b-2 life-modernist-rule py-14 sm:py-16 lg:py-20" id="welcome">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:gap-16 lg:px-12 xl:px-16">
          <div className="lg:sticky lg:top-28">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--modernist-blue)]">First time with us?</p>
            <h2 className="mt-4 max-w-xl text-4xl font-extrabold leading-[0.98] tracking-[-0.045em] text-[var(--modernist-ink)] sm:text-5xl lg:text-6xl">
              You never have to walk in alone.
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-8 text-[var(--modernist-ink)]/75">
              L.I.F.E. is an online church family. Join from home, bring your questions,
              and take things one step at a time. Pastor Mike can personally help you
              with the Google Meet link before your first gathering.
            </p>
            <Link
              className="mt-7 inline-flex min-h-13 items-center gap-2 border-2 border-[var(--modernist-ink)] px-5 py-3 font-bold text-[var(--modernist-ink)] transition-colors hover:bg-[var(--modernist-ink)] hover:text-white"
              href="/welcome"
            >
              What your first visit is like <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="border-2 life-modernist-rule bg-[var(--modernist-panel)] p-5 sm:p-8 lg:p-10">
            <WelcomeForm compact />
          </div>
        </div>
      </section>

      <section className="border-b-2 life-modernist-rule py-14 sm:py-16 lg:py-20" aria-labelledby="next-steps-heading">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8 lg:px-12 xl:px-16">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--modernist-blue)]">A simple next step</p>
            <h2 className="mt-3 text-4xl font-extrabold leading-none tracking-[-0.04em] text-[var(--modernist-ink)] sm:text-5xl" id="next-steps-heading">
              Start where you are.
            </h2>
          </div>
          <div className="mt-10 grid border-l-2 border-t-2 life-modernist-rule lg:grid-cols-3">
            {nextSteps.map((step) => (
              <Link
                className="group flex min-h-64 flex-col border-b-2 border-r-2 life-modernist-rule p-6 text-[var(--modernist-ink)] transition-colors hover:bg-white/55 focus-visible:bg-white/55 sm:p-8"
                href={step.href}
                key={step.title}
              >
                <step.icon className="size-8 text-[var(--modernist-blue)]" strokeWidth={1.8} />
                <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--modernist-blue)]">
                  {step.eyebrow}
                </p>
                <h3 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.035em]">{step.title}</h3>
                <p className="mt-4 flex-1 text-base leading-7 text-[var(--modernist-ink)]/70">{step.description}</p>
                <span className="mt-7 inline-flex items-center gap-2 font-bold">
                  {step.label} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[var(--modernist-blue)] py-14 text-white sm:py-16 lg:py-20" id="heart">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-16">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white">The heart of the ministry</p>
              <h2 className="mt-4 max-w-4xl text-5xl font-extrabold leading-[0.94] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
                God is present in every season.
              </h2>
            </div>
            <p className="max-w-xl text-lg leading-8 text-white">
              L.I.F.E. Ministry is built on the promise of Emmanuel—God with us.
              We gather online to worship, learn Scripture, pray honestly, and remind
              one another that nobody is beyond the reach of God’s presence.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 border-l-2 border-t-2 border-white/45 md:grid-cols-4">
            {lifeWords.map(([letter, word]) => (
              <div className="border-b-2 border-r-2 border-white/45 p-5 sm:p-7 lg:p-8" key={letter}>
                <span className="text-6xl font-extrabold text-white sm:text-7xl">{letter}</span>
                <p className="mt-2 text-sm font-extrabold uppercase tracking-[0.16em] text-white">{word}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <DailyScriptureSection />

      <section className="border-b-2 life-modernist-rule py-14 sm:py-16 lg:py-20" id="pastor">
        <div className="mx-auto grid max-w-[1200px] border-2 life-modernist-rule lg:grid-cols-2">
          <div className="relative flex min-h-[360px] overflow-hidden bg-[var(--modernist-ink)] p-7 text-white sm:min-h-[430px] sm:p-10 lg:p-12">
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-[11rem] font-extrabold leading-none text-white/[0.04] sm:text-[18rem]">PM</span>
            <div className="relative mt-auto border-l-4 border-[var(--modernist-blue)] pl-5 sm:pl-7">
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-white/70">A note from Pastor Mike</p>
              <blockquote className="mt-5 max-w-md text-3xl font-bold leading-snug sm:text-4xl">
                “God is with you right now, right where you are.”
              </blockquote>
            </div>
          </div>

          <div className="border-t-2 life-modernist-rule p-7 sm:p-10 lg:border-l-2 lg:border-t-0 lg:p-12">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--modernist-blue)]">Meet the pastor</p>
            <h2 className="mt-4 text-5xl font-extrabold tracking-[-0.045em] text-[var(--modernist-ink)] sm:text-6xl">Pastor Mike</h2>
            <div className="mt-6 space-y-5 text-lg leading-8 text-[var(--modernist-ink)]/72">
              <p>
                Pastor Mike created L.I.F.E. Ministry as a welcoming place where
                people can experience God’s presence together, wherever they live.
              </p>
              <p>
                His teaching is conversational, practical, and grounded in Scripture.
                You do not need to know church language or have everything figured out
                before you join.
              </p>
            </div>
            <Link className="mt-8 inline-flex min-h-12 items-center gap-2 font-bold text-[var(--modernist-blue)] underline-offset-4 hover:underline" href="/welcome">
              Meet L.I.F.E. Ministry <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b-2 life-modernist-rule py-14 sm:py-16 lg:py-20" aria-labelledby="community-heading">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8 lg:px-12 xl:px-16">
          <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--modernist-blue)]">Real people. Real prayer.</p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-[-0.04em] text-[var(--modernist-ink)] sm:text-5xl" id="community-heading">
                We carry life together.
              </h2>
            </div>
            <div className="flex border-2 life-modernist-rule bg-white/40 p-1" role="group" aria-label="Community stories">
              <button
                aria-pressed={activeTab === "prayers"}
                className={`min-h-12 px-5 text-sm font-bold transition-colors ${activeTab === "prayers" ? "bg-[var(--modernist-ink)] text-white" : "text-[var(--modernist-ink)]/65 hover:text-[var(--modernist-ink)]"}`}
                onClick={() => setActiveTab("prayers")}
                type="button"
              >
                Prayer requests
              </button>
              <button
                aria-pressed={activeTab === "testimonies"}
                className={`min-h-12 px-5 text-sm font-bold transition-colors ${activeTab === "testimonies" ? "bg-[var(--modernist-ink)] text-white" : "text-[var(--modernist-ink)]/65 hover:text-[var(--modernist-ink)]"}`}
                onClick={() => setActiveTab("testimonies")}
                type="button"
              >
                Testimonies
              </button>
            </div>
          </div>

          <div className="mt-10 grid border-l-2 border-t-2 life-modernist-rule md:grid-cols-3">
            {communityItems.length ? (
              communityItems.map((item) => (
                <article className="border-b-2 border-r-2 life-modernist-rule bg-white/30 p-7" key={item.id}>
                  <div className="flex size-11 items-center justify-center border-2 border-[var(--modernist-blue)] text-[var(--modernist-blue)]">
                    <User className="size-5" />
                  </div>
                  <p className="mt-6 line-clamp-5 text-base leading-7 text-[var(--modernist-ink)]/72">{item.text}</p>
                  <div className="mt-6 flex items-center justify-between border-t-2 life-modernist-rule pt-5 text-sm">
                    <span className="font-bold text-[var(--modernist-ink)]">{item.name}</span>
                    <span className="font-semibold text-[var(--modernist-blue)]">{item.count} {activeTab === "prayers" ? "praying" : "blessed"}</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="border-b-2 border-r-2 life-modernist-rule bg-white/30 p-8 text-lg text-[var(--modernist-ink)]/70 md:col-span-3">
                {activeTab === "prayers"
                  ? "No public prayer requests have been shared yet."
                  : "No testimonies have been published yet."}
              </div>
            )}
          </div>

          <Link className="mt-8 inline-flex min-h-12 items-center gap-2 font-bold text-[var(--modernist-blue)] underline-offset-4 hover:underline" href="/community">
            {activeTab === "prayers" ? "Ask for prayer" : "Share your testimony"}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="border-b-2 life-modernist-rule bg-[var(--modernist-panel)] py-14 sm:py-16 lg:py-20" id="reminded">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:gap-16 lg:px-12 xl:px-16">
          <div>
            <MessageCircleHeart className="size-11 text-[var(--modernist-blue)]" strokeWidth={1.7} />
            <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--modernist-blue)]">A gentle reminder</p>
            <h2 className="mt-4 max-w-2xl text-5xl font-extrabold leading-[0.96] tracking-[-0.05em] text-[var(--modernist-ink)] sm:text-6xl">
              We’ll let you know before church begins.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--modernist-ink)]/72">
              Choose email or text. We only use it for the reminders you request,
              and you can opt out at any time.
            </p>
          </div>
          <ReminderSignup />
        </div>
      </section>

      <section className="bg-[var(--modernist-paper)] py-12 text-[var(--modernist-ink)]">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-7 px-5 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12 xl:px-16">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--modernist-blue)]">More ways to connect</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">See what’s happening at L.I.F.E.</h2>
          </div>
          <Link className="inline-flex min-h-13 items-center justify-center gap-2 bg-[var(--modernist-blue)] px-7 py-3 font-bold text-white transition-colors hover:bg-[var(--modernist-deep-blue)]" href="/events">
            View all events <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
