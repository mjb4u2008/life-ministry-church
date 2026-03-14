"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { Heart, BookOpen, MessageCircle, Play, Clock, ArrowRight } from "lucide-react";

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
   Home Page
   ───────────────────────────────────────────── */
export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null);
  const countdown = useCountdown();

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
            LIFE
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
              background: "linear-gradient(90deg, #1a6fb5, #00d4ff, transparent)",
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
              render={<Link href="/about" />}
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
                Discover what it means to live a life guided by the Spirit. Join us as
                we explore Paul&apos;s letter to the Galatians and uncover the fruit
                that grows when we walk in step with God.
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
                    href="https://meet.google.com"
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
                {([
                  { val: countdown.d, label: "Days" },
                  { val: countdown.h, label: "Hours" },
                  { val: countdown.m, label: "Mins" },
                  { val: countdown.s, label: "Secs" },
                ] as const).map((unit) => (
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
          SECTION 3: WHAT IS L.I.F.E.?
          ================================================ */}
      <section className="bg-[#fafcff] py-24 md:py-32 lg:py-40">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16">
          {/* Heading */}
          <div className="text-center mb-6">
            <h2
              className="font-display text-2xl md:text-3xl lg:text-4xl uppercase tracking-widest"
              style={{ fontWeight: 800, color: "#0a1a2f" }}
            >
              Lord Is Forever Emmanuel
            </h2>
          </div>

          <div className="flex justify-center mb-16 md:mb-20">
            <Separator className="w-24 bg-[#1a6fb5]" />
          </div>

          {/* 4 Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {([
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
            ] as const).map((item) => (
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
        </div>
      </section>

      {/* ================================================
          SECTION 4: LATEST MESSAGE
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
          SECTION 5: EXPLORE
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
            {([
              {
                icon: Heart,
                title: "Prayer Wall",
                desc: "Share your prayer requests and let our community lift you up. Every request is seen, every prayer is heard.",
                href: "/connect",
                label: "Submit a Prayer",
              },
              {
                icon: BookOpen,
                title: "Testimonies",
                desc: "Read powerful stories of God's faithfulness in the lives of our community members.",
                href: "/testimonies",
                label: "Read Stories",
              },
              {
                icon: MessageCircle,
                title: "Ask The Word",
                desc: "Have a question about Scripture? Get thoughtful, biblically-grounded answers from our ministry.",
                href: "/ask",
                label: "Ask a Question",
              },
            ] as const).map((item) => (
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
          SECTION 6: STAY CONNECTED
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
                  Get notified before each service. Stay in the loop with L.I.F.E.
                  Ministry.
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
