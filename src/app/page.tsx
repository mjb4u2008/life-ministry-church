import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/Button";
import { ServiceCountdown } from "@/components/ServiceCountdown";
import { HomeContent } from "@/components/HomeContent";
import { ScrollReveal } from "@/components/ScrollReveal";

function getNextSundays(count: number) {
  const sundays = [];
  const now = new Date();
  const currentDay = now.getDay();
  const daysUntilSunday = currentDay === 0 ? 7 : 7 - currentDay;
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);

  for (let i = 0; i < count; i++) {
    const sunday = new Date(nextSunday);
    sunday.setDate(nextSunday.getDate() + i * 7);
    sundays.push({
      day: String(sunday.getDate()),
      month: sunday.toLocaleString("en-US", { month: "short" }),
      fullDate: sunday.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
      title: "L.I.F.E. Sunday Worship",
      time: "10:00 AM EST",
      type: "Weekly Service",
    });
  }
  return sundays;
}

const upcomingSundays = getNextSundays(3);

export default function HomePage() {
  return (
    <>
      {/* ========================================
          A. HERO SECTION
          ======================================== */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden bg-gradient-to-b from-white via-white to-sky">
        {/* Soft radial glow behind logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-water/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center flex-1 flex flex-col items-center justify-center">
          <div className="animate-fade-in-up">
            {/* Water Cross Logo */}
            <div className="relative mx-auto mb-10 w-[160px] h-[160px] md:w-[200px] md:h-[200px]">
              <div className="absolute inset-0 bg-gradient-radial from-cyan/20 via-water/10 to-transparent rounded-full scale-150" />
              <Image
                src="/logo-water-cross.png"
                alt="L.I.F.E. Ministry Water Cross"
                width={200}
                height={200}
                className="relative z-10 rounded-full"
                priority
              />
            </div>

            {/* L.I.F.E. in massive spaced letters */}
            <h1 className="statement-heading text-deep tracking-[0.3em] mb-4">
              L . I . F . E .
            </h1>

            {/* Tagline */}
            <p className="font-display text-2xl md:text-3xl text-text-body mb-3">
              Lord Is Forever Emmanuel
            </p>

            {/* Sub-tagline */}
            <p className="text-text-light italic text-lg mb-10">
              Without life, there&apos;s no us
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button href="/watch" size="lg">
                Join This Sunday
              </Button>
              <Button href="/about" variant="outline" size="lg">
                What is L.I.F.E.?
              </Button>
            </div>

            {/* Service Countdown */}
            <ServiceCountdown />
          </div>
        </div>

        {/* Scroll-down indicator */}
        <div className="pb-8 animate-float">
          <svg
            className="w-6 h-6 text-text-light mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ========================================
          B. SCROLL-REVEAL STATEMENT
          ======================================== */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-stretch gap-8 md:gap-12">
            {/* Vertical line */}
            <div className="flex-shrink-0 flex items-center">
              <div className="w-[2px] h-[200px] md:h-[280px] bg-gradient-to-b from-water/20 via-water to-water/20" />
            </div>
            {/* Words stacked */}
            <div className="flex flex-col justify-center gap-4 md:gap-6">
              <ScrollReveal delay={0}>
                <h2 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-deep leading-none">
                  Lord
                </h2>
              </ScrollReveal>
              <ScrollReveal delay={150}>
                <h2 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-water leading-none">
                  Is
                </h2>
              </ScrollReveal>
              <ScrollReveal delay={300}>
                <h2 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-deep leading-none">
                  Forever
                </h2>
              </ScrollReveal>
              <ScrollReveal delay={450}>
                <h2 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-water leading-none">
                  Emmanuel
                </h2>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          C. MARQUEE BANNER
          ======================================== */}
      <section className="bg-cloud py-6 overflow-hidden">
        <div className="marquee-track">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="flex-shrink-0 uppercase tracking-[0.3em] text-water/30 text-xl font-bold whitespace-nowrap px-8"
            >
              WITHOUT LIFE THERE&apos;S NO US &bull;
            </span>
          ))}
        </div>
      </section>

      {/* ========================================
          D. L.I.F.E. MEANING SECTION
          ======================================== */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-water font-medium tracking-wider uppercase text-sm">
              The Heart of Our Ministry
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-deep mt-3">
              Lord Is Forever Emmanuel
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
            {[
              {
                letter: "L",
                word: "Lord",
                description:
                  "Jesus Christ is Lord of all. He is the foundation, the cornerstone, and the head of the church.",
              },
              {
                letter: "I",
                word: "Is",
                description:
                  "Not was, not will be — IS. God is present tense. He is with you right now, in this moment.",
              },
              {
                letter: "F",
                word: "Forever",
                description:
                  "His love is eternal. His promises endure. His faithfulness spans every generation.",
              },
              {
                letter: "E",
                word: "Emmanuel",
                description:
                  "God with us. He is not distant or detached — He dwells among His people.",
              },
            ].map((item, index) => (
              <ScrollReveal key={item.letter} delay={index * 150}>
                <div className="bg-cloud rounded-2xl p-8 text-center card-glow h-full">
                  <div className="w-20 h-20 bg-water text-white rounded-full flex items-center justify-center mx-auto mb-5">
                    <span className="text-3xl font-display font-bold">
                      {item.letter}
                    </span>
                  </div>
                  <h3 className="text-xl font-display font-semibold text-deep mb-3">
                    {item.word}
                  </h3>
                  <p className="text-text-body text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          E. DAILY SCRIPTURE
          ======================================== */}
      <section className="py-16 md:py-20 bg-sky">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-water font-medium tracking-wider uppercase text-sm">
            Daily Inspiration
          </span>
          <blockquote className="mt-6 mb-4">
            <p className="font-display text-2xl md:text-3xl lg:text-4xl italic text-deep leading-relaxed">
              &ldquo;For God so loved the world, that he gave his only begotten
              Son, that whosoever believeth in him should not perish, but have
              everlasting life.&rdquo;
            </p>
          </blockquote>
          <cite className="text-water font-medium text-lg not-italic">
            John 3:16
          </cite>
        </div>
      </section>

      {/* ========================================
          F. THIS SUNDAY (Featured Article)
          ======================================== */}
      <HomeContent />

      {/* ========================================
          G. LATEST MESSAGE (YouTube)
          ======================================== */}
      <section className="py-24 bg-cloud">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-water font-medium tracking-wider uppercase text-sm">
              Watch & Listen
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-deep mt-2">
              Latest Message
            </h2>
          </div>

          {/* 16:9 YouTube placeholder */}
          <div className="relative w-full rounded-2xl overflow-hidden shadow-lg shadow-water/10 bg-deep/5 aspect-video">
            <div className="absolute inset-0 flex flex-col items-center justify-center text-text-light">
              <svg
                className="w-16 h-16 mb-4 opacity-30"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              <p className="text-sm">Latest sermon coming soon</p>
            </div>
          </div>

          <div className="text-center mt-6">
            <h3 className="font-display text-xl font-semibold text-deep">
              Sunday Message
            </h3>
            <p className="text-text-body text-sm mt-1">
              New messages posted weekly
            </p>
          </div>
        </div>
      </section>

      {/* ========================================
          I. TESTIMONIES PREVIEW
          ======================================== */}
      <section className="py-24 bg-sky">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-water font-medium tracking-wider uppercase text-sm">
              Stories of Faith
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-deep mt-2">
              We Are All Ministers
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                initials: "JD",
                name: "James D.",
                testimony:
                  "Finding L.I.F.E. Ministry changed everything. I felt seen, heard, and welcomed from day one. This community is family.",
              },
              {
                initials: "SM",
                name: "Sarah M.",
                testimony:
                  "The prayer wall carried me through the hardest season of my life. Knowing others were lifting me up gave me the strength to keep going.",
              },
              {
                initials: "RC",
                name: "Robert C.",
                testimony:
                  "Pastor Mike's messages remind me every week that God is present — not in the past, not in the future, but right now. Emmanuel.",
              },
            ].map((item, index) => (
              <ScrollReveal key={item.initials} delay={index * 150}>
                <div className="bg-white rounded-2xl p-8 shadow-sm shadow-water/10 card-glow h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-water/10 text-water rounded-full flex items-center justify-center font-semibold">
                      {item.initials}
                    </div>
                    <span className="font-display text-lg font-semibold text-deep">
                      {item.name}
                    </span>
                  </div>
                  <p className="text-text-body leading-relaxed italic">
                    &ldquo;{item.testimony}&rdquo;
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <div className="text-center">
            <Button href="/testimonies" variant="outline">
              View All Testimonies
            </Button>
          </div>
        </div>
      </section>

      {/* ========================================
          J. NEED PRAYER?
          ======================================== */}
      <div className="wave-divider" />
      <section className="py-24 bg-deep text-white relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, #ffffff 1px, transparent 0)`,
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold mb-6">
            Need Prayer?
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
            You don&apos;t have to carry your burdens alone. Share your prayer
            requests and let our community lift you up. Every request is
            seen, every prayer is heard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/connect" variant="primary" size="lg">
              Submit a Prayer Request
            </Button>
            <Link
              href="/connect"
              className="inline-flex items-center justify-center text-white/80 hover:text-white font-medium py-3 transition-colors"
            >
              View Prayer Wall
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================
          K. UPCOMING GATHERINGS
          ======================================== */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div>
              <span className="text-water font-medium tracking-wider uppercase text-sm">
                Mark Your Calendar
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-semibold text-deep mt-2">
                Upcoming Gatherings
              </h2>
            </div>
            <Button href="/watch" variant="ghost" className="mt-4 md:mt-0">
              View All Services
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingSundays.map((event, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <div className="bg-cloud rounded-2xl p-6 shadow-sm shadow-water/10 hover:shadow-lg hover:shadow-water/15 transition-shadow flex gap-5 card-glow">
                  <div className="flex-shrink-0 w-16 h-16 bg-sky rounded-xl flex flex-col items-center justify-center">
                    <span className="text-2xl font-display font-bold text-water">
                      {event.day}
                    </span>
                    <span className="text-xs uppercase text-text-light">
                      {event.month}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-water font-medium">
                      {event.type}
                    </span>
                    <h3 className="font-display text-lg font-semibold text-deep mt-1">
                      {event.title}
                    </h3>
                    <p className="text-text-body text-sm mt-1">
                      {event.time}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          L. FINAL CTA
          ======================================== */}
      <section className="py-24 bg-cloud">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-deep mb-6">
            Ready to Join Us?
          </h2>
          <p className="text-text-body text-lg mb-10 max-w-2xl mx-auto">
            There&apos;s a place for you at our table. Whether you&apos;re
            exploring faith for the first time or looking for a new church
            home, we&apos;d love to meet you.
          </p>
          <Button href="/watch" size="lg">
            Join This Sunday
          </Button>
        </div>
      </section>
    </>
  );
}
