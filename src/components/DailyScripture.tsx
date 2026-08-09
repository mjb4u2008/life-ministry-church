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
    <section className="border-b-2 life-modernist-rule bg-[var(--modernist-paper)] py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1120px] px-5 text-center sm:px-8 lg:px-12">
        <p className="mb-6 text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--modernist-blue)]">
          A word for today
        </p>

        <div className="mx-auto mb-8 h-0.5 w-16 bg-[var(--modernist-blue)]" />

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="mx-auto h-8 w-3/4 bg-[var(--modernist-ink)]/10" />
            <div className="mx-auto h-8 w-1/2 bg-[var(--modernist-ink)]/10" />
            <div className="mx-auto h-5 w-32 bg-[var(--modernist-ink)]/10" />
          </div>
        ) : (
          <>
            <blockquote className="mb-6">
              <p className="text-[clamp(1.8rem,4vw,3.3rem)] font-semibold leading-[1.13] tracking-[-0.035em] text-[var(--modernist-ink)]">
                &ldquo;{scripture.verse}&rdquo;
              </p>
            </blockquote>

            <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.16em] text-[var(--modernist-blue)]">
              {scripture.reference}
            </p>

            {scripture.reflection && (
              <p className="mx-auto max-w-xl text-lg leading-8 text-[var(--modernist-ink)]/70">
                {scripture.reflection}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
