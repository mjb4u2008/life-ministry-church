"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import {
  Heart,
  BookOpen,
  MessageCircle,
  Play,
  Clock,
  ArrowRight,
  Send,
  User,
  Mail,
  Share2,
  Calendar,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

/* ─────────────────────────────────────────────
   Countdown Hook
   ───────────────────────────────────────────── */
function useCountdown() {
  const getNext = () => {
    const now = new Date();
    const sunday = new Date(now);
    sunday.setHours(11, 30, 0, 0); // 11:30 AM EST = 8:30 AM PST
    const day = now.getDay();
    const daysUntil = day === 0 && now < sunday ? 0 : (7 - day) % 7 || 7;
    sunday.setDate(now.getDate() + daysUntil);
    return sunday;
  };

  const [target] = useState(getNext);
  const [diff, setDiff] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const ms = target.getTime() - Date.now();
      if (ms <= 0) {
        setDiff({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }
      const total = Math.floor(ms / 1000);
      setDiff({
        d: Math.floor(total / 86400),
        h: Math.floor((total % 86400) / 3600),
        m: Math.floor((total % 3600) / 60),
        s: total % 60,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return diff;
}

/* ─────────────────────────────────────────────
   Placeholder Data
   ───────────────────────────────────────────── */
const placeholderPrayers = [
  {
    id: "p1",
    name: "Sarah M.",
    text: "Please pray for my mother who is going through cancer treatment. We believe in God's healing power.",
    count: 24,
  },
  {
    id: "p2",
    name: "Anonymous",
    text: "Praying for guidance in a difficult career decision. I want to follow God's plan for my life.",
    count: 18,
  },
  {
    id: "p3",
    name: "David R.",
    text: "Pray for our family as we navigate a cross-country move. Trusting the Lord to open the right doors.",
    count: 31,
  },
];

const placeholderTestimonies = [
  {
    id: "t1",
    name: "Maria L.",
    text: "God answered my prayers! After months of searching, I found a job that aligns perfectly with my calling. He is faithful!",
    count: 42,
  },
  {
    id: "t2",
    name: "James K.",
    text: "I was healed from anxiety and depression through prayer and this community. God's presence is real and transformative.",
    count: 56,
  },
  {
    id: "t3",
    name: "Anonymous",
    text: "My marriage was restored after we started praying together. L.I.F.E. Ministry helped us find our way back to each other and to God.",
    count: 37,
  },
];

/* ─────────────────────────────────────────────
   Belief Data
   ───────────────────────────────────────────── */
const beliefs = [
  {
    title: "The Bible",
    description:
      "We believe the Bible is God's inspired Word and our guide for faith and life.",
  },
  {
    title: "God",
    description:
      "We believe in one God, eternally existing in three persons: Father, Son, and Holy Spirit.",
  },
  {
    title: "Jesus Christ",
    description:
      "We believe Jesus is fully God and fully man, born of a virgin, and that He died for our sins and rose again.",
  },
  {
    title: "Salvation",
    description:
      "We believe salvation is a gift of grace received through faith in Jesus Christ alone.",
  },
  {
    title: "The Church",
    description:
      "We believe the church is the body of Christ, called to worship, fellowship, and serve.",
  },
  {
    title: "Eternity",
    description:
      "We believe in the resurrection of the dead and eternal life with God for all who believe.",
  },
];

/* ─────────────────────────────────────────────
   Home Page
   ───────────────────────────────────────────── */
export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null);
  const countdown = useCountdown();
  const [activeTab, setActiveTab] = useState<"prayers" | "testimonies">(
    "prayers"
  );

  /* GSAP: One orchestrated hero entrance */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".hero-title", { opacity: 0, y: 80, duration: 1 })
        .from(".hero-subtitle", { opacity: 0, y: 40, duration: 0.8 }, "-=0.5")
        .from(
          ".hero-line",
          { scaleX: 0, duration: 1.2, transformOrigin: "left center" },
          "-=0.6"
        )
        .from(".hero-buttons", { opacity: 0, y: 30, duration: 0.8 }, "-=0.5");
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div>
      {/* ================================================
          SECTION 1: HERO
          ================================================ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col justify-center bg-[#fafcff] overflow-hidden"
      >
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16 w-full pt-32 md:pt-40 lg:pt-48 pb-24 md:pb-32">
          {/* MASSIVE "LIFE" */}
          <h1
            className="hero-title font-display uppercase leading-[0.85] tracking-tight mb-6 md:mb-8"
            style={{
              fontSize: "clamp(6rem, 20vw, 20rem)",
              fontWeight: 900,
              color: "#0a1a2f",
            }}
          >
            L.I.F.E.
          </h1>

          {/* Subtitle */}
          <p
            className="hero-subtitle font-body text-lg md:text-xl lg:text-2xl uppercase tracking-widest mb-6 md:mb-8"
            style={{ color: "#4a6580", fontWeight: 600 }}
          >
            Lord Is Forever Emmanuel
          </p>

          {/* Gradient line */}
          <div
            className="hero-line h-[3px] w-48 md:w-80 mb-10 md:mb-14"
            style={{
              background:
                "linear-gradient(90deg, #1a6fb5, #00d4ff, transparent)",
            }}
          />

          {/* Buttons */}
          <div className="hero-buttons flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="bg-[#1a6fb5] hover:bg-[#145a94] text-white font-body font-bold text-sm uppercase tracking-wider px-8 py-6 rounded-xl cursor-pointer"
              render={<Link href="/watch" />}
            >
              Join This Sunday
              <ArrowRight className="ml-2 size-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-[#1a6fb5] text-[#1a6fb5] hover:bg-[#1a6fb5] hover:text-white font-body font-bold text-sm uppercase tracking-wider px-8 py-6 rounded-xl cursor-pointer"
              render={<a href="#heart" />}
            >
              What is L.I.F.E.?
            </Button>
          </div>
        </div>
      </section>

      {/* ================================================
          SECTION 2: JOIN US LIVE
          ================================================ */}
      <section className="bg-[#0a1a2f] text-white py-24 md:py-32 lg:py-40">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* LEFT COLUMN */}
            <div className="flex flex-col gap-6">
              <Badge className="w-fit bg-[#00d4ff]/15 text-[#00d4ff] border-[#00d4ff]/30 font-body font-bold text-xs uppercase tracking-widest px-4 py-1 h-auto rounded-full">
                This Sunday
              </Badge>

              <h2
                className="font-display text-4xl md:text-5xl leading-[1.05]"
                style={{ fontWeight: 800 }}
              >
                Walking in the Spirit
              </h2>

              <p className="text-white/60 font-body text-base tracking-wide">
                Galatians 5:16-25
              </p>

              <p className="text-white/70 font-body text-base leading-relaxed max-w-lg">
                Discover what it means to live a life guided by the Spirit. Join
                us as we explore Paul&apos;s letter to the Galatians and uncover
                the fruit that grows when we walk in step with God.
              </p>

              <div className="flex items-center gap-3 text-white/50 font-body text-sm tracking-wide">
                <Clock className="size-4" />
                <span>Every Sunday &mdash; 8:30 AM PST / 11:30 AM EST</span>
              </div>

              <Button
                size="lg"
                className="w-fit bg-gradient-to-r from-[#1a6fb5] to-[#00b4d8] hover:from-[#145a94] hover:to-[#0096b7] text-white font-body font-bold text-sm uppercase tracking-wider px-8 py-6 rounded-xl mt-2 cursor-pointer"
                render={
                  <a
                    href="https://meet.google.com/hqk-sryh-ado"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                Join on Google Meet
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>

            {/* RIGHT COLUMN: Countdown */}
            <div className="flex flex-col items-center lg:items-end gap-6">
              <div className="grid grid-cols-4 gap-3 md:gap-4">
                {(
                  [
                    { val: countdown.d, label: "Days" },
                    { val: countdown.h, label: "Hours" },
                    { val: countdown.m, label: "Mins" },
                    { val: countdown.s, label: "Secs" },
                  ] as const
                ).map((unit) => (
                  <Card
                    key={unit.label}
                    className="bg-white/5 border-white/10 ring-0 text-center px-4 py-5 md:px-6 md:py-6 rounded-xl"
                  >
                    <CardContent className="p-0">
                      <div className="text-4xl md:text-5xl font-body font-black text-white tabular-nums">
                        {String(unit.val).padStart(2, "0")}
                      </div>
                      <div className="text-[11px] uppercase tracking-widest text-white/40 font-body font-semibold mt-2">
                        {unit.label}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-white/40 font-body text-sm uppercase tracking-widest">
                until next service
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================
          GET REMINDED BANNER
          ================================================ */}
      <section style={{ background: "linear-gradient(90deg, #1a6fb5, #00d4ff)" }} className="py-4">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white font-body font-semibold text-sm md:text-base tracking-wide">
            Never miss a Sunday — get reminded before each service
          </p>
          <a
            href="/watch#reminded"
            className="inline-flex items-center gap-2 bg-white text-[#1a6fb5] font-body font-bold text-xs uppercase tracking-[0.1em] px-5 py-2 rounded-full hover:bg-white/90 transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Get Reminded
          </a>
        </div>
      </section>

      {/* ================================================
          SECTION 3: HEART OF OUR MINISTRY
          ================================================ */}
      <section id="heart" className="bg-white py-24 md:py-32 lg:py-40">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16">
          {/* Centered header */}
          <div className="max-w-3xl mx-auto text-center mb-20">
            <Badge className="mb-6 bg-[#1a6fb5]/10 text-[#1a6fb5] border-[#1a6fb5]/20 font-body font-bold text-xs uppercase tracking-widest px-4 py-1 h-auto rounded-full">
              The Heart of Our Ministry
            </Badge>

            <h2
              className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight mb-8"
              style={{ fontWeight: 900, color: "#0a1a2f" }}
            >
              Lord Is Forever Emmanuel
            </h2>

            <div className="flex justify-center mb-8">
              <Separator className="w-24 bg-[#1a6fb5]" />
            </div>

            <p
              className="font-body text-lg leading-relaxed"
              style={{ color: "#4a6580" }}
            >
              L.I.F.E. Ministry is built on a beautiful truth that spans from
              ancient prophecy to present reality: God has always been, and will
              always be, with His people. The name itself is a statement of faith
              — each letter carrying the weight of a promise that God made and
              has never broken.
            </p>
          </div>

          {/* 4 L.I.F.E. Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-20">
            {(
              [
                {
                  letter: "L",
                  word: "Lord",
                  desc: "Our sovereign God, the foundation of everything we are and do.",
                },
                {
                  letter: "I",
                  word: "Is",
                  desc: "A declaration of truth. Not was, not will be — He IS, present and active.",
                },
                {
                  letter: "F",
                  word: "Forever",
                  desc: "His love endures through every season. Unchanging. Unending.",
                },
                {
                  letter: "E",
                  word: "Emmanuel",
                  desc: "God with us. In every moment, in every place, He is near.",
                },
              ] as const
            ).map((item) => (
              <Card
                key={item.letter}
                className="bg-white ring-1 ring-[#e0eaf3] rounded-xl hover:shadow-lg transition-shadow duration-300 py-0"
              >
                <CardContent className="p-6 md:p-8">
                  <div
                    className="text-5xl md:text-6xl font-display mb-3"
                    style={{ fontWeight: 900, color: "#1a6fb5" }}
                  >
                    {item.letter}
                  </div>
                  <div
                    className="font-body font-bold text-base mb-2"
                    style={{ color: "#0a1a2f" }}
                  >
                    {item.word}
                  </div>
                  <p className="text-sm text-muted-foreground font-body leading-relaxed">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Scripture Connection Block */}
          <div className="bg-[#f0f4f8] rounded-2xl p-8 md:p-14">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3
                  className="text-3xl md:text-4xl font-display mb-8 tracking-tight"
                  style={{ fontWeight: 900, color: "#0a1a2f" }}
                >
                  A Promise Fulfilled
                </h3>
                <div className="space-y-4 font-body leading-relaxed" style={{ color: "#4a6580" }}>
                  <p>
                    In{" "}
                    <strong className="text-[#0a1a2f] font-bold">
                      Isaiah 7:14
                    </strong>
                    , the prophet spoke of a coming sign:{" "}
                    <em>
                      &quot;The virgin will conceive and give birth to a son, and
                      will call him Immanuel.&quot;
                    </em>
                  </p>
                  <p>
                    Centuries later,{" "}
                    <strong className="text-[#0a1a2f] font-bold">
                      Matthew 1:23
                    </strong>{" "}
                    reveals the fulfillment of this prophecy in Jesus Christ —
                    Emmanuel, which means{" "}
                    <em>&quot;God with us.&quot;</em>
                  </p>
                  <p>
                    This is the foundation of L.I.F.E. Ministry: the eternal God
                    chose to dwell among us, and through Jesus, He continues to
                    be present with His people — including you, right where you
                    are.
                  </p>
                </div>
              </div>
              <Card className="bg-white ring-0 rounded-2xl shadow-sm py-0">
                <CardContent className="p-8">
                  <svg
                    className="w-12 h-12 text-[#1a6fb5] mb-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  <blockquote
                    className="font-display text-xl md:text-2xl leading-relaxed mb-4"
                    style={{ fontWeight: 800, color: "#0a1a2f" }}
                  >
                    &ldquo;And surely I am with you always, to the very end of
                    the age.&rdquo;
                  </blockquote>
                  <cite className="text-[#1a6fb5] font-body font-bold not-italic">
                    — Matthew 28:20
                  </cite>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================
          SECTION 4: WHAT WE BELIEVE
          ================================================ */}
      <section className="bg-[#f0f4f8] py-24 md:py-32 lg:py-40">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="text-center mb-6">
            <h2
              className="font-display text-3xl md:text-4xl lg:text-5xl uppercase tracking-wide"
              style={{ fontWeight: 900, color: "#0a1a2f" }}
            >
              What We Believe
            </h2>
          </div>

          <div className="flex justify-center mb-16 md:mb-20">
            <Separator className="w-24 bg-[#1a6fb5]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beliefs.map((belief, index) => (
              <Card
                key={belief.title}
                className="bg-white ring-1 ring-[#e0eaf3] rounded-xl hover:shadow-lg transition-shadow duration-300 py-0"
              >
                <CardContent className="p-8">
                  <span
                    className="text-5xl font-display leading-none"
                    style={{ fontWeight: 900, color: "#1a6fb5" }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3
                    className="font-display text-xl mt-4 mb-3"
                    style={{ fontWeight: 800, color: "#0a1a2f" }}
                  >
                    {belief.title}
                  </h3>
                  <p className="text-sm text-muted-foreground font-body leading-relaxed">
                    {belief.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================
          SECTION 5: PASTOR MIKE
          ================================================ */}
      <section className="bg-white py-24 md:py-32 lg:py-40">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Left: Bio */}
            <div>
              <Badge className="mb-6 bg-[#1a6fb5]/10 text-[#1a6fb5] border-[#1a6fb5]/20 font-body font-bold text-xs uppercase tracking-widest px-4 py-1 h-auto rounded-full">
                Meet the Pastor
              </Badge>

              <h2
                className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight mb-8"
                style={{ fontWeight: 900, color: "#0a1a2f" }}
              >
                Pastor Mike
              </h2>

              <div
                className="space-y-5 font-body leading-relaxed text-lg"
                style={{ color: "#4a6580" }}
              >
                <p>
                  Pastor Mike founded L.I.F.E. Ministry with a simple vision: to
                  create a welcoming space where people can experience
                  God&apos;s presence together, no matter where they are in the
                  world.
                </p>
                <p>
                  With a heart for teaching and a passion for authentic
                  connection, Pastor Mike brings Scripture to life in a way
                  that&apos;s accessible, practical, and filled with warmth. His
                  conversational style makes everyone feel like family.
                </p>
                <p>
                  Beyond Sunday services, you can find Pastor Mike sharing daily
                  encouragement on TikTok and Instagram, where he connects with
                  thousands through short, powerful messages of faith and hope.
                </p>
              </div>

              <blockquote className="mt-10 border-l-4 border-[#1a6fb5] pl-6">
                <p
                  className="font-display text-xl md:text-2xl leading-[1.3] italic"
                  style={{ fontWeight: 800, color: "#0a1a2f" }}
                >
                  &ldquo;God is with you right now, right where you are.
                  That&apos;s not just a nice thought — it&apos;s the truth that
                  changes everything.&rdquo;
                </p>
                <cite className="block mt-4 text-[#1a6fb5] font-body font-bold not-italic text-base">
                  — Pastor Mike
                </cite>
              </blockquote>
            </div>

            {/* Right: TikTok Placeholder */}
            <div className="bg-[#0a1a2f] rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
              <svg
                className="w-16 h-16 text-white/60 mb-6"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.17a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.6z" />
              </svg>
              <p className="text-white/40 font-body text-sm mb-4">
                TikTok Video Coming Soon
              </p>
              <a
                href="https://www.tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#00d4ff] font-body text-sm font-bold hover:text-white transition-colors"
              >
                Follow on TikTok
                <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================
          SECTION 6: LATEST MESSAGE
          ================================================ */}
      <section className="bg-[#f0f4f8] py-24 md:py-32 lg:py-40">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-[#1a6fb5]/10 text-[#1a6fb5] border-[#1a6fb5]/20 font-body font-bold text-xs uppercase tracking-widest px-4 py-1 h-auto rounded-full">
              Latest Message
            </Badge>

            <h2
              className="font-display text-3xl md:text-4xl lg:text-5xl mb-10 md:mb-14"
              style={{ fontWeight: 800, color: "#0a1a2f" }}
            >
              Walking in the Spirit
            </h2>

            {/* 16:9 Video placeholder */}
            <div className="relative w-full aspect-video bg-gradient-to-br from-[#c8dded] to-[#93b5d0] rounded-xl flex items-center justify-center overflow-hidden shadow-[0_12px_48px_rgba(26,111,181,0.12)] mb-10">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/90 rounded-full flex items-center justify-center shadow-xl cursor-pointer hover:bg-white transition-colors">
                  <Play
                    className="size-6 md:size-8 text-[#0a1a2f] ml-1"
                    fill="#0a1a2f"
                  />
                </div>
              </div>
              <span className="text-[#4a6580]/50 text-sm tracking-wide font-body">
                Sermon Video
              </span>
            </div>

            <Button
              size="lg"
              className="bg-[#1a6fb5] hover:bg-[#145a94] text-white font-body font-bold text-sm uppercase tracking-wider px-10 py-6 rounded-xl cursor-pointer"
              render={<Link href="/watch" />}
            >
              Watch Now
              <Play className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ================================================
          SECTION 7: WE ARE ALL MINISTERS
          ================================================ */}
      <section className="bg-[#0a1a2f] py-24 md:py-32 lg:py-40">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16">
          {/* Heading */}
          <div className="text-center mb-6">
            <h2
              className="font-display text-4xl md:text-5xl lg:text-6xl uppercase tracking-tight text-white"
              style={{ fontWeight: 900 }}
            >
              We Are All Ministers
            </h2>
          </div>
          <p className="text-white/60 font-body text-lg text-center max-w-2xl mx-auto mb-12">
            Share your faith. Lift each other up.
          </p>

          {/* Tab Toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-white/10 rounded-xl p-1.5">
              <button
                onClick={() => setActiveTab("prayers")}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-body font-bold text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeTab === "prayers"
                    ? "bg-white text-[#0a1a2f] shadow-lg"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <Heart className="size-4" />
                Prayer Requests
              </button>
              <button
                onClick={() => setActiveTab("testimonies")}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-body font-bold text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeTab === "testimonies"
                    ? "bg-white text-[#0a1a2f] shadow-lg"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <BookOpen className="size-4" />
                Testimonies
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {activeTab === "prayers"
              ? placeholderPrayers.map((prayer) => (
                  <Card
                    key={prayer.id}
                    className="bg-white ring-0 rounded-xl py-0"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[#f0f4f8] flex items-center justify-center">
                          <User className="size-4 text-[#1a6fb5]" />
                        </div>
                        <div>
                          <p
                            className="font-body font-bold text-sm"
                            style={{ color: "#0a1a2f" }}
                          >
                            {prayer.name}
                          </p>
                        </div>
                      </div>
                      <p
                        className="font-body text-sm leading-relaxed mb-4"
                        style={{ color: "#4a6580" }}
                      >
                        {prayer.text}
                      </p>
                      <div className="flex items-center gap-2 text-sm font-body">
                        <Heart className="size-3.5 text-[#1a6fb5]" />
                        <span className="font-bold text-[#1a6fb5]">
                          {prayer.count}
                        </span>
                        <span style={{ color: "#4a6580" }}>praying</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              : placeholderTestimonies.map((testimony) => (
                  <Card
                    key={testimony.id}
                    className="bg-white ring-0 rounded-xl py-0"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[#f0f4f8] flex items-center justify-center">
                          <User className="size-4 text-[#1a6fb5]" />
                        </div>
                        <div>
                          <p
                            className="font-body font-bold text-sm"
                            style={{ color: "#0a1a2f" }}
                          >
                            {testimony.name}
                          </p>
                        </div>
                      </div>
                      <p
                        className="font-body text-sm leading-relaxed mb-4"
                        style={{ color: "#4a6580" }}
                      >
                        {testimony.text}
                      </p>
                      <div className="flex items-center gap-2 text-sm font-body">
                        <BookOpen className="size-3.5 text-[#1a6fb5]" />
                        <span className="font-bold text-[#1a6fb5]">
                          {testimony.count}
                        </span>
                        <span style={{ color: "#4a6580" }}>blessed</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#1a6fb5] to-[#00b4d8] hover:from-[#145a94] hover:to-[#0096b7] text-white font-body font-bold text-sm uppercase tracking-wider px-10 py-6 rounded-xl cursor-pointer"
              render={<Link href="/community" />}
            >
              {activeTab === "prayers"
                ? "View All / Submit"
                : "View All / Share"}
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ================================================
          SECTION 8: EXPLORE
          ================================================ */}
      <section className="bg-[#fafcff] py-24 md:py-32 lg:py-40">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16">
          {/* Heading */}
          <div className="text-center mb-6">
            <h2
              className="font-display text-3xl md:text-4xl lg:text-5xl uppercase tracking-wide"
              style={{ fontWeight: 900, color: "#0a1a2f" }}
            >
              Explore
            </h2>
          </div>

          <div className="flex justify-center mb-16 md:mb-20">
            <Separator className="w-24 bg-[#1a6fb5]" />
          </div>

          {/* 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(
              [
                {
                  icon: Play,
                  title: "Watch Online",
                  desc: "Stream our latest sermons and Bible studies. Grow in your faith from anywhere in the world.",
                  href: "/watch",
                  label: "Watch Now",
                },
                {
                  icon: MessageCircle,
                  title: "Ask The Word",
                  desc: "Have a question about Scripture? Get thoughtful, biblically-grounded answers from our ministry.",
                  href: "/ask",
                  label: "Ask a Question",
                },
                {
                  icon: Heart,
                  title: "Give",
                  desc: "Support the mission of L.I.F.E. Ministry. Every gift helps us reach more people with the love of Christ.",
                  href: "/give",
                  label: "Give Now",
                },
              ] as const
            ).map((item) => (
              <Card
                key={item.title}
                className="bg-white ring-1 ring-[#e0eaf3] rounded-xl hover:shadow-lg transition-all duration-300 py-0"
              >
                <CardHeader className="p-6 md:p-8 pb-0 md:pb-0">
                  <div className="w-12 h-12 bg-[#1a6fb5]/10 rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="size-6 text-[#1a6fb5]" />
                  </div>
                  <h3
                    className="font-display text-xl md:text-2xl mb-2"
                    style={{ fontWeight: 800, color: "#0a1a2f" }}
                  >
                    {item.title}
                  </h3>
                </CardHeader>
                <CardContent className="p-6 md:p-8 pt-2 md:pt-2">
                  <p className="text-sm text-muted-foreground font-body leading-relaxed mb-6">
                    {item.desc}
                  </p>
                  <Button
                    variant="outline"
                    className="border-[#1a6fb5] text-[#1a6fb5] hover:bg-[#1a6fb5] hover:text-white font-body font-bold text-xs uppercase tracking-wider rounded-lg cursor-pointer"
                    render={<Link href={item.href} />}
                  >
                    {item.label}
                    <ArrowRight className="ml-2 size-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================
          UPCOMING EVENTS CTA
          ================================================ */}
      <section className="bg-[#0a1a2f] py-16 md:py-20">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          <Calendar className="size-10 text-[#00d4ff] mx-auto mb-6" />
          <h2
            className="font-display text-3xl md:text-4xl lg:text-5xl uppercase tracking-tight text-white mb-4"
            style={{ fontWeight: 900 }}
          >
            Upcoming Events
          </h2>
          <p className="text-white/60 font-body text-base md:text-lg max-w-xl mx-auto mb-8">
            See what&apos;s happening at L.I.F.E. Ministry
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-[#1a6fb5] to-[#00b4d8] hover:from-[#145a94] hover:to-[#0096b7] text-white font-body font-bold text-sm uppercase tracking-wider px-10 py-6 rounded-xl cursor-pointer"
            render={<Link href="/events" />}
          >
            View Events
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </div>
      </section>

      {/* ================================================
          SECTION 9: STAY CONNECTED
          ================================================ */}
      <section className="bg-[#0a1a2f] text-white py-24 md:py-32 lg:py-40">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white text-[#0a1a2f] ring-0 rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.25)] py-0">
              <CardContent className="p-8 md:p-12 lg:p-16">
                <h2
                  className="font-display text-3xl md:text-4xl lg:text-5xl mb-3 tracking-tight"
                  style={{ fontWeight: 900, color: "#0a1a2f" }}
                >
                  Stay Connected
                </h2>
                <p
                  className="font-body text-base mb-10"
                  style={{ color: "#4a6580" }}
                >
                  Get notified before each service. Stay in the loop with
                  L.I.F.E. Ministry.
                </p>

                <form
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-xs font-body font-bold uppercase tracking-widest"
                      style={{ color: "#4a6580" }}
                      htmlFor="firstName"
                    >
                      First Name
                    </label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Alex"
                      className="h-12 border-[#c8dded] focus-visible:border-[#1a6fb5] focus-visible:ring-[#1a6fb5]/20 rounded-lg font-body text-[#0a1a2f] px-4"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-xs font-body font-bold uppercase tracking-widest"
                      style={{ color: "#4a6580" }}
                      htmlFor="lastName"
                    >
                      Last Name
                    </label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Smith"
                      className="h-12 border-[#c8dded] focus-visible:border-[#1a6fb5] focus-visible:ring-[#1a6fb5]/20 rounded-lg font-body text-[#0a1a2f] px-4"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      className="text-xs font-body font-bold uppercase tracking-widest"
                      style={{ color: "#4a6580" }}
                      htmlFor="email"
                    >
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="alex@email.com"
                      className="h-12 border-[#c8dded] focus-visible:border-[#1a6fb5] focus-visible:ring-[#1a6fb5]/20 rounded-lg font-body text-[#0a1a2f] px-4"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-12 bg-[#1a6fb5] hover:bg-[#145a94] text-white font-body font-bold text-sm uppercase tracking-wider rounded-lg cursor-pointer"
                    >
                      Get Notified
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ================================================
          GET IN TOUCH
          ================================================ */}
      <section className="bg-[#f0f4f8] py-20 md:py-24">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2
              className="font-display text-3xl md:text-4xl tracking-tight mb-4"
              style={{ fontWeight: 900, color: "#0a1a2f" }}
            >
              Want to connect with Pastor Mike?
            </h2>
            <p className="font-body text-base" style={{ color: "#4a6580" }}>
              We&apos;d love to hear from you. Reach out anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Email Card */}
            <Card className="bg-white ring-1 ring-[#e0eaf3] rounded-xl py-0">
              <CardContent className="p-6 md:p-8 text-center">
                <div className="w-12 h-12 bg-[#1a6fb5]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="size-6 text-[#1a6fb5]" />
                </div>
                <h3
                  className="font-display text-lg mb-2"
                  style={{ fontWeight: 800, color: "#0a1a2f" }}
                >
                  Email Us
                </h3>
                <p className="font-body text-sm mb-4" style={{ color: "#4a6580" }}>
                  ministry@lifeministy.org
                </p>
                <Button
                  variant="outline"
                  className="border-[#1a6fb5] text-[#1a6fb5] hover:bg-[#1a6fb5] hover:text-white font-body font-bold text-xs uppercase tracking-wider rounded-lg cursor-pointer"
                  render={<a href="mailto:ministry@lifeministy.org" />}
                >
                  Send Email
                  <ArrowRight className="ml-2 size-3" />
                </Button>
              </CardContent>
            </Card>

            {/* Follow Card */}
            <Card className="bg-white ring-1 ring-[#e0eaf3] rounded-xl py-0">
              <CardContent className="p-6 md:p-8 text-center">
                <div className="w-12 h-12 bg-[#1a6fb5]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Share2 className="size-6 text-[#1a6fb5]" />
                </div>
                <h3
                  className="font-display text-lg mb-2"
                  style={{ fontWeight: 800, color: "#0a1a2f" }}
                >
                  Follow Us
                </h3>
                <p className="font-body text-sm mb-4" style={{ color: "#4a6580" }}>
                  Stay inspired daily on social media
                </p>
                <div className="flex items-center justify-center gap-3">
                  <a
                    href="#"
                    className="inline-flex items-center gap-1.5 text-[#1a6fb5] font-body text-xs font-bold uppercase tracking-wider hover:text-[#145a94] transition-colors"
                  >
                    TikTok
                  </a>
                  <span className="text-[#c8dded]">|</span>
                  <a
                    href="#"
                    className="inline-flex items-center gap-1.5 text-[#1a6fb5] font-body text-xs font-bold uppercase tracking-wider hover:text-[#145a94] transition-colors"
                  >
                    Instagram
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ================================================
          FOOTER SPACER
          ================================================ */}
      <section className="bg-[#fafcff] py-16 md:py-20">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          <p
            className="font-body text-sm uppercase tracking-[0.2em]"
            style={{ color: "#4a6580" }}
          >
            Lord Is Forever Emmanuel
          </p>
        </div>
      </section>
    </div>
  );
}
