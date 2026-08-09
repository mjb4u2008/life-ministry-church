"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
    <div className="bg-[#f3efe6]">
      <GatheringExperience mode="home" />

      <section className="bg-[#fffdf8] py-20 sm:py-24 lg:py-32" id="welcome">
        <div className="mx-auto grid max-w-screen-xl gap-12 px-5 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-20 lg:px-12">
          <div className="lg:sticky lg:top-28">
            <p className="life-kicker">First time with us?</p>
            <h2 className="mt-5 max-w-xl font-display text-4xl font-black leading-[1.02] text-[#071521] sm:text-5xl lg:text-6xl">
              You never have to walk in alone.
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-8 text-[#526675]">
              L.I.F.E. is an online church family. Join from home, bring your questions,
              and take things one step at a time. Pastor Mike can personally help you
              with the Google Meet link before your first gathering.
            </p>
            <Link
              className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full border border-[#071521]/20 px-6 py-3 font-bold text-[#071521] transition-colors hover:bg-[#071521] hover:text-white"
              href="/welcome"
            >
              What your first visit is like <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="rounded-[2rem] border border-[#071521]/10 bg-[#f3efe6] p-5 shadow-[0_24px_80px_rgba(7,21,33,0.08)] sm:p-8">
            <WelcomeForm compact />
          </div>
        </div>
      </section>

      <section className="border-y border-[#071521]/10 bg-[#f3efe6] py-20 sm:py-24" aria-labelledby="next-steps-heading">
        <div className="mx-auto max-w-screen-xl px-5 sm:px-6 lg:px-12">
          <div className="max-w-2xl">
            <p className="life-kicker">A simple next step</p>
            <h2 className="mt-4 font-display text-4xl font-black text-[#071521] sm:text-5xl" id="next-steps-heading">
              Start where you are.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {nextSteps.map((step, index) => (
              <Link
                className="group flex min-h-72 flex-col rounded-[1.75rem] border border-[#071521]/10 bg-[#fffdf8] p-7 text-[#071521] transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(7,21,33,0.1)] focus-visible:-translate-y-1 sm:p-8"
                href={step.href}
                key={step.title}
              >
                <div className="flex items-center justify-between">
                  <step.icon className="size-8 text-[#1677a8]" strokeWidth={1.8} />
                  <span className="text-sm font-bold tabular-nums text-[#526675]">0{index + 1}</span>
                </div>
                <p className="mt-10 text-xs font-extrabold uppercase tracking-[0.18em] text-[#1677a8]">
                  {step.eyebrow}
                </p>
                <h3 className="mt-3 font-display text-3xl font-black">{step.title}</h3>
                <p className="mt-4 flex-1 text-base leading-7 text-[#526675]">{step.description}</p>
                <span className="mt-7 inline-flex items-center gap-2 font-bold">
                  {step.label} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[#071521] py-20 text-white sm:py-28 lg:py-36" id="heart">
        <div className="mx-auto max-w-screen-xl px-5 sm:px-6 lg:px-12">
          <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-20">
            <div>
              <p className="life-kicker text-[#e4b75d]">The heart of the ministry</p>
              <h2 className="mt-5 max-w-4xl font-display text-5xl font-black leading-[0.95] sm:text-6xl lg:text-7xl">
                God is present in every season.
              </h2>
            </div>
            <p className="max-w-xl text-lg leading-8 text-white/70">
              L.I.F.E. Ministry is built on the promise of Emmanuel—God with us.
              We gather online to worship, learn Scripture, pray honestly, and remind
              one another that nobody is beyond the reach of God’s presence.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-2 border-l border-t border-white/15 md:grid-cols-4">
            {lifeWords.map(([letter, word]) => (
              <div className="border-b border-r border-white/15 p-5 sm:p-7 lg:p-9" key={letter}>
                <span className="font-display text-6xl font-black text-[#e4b75d] sm:text-7xl">{letter}</span>
                <p className="mt-3 text-sm font-extrabold uppercase tracking-[0.18em] text-white/75">{word}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <DailyScriptureSection />

      <section className="bg-[#fffdf8] py-20 sm:py-28" id="pastor">
        <div className="mx-auto grid max-w-screen-xl gap-12 px-5 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-20 lg:px-12">
          <div className="relative min-h-[430px] overflow-hidden rounded-[2rem] bg-[#071521]">
            <Image
              alt="An open Bible in a warm worship setting"
              className="object-cover object-[68%_center] opacity-70"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              src="/images/life-ministry-hero.jpg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071521] via-[#071521]/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-10">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#e4b75d]">A note from Pastor Mike</p>
              <blockquote className="mt-4 max-w-md font-display text-2xl font-bold leading-snug sm:text-3xl">
                “God is with you right now, right where you are.”
              </blockquote>
            </div>
          </div>

          <div>
            <p className="life-kicker">Meet the pastor</p>
            <h2 className="mt-5 font-display text-5xl font-black text-[#071521] sm:text-6xl">Pastor Mike</h2>
            <div className="mt-7 space-y-5 text-lg leading-8 text-[#526675]">
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
            <Link className="mt-8 inline-flex min-h-12 items-center gap-2 font-bold text-[#1677a8]" href="/welcome">
              Meet L.I.F.E. Ministry <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#f3efe6] py-20 sm:py-28" aria-labelledby="community-heading">
        <div className="mx-auto max-w-screen-xl px-5 sm:px-6 lg:px-12">
          <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="life-kicker">Real people. Real prayer.</p>
              <h2 className="mt-4 font-display text-4xl font-black text-[#071521] sm:text-5xl" id="community-heading">
                We carry life together.
              </h2>
            </div>
            <div className="flex rounded-full border border-[#071521]/15 bg-[#fffdf8] p-1.5" role="group" aria-label="Community stories">
              <button
                aria-pressed={activeTab === "prayers"}
                className={`min-h-11 rounded-full px-5 text-sm font-bold transition-colors ${activeTab === "prayers" ? "bg-[#071521] text-white" : "text-[#526675] hover:text-[#071521]"}`}
                onClick={() => setActiveTab("prayers")}
                type="button"
              >
                Prayer requests
              </button>
              <button
                aria-pressed={activeTab === "testimonies"}
                className={`min-h-11 rounded-full px-5 text-sm font-bold transition-colors ${activeTab === "testimonies" ? "bg-[#071521] text-white" : "text-[#526675] hover:text-[#071521]"}`}
                onClick={() => setActiveTab("testimonies")}
                type="button"
              >
                Testimonies
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {communityItems.length ? (
              communityItems.map((item) => (
                <article className="rounded-[1.5rem] border border-[#071521]/10 bg-[#fffdf8] p-7" key={item.id}>
                  <div className="flex size-11 items-center justify-center rounded-full bg-[#1677a8]/10 text-[#1677a8]">
                    <User className="size-5" />
                  </div>
                  <p className="mt-6 line-clamp-5 text-base leading-7 text-[#526675]">{item.text}</p>
                  <div className="mt-6 flex items-center justify-between border-t border-[#071521]/10 pt-5 text-sm">
                    <span className="font-bold text-[#071521]">{item.name}</span>
                    <span className="text-[#1677a8]">{item.count} {activeTab === "prayers" ? "praying" : "blessed"}</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-[#071521]/10 bg-[#fffdf8] p-8 text-lg text-[#526675] md:col-span-3">
                {activeTab === "prayers"
                  ? "No public prayer requests have been shared yet."
                  : "No testimonies have been published yet."}
              </div>
            )}
          </div>

          <Link className="mt-8 inline-flex min-h-12 items-center gap-2 font-bold text-[#1677a8]" href="/community">
            {activeTab === "prayers" ? "Ask for prayer" : "Share your testimony"}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="bg-[#071521] py-20 text-white sm:py-28" id="reminded">
        <div className="mx-auto grid max-w-screen-xl gap-12 px-5 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:gap-20 lg:px-12">
          <div>
            <MessageCircleHeart className="size-11 text-[#e4b75d]" strokeWidth={1.7} />
            <p className="life-kicker mt-8 text-[#e4b75d]">A gentle reminder</p>
            <h2 className="mt-5 max-w-2xl font-display text-5xl font-black leading-[0.98] sm:text-6xl">
              We’ll let you know before church begins.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/70">
              Choose email or text. We only use it for the reminders you request,
              and you can opt out at any time.
            </p>
          </div>
          <ReminderSignup />
        </div>
      </section>

      <section className="bg-[#e4b75d] py-14 text-[#071521]">
        <div className="mx-auto flex max-w-screen-xl flex-col gap-7 px-5 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-12">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em]">More ways to connect</p>
            <h2 className="mt-2 font-display text-3xl font-black sm:text-4xl">See what’s happening at L.I.F.E.</h2>
          </div>
          <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#071521] px-7 py-3 font-bold text-white" href="/events">
            View all events <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
