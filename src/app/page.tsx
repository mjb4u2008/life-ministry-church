import Link from "next/link";
import { Button } from "@/components/Button";
import { ServiceCountdown } from "@/components/ServiceCountdown";
import { HomeContent } from "@/components/HomeContent";

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, #C4704A 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-terracotta/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-forest/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="animate-fade-in-up">
            <span className="inline-block text-terracotta font-medium tracking-wider uppercase text-sm mb-6">
              Welcome Home
            </span>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-semibold text-charcoal leading-tight mb-6">
              Gather Together,
              <br />
              <span className="text-terracotta">Wherever You Are</span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg md:text-xl text-charcoal-light mb-10">
              Join our interactive Sunday service from anywhere in the world.
              Connect face-to-face, share in worship, and be part of a
              community that welcomes you as you are.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button href="/watch" size="lg">
                Join This Sunday
              </Button>
              <Button href="/about" variant="outline" size="lg">
                Learn More
              </Button>
            </div>

            <ServiceCountdown />
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-6 h-10 border-2 border-warm-gray-light rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-warm-gray rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Dynamic Content Sections */}
      <HomeContent />

      {/* Prayer CTA Section */}
      <section className="py-24 bg-forest text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
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

      {/* Upcoming Events Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div>
              <span className="text-terracotta font-medium tracking-wider uppercase text-sm">
                Mark Your Calendar
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-semibold text-charcoal mt-2">
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
            {[
              {
                day: "12",
                month: "Jan",
                title: "L.I.F.E. Sunday Worship",
                time: "10:00 AM",
                type: "Weekly Service",
              },
              {
                day: "19",
                month: "Jan",
                title: "L.I.F.E. Sunday Worship",
                time: "10:00 AM",
                type: "Weekly Service",
              },
              {
                day: "26",
                month: "Jan",
                title: "L.I.F.E. Sunday Worship",
                time: "10:00 AM",
                type: "Weekly Service",
              },
            ].map((event, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow flex gap-5"
              >
                <div className="flex-shrink-0 w-16 h-16 bg-cream rounded-xl flex flex-col items-center justify-center">
                  <span className="text-2xl font-display font-bold text-terracotta">
                    {event.day}
                  </span>
                  <span className="text-xs uppercase text-charcoal-light">
                    {event.month}
                  </span>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-terracotta font-medium">
                    {event.type}
                  </span>
                  <h3 className="font-display text-lg font-semibold text-charcoal mt-1">
                    {event.title}
                  </h3>
                  <p className="text-charcoal-light text-sm mt-1">
                    {event.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-cream-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-charcoal mb-6">
            Ready to Join Us?
          </h2>
          <p className="text-charcoal-light text-lg mb-10 max-w-2xl mx-auto">
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
