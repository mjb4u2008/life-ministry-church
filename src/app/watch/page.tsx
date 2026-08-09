"use client";

import { GatheringExperience } from "@/components/gatherings";
import { ReminderSignup } from "@/components/ReminderSignup";

export default function WatchPage() {
  return (
    <div className="min-h-screen bg-[#fafcff] pt-16 md:pt-20">
      <GatheringExperience mode="watch" />

      <section className="bg-white py-16 sm:py-24" id="reminded">
        <div className="mx-auto grid max-w-screen-xl grid-cols-1 gap-10 px-4 min-[360px]:px-5 sm:px-6 md:grid-cols-2 md:items-start lg:px-12">
          <div>
            <p className="font-body text-sm font-bold uppercase tracking-[0.15em] text-[#1a6fb5]">
              Stay connected
            </p>
            <h2 className="mt-3 font-display text-4xl font-black text-[#0a1a2f] sm:text-5xl">
              Get reminded
            </h2>
            <p className="mt-5 max-w-xl font-body text-lg leading-relaxed text-[#4a6580]">
              Choose email or text and we’ll let you know before upcoming L.I.F.E. Ministry gatherings.
            </p>
          </div>
          <ReminderSignup />
        </div>
      </section>

      <section className="bg-[#f0f4f8] py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 min-[360px]:px-5 sm:px-6">
          <blockquote className="border-l-4 border-[#1a6fb5] pl-5 font-display text-3xl font-extrabold leading-tight text-[#0a1a2f] sm:pl-8 sm:text-5xl">
            And let us not neglect our meeting together, as some people do, but encourage one another.
          </blockquote>
          <p className="mt-6 font-body font-bold text-[#1a6fb5]">Hebrews 10:25</p>
        </div>
      </section>
    </div>
  );
}
