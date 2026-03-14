"use client";

import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";

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
    <section className="py-20 md:py-28" style={{ background: "#f0f4f8" }}>
      <div className="max-w-3xl mx-auto px-6 md:px-12 lg:px-16 text-center">
        <p
          className="font-body font-bold text-xs uppercase tracking-[0.2em] mb-8"
          style={{ color: "#1a6fb5" }}
        >
          Daily Inspiration
        </p>

        <Separator className="max-w-16 mx-auto mb-10" style={{ background: "#1a6fb5" }} />

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-3/4 rounded mx-auto" style={{ background: "#dce8f2" }} />
            <div className="h-8 w-1/2 rounded mx-auto" style={{ background: "#dce8f2" }} />
            <div className="h-5 w-32 rounded mx-auto" style={{ background: "#dce8f2" }} />
          </div>
        ) : (
          <>
            <blockquote className="mb-6">
              <p
                className="font-display italic leading-relaxed"
                style={{
                  fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)",
                  fontWeight: 500,
                  color: "#0a1a2f",
                }}
              >
                &ldquo;{scripture.verse}&rdquo;
              </p>
            </blockquote>

            <p
              className="font-body font-bold text-base uppercase tracking-[0.12em] mb-4"
              style={{ color: "#1a6fb5" }}
            >
              {scripture.reference}
            </p>

            {scripture.reflection && (
              <p
                className="font-body text-base leading-relaxed max-w-lg mx-auto"
                style={{ color: "#4a6580" }}
              >
                {scripture.reflection}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
