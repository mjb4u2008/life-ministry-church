"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/Button";
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
    <div className="min-h-screen bg-white">
      {/* ========== Section 1: Hero ========== */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-gradient-to-b from-white to-sky">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-deep mb-4">
            Join Us This Sunday
          </h1>
          <p className="text-text-body text-lg max-w-2xl mx-auto mb-10">
            Interactive worship and fellowship every Sunday at 10:00 AM Eastern.
            Connect face-to-face with our community from wherever you are.
          </p>

          <div className="mb-10">
            <Button
              href={content?.meetLink || "#"}
              external
              size="lg"
              className="text-xl px-12 py-5"
            >
              Join on Google Meet
            </Button>
          </div>

          <ServiceCountdown />
        </div>
      </section>

      {/* ========== Section 2: This Week's Message ========== */}
      <section className="py-16 md:py-24 bg-cloud">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-sm uppercase tracking-wider text-water font-medium mb-2">
              This Week&apos;s Message
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-deep mb-4">
              {content?.weeklyMessage?.title || "Sunday Service"}
            </h2>
            {content?.weeklyMessage?.scripture && (
              <p className="text-water font-medium text-lg flex items-center justify-center gap-2 mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <p className="text-text-body text-lg max-w-2xl mx-auto leading-relaxed">
              {content?.weeklyMessage?.description ||
                "Join us for worship, fellowship, and an encouraging word from Scripture."}
            </p>
          </div>

          {/* YouTube embed placeholder */}
          <div className="max-w-3xl mx-auto">
            <div className="relative w-full rounded-2xl overflow-hidden bg-deep/10" style={{ aspectRatio: "16 / 9" }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-deep/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-deep/50 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== Section 3: Get Reminded ========== */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Left: Message info */}
            <div>
              <p className="text-sm uppercase tracking-wider text-water font-medium mb-2">
                Never Miss a Service
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-deep mb-4">
                Get Reminded
              </h2>
              <p className="text-text-body text-lg leading-relaxed mb-6">
                We&apos;ll send you a friendly reminder before each Sunday service
                so you never miss a moment of worship and community.
              </p>
              <p className="text-text-light text-sm">
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
      <section className="py-16 md:py-24 bg-sky">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-wider text-water font-medium mb-2">
              Catch Up
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-deep">
              Past Services
            </h2>
            <p className="text-text-body mt-3 max-w-xl mx-auto">
              Missed a Sunday? Watch previous messages and be encouraged.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {pastServices.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
              >
                <div className="aspect-video bg-gradient-to-br from-deep to-ocean relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-water group-hover:scale-110 transition-all">
                      <svg
                        className="w-5 h-5 text-white ml-0.5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
                    {service.duration}
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs text-water font-medium mb-1">
                    {service.date}
                  </p>
                  <h3 className="font-display text-lg font-semibold text-deep mb-1">
                    {service.title}
                  </h3>
                  <p className="text-text-body text-sm">
                    {service.scripture}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== Section 5: Scripture ========== */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <blockquote className="font-display text-2xl md:text-3xl lg:text-4xl text-deep leading-relaxed italic mb-6">
            &ldquo;And let us not neglect our meeting together, as some people
            do, but encourage one another, especially now that the day of his
            return is drawing near.&rdquo;
          </blockquote>
          <p className="text-water font-medium text-lg">
            Hebrews 10:25
          </p>
        </div>
      </section>
    </div>
  );
}
