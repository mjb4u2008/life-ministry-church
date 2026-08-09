"use client";

import { useState, useEffect } from "react";

interface DailyScriptureData {
  verse: string;
  reference: string;
  reflection: string;
}

const FALLBACK: DailyScriptureData = {
  verse: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope.",
  reference: "Jeremiah 29:11",
  reflection: "God's love for you is beyond measure — it changes everything.",
};

export function DailyScriptureSection() {
  const [scripture, setScripture] = useState<DailyScriptureData>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScripture() {
      try {
        const res = await fetch("/api/daily-scripture");
        if (res.ok) {
          const data = await res.json();
          if (data.verse && data.reference) {
            setScripture(data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch daily scripture:", error);
      }
      setLoading(false);
    }
    fetchScripture();
  }, []);

  return (
    <section className="border-y border-[#071521]/10 bg-[#f3efe6] py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-5 text-center sm:px-6 lg:px-12">
        <p className="life-kicker mb-8">
          A word for today
        </p>

        <div className="mx-auto mb-10 h-px w-16 bg-[#e4b75d]" />

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="mx-auto h-8 w-3/4 rounded bg-[#071521]/10" />
            <div className="mx-auto h-8 w-1/2 rounded bg-[#071521]/10" />
            <div className="mx-auto h-5 w-32 rounded bg-[#071521]/10" />
          </div>
        ) : (
          <>
            <blockquote className="mb-6">
              <p className="font-display text-[clamp(1.8rem,4vw,3.3rem)] font-bold leading-[1.15] text-[#071521]">
                &ldquo;{scripture.verse}&rdquo;
              </p>
            </blockquote>

            <p className="mb-4 font-body text-sm font-extrabold uppercase tracking-[0.16em] text-[#1677a8]">
              {scripture.reference}
            </p>

            {scripture.reflection && (
              <p className="mx-auto max-w-xl font-body text-lg leading-8 text-[#526675]">
                {scripture.reflection}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
