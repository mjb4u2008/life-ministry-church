"use client";

import { useState, useEffect } from "react";

interface DailyScriptureData {
  verse: string;
  reference: string;
  reflection: string;
}

const FALLBACK: DailyScriptureData = {
  verse: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
  reference: "John 3:16",
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
    <section className="py-16 md:py-20 bg-sky">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="text-water font-medium tracking-wider uppercase text-sm">
          Daily Inspiration
        </span>

        {loading ? (
          <div className="mt-6 animate-pulse">
            <div className="h-8 w-3/4 bg-border-light rounded mx-auto mb-4" />
            <div className="h-8 w-1/2 bg-border-light rounded mx-auto mb-4" />
            <div className="h-5 w-32 bg-border-light rounded mx-auto" />
          </div>
        ) : (
          <>
            <blockquote className="mt-6 mb-4">
              <p className="font-display text-2xl md:text-3xl lg:text-4xl italic text-deep leading-relaxed">
                &ldquo;{scripture.verse}&rdquo;
              </p>
            </blockquote>
            <cite className="text-water font-medium text-lg not-italic block">
              {scripture.reference}
            </cite>
            {scripture.reflection && (
              <p className="mt-4 text-text-body text-base">
                {scripture.reflection}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
