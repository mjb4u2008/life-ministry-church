"use client";

import { useState, useEffect } from "react";
import { ServiceCountdown } from "@/components/ServiceCountdown";
import { ReminderSignup } from "@/components/ReminderSignup";

interface WeeklyMessage {
  title: string;
  scripture: string;
  description: string;
}

interface ContentData {
  weeklyMessage: WeeklyMessage;
  meetLink?: string;
}

const pastServices = [
  {
    id: 1,
    title: "Finding Rest in Restless Times",
    date: "January 5, 2026",
    duration: "45 min",
    scripture: "Matthew 11:28-30",
  },
  {
    id: 2,
    title: "Walking in Faith, Not Fear",
    date: "December 29, 2025",
    duration: "52 min",
    scripture: "Isaiah 41:10",
  },
  {
    id: 3,
    title: "The Gift of Presence",
    date: "December 22, 2025",
    duration: "48 min",
    scripture: "Matthew 1:23",
  },
  {
    id: 4,
    title: "Gratitude in All Seasons",
    date: "December 15, 2025",
    duration: "41 min",
    scripture: "1 Thessalonians 5:18",
  },
];

export default function WatchPage() {
  const [content, setContent] = useState<ContentData | null>(null);

  useEffect(() => {
    async function fetchContent() {
      try {
        const res = await fetch("/api/content");
        if (res.ok) {
          const data = await res.json();
          setContent(data);
        }
      } catch (error) {
        console.error("Failed to fetch content:", error);
      }
    }
    fetchContent();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#fafcff" }}>
      {/* ========== Section 1: Hero ========== */}
      <section
        className="relative pt-32 pb-20 md:pt-40 md:pb-32"
        style={{
          background: "linear-gradient(180deg, #fafcff 0%, #f0f4f8 100%)",
        }}
      >
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          {/* Overline */}
          <p
            className="font-body font-semibold text-sm uppercase tracking-[0.15em] mb-6"
            style={{ color: "#4a6580" }}
          >
            Interactive Worship &amp; Fellowship
          </p>

          {/* MASSIVE Heading */}
          <h1
            className="font-display uppercase tracking-tight leading-[0.9] mb-8"
            style={{
              fontSize: "clamp(3.5rem, 12vw, 10rem)",
              fontWeight: 900,
              color: "#0a1a2f",
            }}
          >
            Join Us
            <br />
            This Sunday
          </h1>

          {/* Gradient accent line */}
          <div
            className="mx-auto h-[3px] w-32 md:w-64 mb-8"
            style={{
              background:
                "linear-gradient(90deg, transparent, #1a6fb5, #00d4ff, transparent)",
            }}
          />

          {/* Subtitle */}
          <p
            className="font-body text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
            style={{ color: "#4a6580" }}
          >
            Connect face-to-face with our community from wherever you are.
            Every Sunday at 10:00 AM Eastern.
          </p>

          {/* Google Meet Button — PROMINENT */}
          <div className="mb-14">
            <a
              href={content?.meetLink || "https://meet.google.com/hqk-sryh-ado"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-center px-12 py-5 text-white font-body font-bold text-lg uppercase tracking-[0.08em] rounded-xl hover:opacity-90 transition-all shadow-[0_8px_30px_rgba(26,111,181,0.3)]"
              style={{ background: "#1a6fb5" }}
            >
              Join on Google Meet
            </a>
          </div>

          {/* Countdown */}
          <ServiceCountdown />
        </div>
      </section>

      {/* ========== Section 2: This Week's Message ========== */}
      <section
        className="py-32 md:py-40"
        style={{ background: "#f0f4f8" }}
      >
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="text-center mb-12">
            <p
              className="font-body font-semibold text-sm uppercase tracking-[0.15em] mb-4"
              style={{ color: "#1a6fb5" }}
            >
              This Week&apos;s Message
            </p>
            <h2
              className="font-display uppercase tracking-tight mb-6"
              style={{
                fontSize: "clamp(2.5rem, 6vw, 5rem)",
                fontWeight: 900,
                color: "#0a1a2f",
              }}
            >
              {content?.weeklyMessage?.title || "Sunday Service"}
            </h2>
            {content?.weeklyMessage?.scripture && (
              <p
                className="font-body font-bold text-lg flex items-center justify-center gap-2 mb-6 uppercase tracking-wide"
                style={{ color: "#1a6fb5" }}
              >
                <svg
                  className="w-5 h-5"
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
                {content.weeklyMessage.scripture}
              </p>
            )}
            <p
              className="font-body text-lg max-w-2xl mx-auto leading-relaxed"
              style={{ color: "#4a6580" }}
            >
              {content?.weeklyMessage?.description ||
                "Join us for worship, fellowship, and an encouraging word from Scripture."}
            </p>
          </div>

          {/* This Week's Message — Rich Content Card (admin-editable) */}
          <div className="max-w-3xl mx-auto">
            <div
              className="rounded-2xl p-8 md:p-12 shadow-[0_8px_40px_rgba(26,111,181,0.08)]"
              style={{ background: "#ffffff", border: "1px solid #e8edf2" }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-12 rounded-full" style={{ background: "linear-gradient(180deg, #1a6fb5, #00d4ff)" }} />
                <div>
                  <p className="font-body font-bold text-xs uppercase tracking-[0.12em]" style={{ color: "#1a6fb5" }}>
                    From Pastor Mike
                  </p>
                  <p className="font-body text-sm" style={{ color: "#4a6580" }}>
                    What to expect this Sunday
                  </p>
                </div>
              </div>
              <p className="font-body text-base md:text-lg leading-relaxed" style={{ color: "#0a1a2f" }}>
                {content?.weeklyMessage?.description ||
                  "This Sunday we'll be diving deep into God's Word together. Join us for a time of worship, teaching, and fellowship. Come as you are — there's a place for you here. We can't wait to see you!"}
              </p>
              <div className="mt-8 pt-6" style={{ borderTop: "1px solid #e8edf2" }}>
                <a
                  href={content?.meetLink || "https://meet.google.com/hqk-sryh-ado"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-body font-bold text-sm uppercase tracking-[0.08em] px-6 py-3 rounded-xl text-white transition-all hover:opacity-90"
                  style={{ background: "#1a6fb5" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Join This Sunday
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== Section 3: Get Reminded ========== */}
      <section
        className="py-32 md:py-40"
        style={{ background: "#fafcff" }}
      >
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            {/* Left: Message info */}
            <div>
              <p
                className="font-body font-semibold text-sm uppercase tracking-[0.15em] mb-4"
                style={{ color: "#1a6fb5" }}
              >
                Never Miss a Service
              </p>
              <h2
                className="font-display uppercase tracking-tight mb-6"
                style={{
                  fontSize: "clamp(2.5rem, 6vw, 5rem)",
                  fontWeight: 900,
                  color: "#0a1a2f",
                }}
              >
                Get Reminded
              </h2>
              <p
                className="font-body text-lg leading-relaxed mb-6"
                style={{ color: "#4a6580" }}
              >
                We&apos;ll send you a friendly reminder before each Sunday
                service so you never miss a moment of worship and community.
              </p>
              <p
                className="font-body text-sm"
                style={{ color: "#7a9ab4" }}
              >
                Choose email or text — whatever works best for you.
              </p>
            </div>

            {/* Right: ReminderSignup */}
            <div>
              <ReminderSignup />
            </div>
          </div>
        </div>
      </section>

      {/* ========== Section 4: Past Services ========== */}
      <section
        className="py-32 md:py-40"
        style={{ background: "#f0f4f8" }}
      >
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="text-center mb-16">
            <p
              className="font-body font-semibold text-sm uppercase tracking-[0.15em] mb-4"
              style={{ color: "#1a6fb5" }}
            >
              Catch Up
            </p>
            <h2
              className="font-display uppercase tracking-tight mb-4"
              style={{
                fontSize: "clamp(2.5rem, 6vw, 5rem)",
                fontWeight: 900,
                color: "#0a1a2f",
              }}
            >
              Past Services
            </h2>
            <p
              className="font-body text-lg max-w-xl mx-auto"
              style={{ color: "#4a6580" }}
            >
              Missed a Sunday? Watch previous messages and be encouraged.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            {pastServices.map((service) => (
              <div
                key={service.id}
                className="rounded-2xl overflow-hidden shadow-[0_2px_15px_rgba(26,111,181,0.06)] hover:shadow-[0_12px_40px_rgba(26,111,181,0.14)] hover:-translate-y-2 transition-all duration-300 group cursor-pointer"
                style={{ background: "#ffffff" }}
              >
                <div
                  className="aspect-video relative"
                  style={{
                    background:
                      "linear-gradient(135deg, #0a1a2f, #1a3d5c)",
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-all"
                      style={{ background: "rgba(255,255,255,0.15)" }}
                    >
                      <svg
                        className="w-6 h-6 text-white ml-0.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-body font-bold px-3 py-1 rounded-full">
                    {service.duration}
                  </div>
                </div>
                <div className="p-6">
                  <p
                    className="text-xs font-body font-bold uppercase tracking-[0.1em] mb-2"
                    style={{ color: "#1a6fb5" }}
                  >
                    {service.date}
                  </p>
                  <h3
                    className="font-display text-xl mb-1"
                    style={{ fontWeight: 800, color: "#0a1a2f" }}
                  >
                    {service.title}
                  </h3>
                  <p
                    className="font-body text-sm"
                    style={{ color: "#4a6580" }}
                  >
                    {service.scripture}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== Section 5: Scripture ========== */}
      <section
        className="relative py-32 md:py-40 lg:py-48 overflow-hidden"
        style={{ background: "#fafcff" }}
      >
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16 flex flex-col items-start justify-center">
          <div className="flex items-stretch gap-8 md:gap-12">
            {/* Gradient accent bar */}
            <div
              className="w-[4px] md:w-[6px] rounded-full flex-shrink-0"
              style={{
                background:
                  "linear-gradient(180deg, #1a6fb5, #00d4ff)",
              }}
            />
            <div className="flex-col max-w-4xl">
              <div
                className="text-5xl md:text-6xl lg:text-7xl uppercase font-display leading-[1.05]"
                style={{ fontWeight: 800, color: "#0a1a2f" }}
              >
                And let us not neglect our meeting together, as some people
                do, but encourage one another.
              </div>
              <div
                className="inline-block px-6 py-3 mt-8 text-white rounded-lg font-body font-bold text-sm tracking-[0.08em]"
                style={{ background: "#1a6fb5" }}
              >
                Hebrews 10:25
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
