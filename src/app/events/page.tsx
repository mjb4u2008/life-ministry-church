"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/* ─────────────────────────────────────────────
   Compute next 3 Sundays dynamically
   ───────────────────────────────────────────── */
function getNextSundays(count: number): Date[] {
  const sundays: Date[] = [];
  const now = new Date();
  const current = new Date(now);
  current.setHours(11, 30, 0, 0); // 11:30 AM EST

  // Start from today or next Sunday
  const day = current.getDay();
  if (day !== 0 || now > current) {
    current.setDate(current.getDate() + ((7 - day) % 7 || 7));
  }

  for (let i = 0; i < count; i++) {
    sundays.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }

  return sundays;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function EventsPage() {
  const nextSundays = useMemo(() => getNextSundays(3), []);

  return (
    <div>
      {/* ================================================
          HERO
          ================================================ */}
      <section className="bg-[#0a1a2f] text-white py-32 md:py-40 lg:py-48">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          <h1
            className="font-display uppercase tracking-tight mb-6"
            style={{
              fontSize: "clamp(3rem, 10vw, 8rem)",
              fontWeight: 900,
              lineHeight: 0.9,
            }}
          >
            Upcoming Events
          </h1>
          <p
            className="font-body text-lg md:text-xl text-white/60 max-w-2xl mx-auto"
          >
            Join us for worship, fellowship, and community.
          </p>
        </div>
      </section>

      {/* ================================================
          UPCOMING EVENTS
          ================================================ */}
      <section className="bg-[#fafcff] py-24 md:py-32 lg:py-40">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16">
          {/* Section heading */}
          <div className="text-center mb-6">
            <Badge className="mb-6 bg-[#1a6fb5]/10 text-[#1a6fb5] border-[#1a6fb5]/20 font-body font-bold text-xs uppercase tracking-widest px-4 py-1 h-auto rounded-full">
              Sunday Services
            </Badge>
            <h2
              className="font-display text-3xl md:text-4xl lg:text-5xl tracking-tight"
              style={{ fontWeight: 900, color: "#0a1a2f" }}
            >
              Join Us This Sunday
            </h2>
          </div>

          <div className="flex justify-center mb-16">
            <Separator className="w-24 bg-[#1a6fb5]" />
          </div>

          {/* Event Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {nextSundays.map((sunday, i) => (
              <Card
                key={i}
                className="bg-white ring-1 ring-[#e0eaf3] rounded-xl hover:shadow-lg transition-shadow duration-300 py-0"
              >
                <CardContent className="p-6 md:p-8">
                  <Badge className="mb-4 bg-[#00d4ff]/10 text-[#0a1a2f] border-[#00d4ff]/30 font-body font-bold text-xs px-3 py-1 h-auto rounded-full">
                    <Calendar className="size-3 mr-1.5" />
                    {formatShortDate(sunday)}
                  </Badge>

                  <h3
                    className="font-display text-xl md:text-2xl mb-3"
                    style={{ fontWeight: 800, color: "#0a1a2f" }}
                  >
                    L.I.F.E. Sunday Worship
                  </h3>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm font-body" style={{ color: "#4a6580" }}>
                      <Clock className="size-4 text-[#1a6fb5]" />
                      <span>8:30 AM PST / 11:30 AM EST</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-body" style={{ color: "#4a6580" }}>
                      <MapPin className="size-4 text-[#1a6fb5]" />
                      <span>Online via Google Meet</span>
                    </div>
                    <p className="text-sm font-body leading-relaxed mt-3" style={{ color: "#4a6580" }}>
                      {formatDate(sunday)} — Join us for an uplifting time of worship, prayer, and the Word. Everyone is welcome.
                    </p>
                  </div>

                  <Button
                    className="w-full bg-[#1a6fb5] hover:bg-[#145a94] text-white font-body font-bold text-xs uppercase tracking-wider rounded-lg cursor-pointer"
                    render={
                      <a
                        href="https://meet.google.com/hqk-sryh-ado"
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    Join on Google Meet
                    <ArrowRight className="ml-2 size-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty state / More events */}
          <div className="text-center py-12 bg-white rounded-2xl ring-1 ring-[#e0eaf3]">
            <Calendar className="size-10 text-[#1a6fb5]/30 mx-auto mb-4" />
            <p
              className="font-body text-lg font-semibold mb-2"
              style={{ color: "#0a1a2f" }}
            >
              More events coming soon!
            </p>
            <p className="font-body text-sm" style={{ color: "#4a6580" }}>
              Follow us to stay updated.
            </p>
          </div>
        </div>
      </section>

      {/* ================================================
          PHOTO GALLERY PLACEHOLDER
          ================================================ */}
      <section className="bg-white py-24 md:py-32">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="text-center mb-6">
            <h2
              className="font-display text-3xl md:text-4xl uppercase tracking-wide"
              style={{ fontWeight: 900, color: "#0a1a2f" }}
            >
              Event Photos
            </h2>
          </div>

          <div className="flex justify-center mb-16">
            <Separator className="w-24 bg-[#1a6fb5]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#f0f4f8] rounded-2xl aspect-[4/3] flex items-center justify-center"
              >
                <p className="font-body text-sm font-semibold" style={{ color: "#4a6580" }}>
                  Event Photos Coming Soon
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================
          BOTTOM CTA
          ================================================ */}
      <section className="bg-[#f0f4f8] py-16 md:py-20">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          <h3
            className="font-display text-2xl md:text-3xl mb-4"
            style={{ fontWeight: 800, color: "#0a1a2f" }}
          >
            Want to host or suggest an event?
          </h3>
          <p className="font-body text-base mb-8" style={{ color: "#4a6580" }}>
            Get in touch with our team and let us know your ideas.
          </p>
          <Button
            size="lg"
            className="bg-[#1a6fb5] hover:bg-[#145a94] text-white font-body font-bold text-sm uppercase tracking-wider px-8 py-6 rounded-xl cursor-pointer"
            render={<a href="mailto:ministry@lifeministy.org" />}
          >
            Get in Touch
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
