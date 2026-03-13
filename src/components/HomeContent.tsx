"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/Button";
import { ReminderSignup } from "@/components/ReminderSignup";
import { TikTokCarousel } from "@/components/TikTokCarousel";

interface TikTokVideo {
  id: string;
  url: string;
  title: string;
}

interface SiteContent {
  weeklyMessage: {
    title: string;
    scripture: string;
    description: string;
  };
  socialLinks: {
    tiktok: string;
    instagram: string;
  };
  tiktokVideos: TikTokVideo[];
}

export function HomeContent() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    }
    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-4 w-32 bg-warm-gray-light rounded mb-4" />
            <div className="h-8 w-64 bg-warm-gray-light rounded mb-8" />
            <div className="grid md:grid-cols-2 gap-8">
              <div className="h-64 bg-warm-gray-light rounded-2xl" />
              <div className="h-64 bg-warm-gray-light rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Featured Message Section */}
      <section className="py-24 bg-cream-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-terracotta font-medium tracking-wider uppercase text-sm">
                This Week&apos;s Message
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-semibold text-charcoal mt-2 mb-4">
                {content?.weeklyMessage.title || "Join Us This Sunday"}
              </h2>
              {content?.weeklyMessage.scripture && (
                <p className="text-terracotta font-medium mb-4">
                  {content.weeklyMessage.scripture}
                </p>
              )}
              <p className="text-charcoal-light text-lg mb-8">
                {content?.weeklyMessage.description ||
                  "Join us for worship, fellowship, and an encouraging word. Everyone is welcome!"}
              </p>
              <Button href="/watch">Watch Live Sunday</Button>
            </div>

            {/* Reminder Signup Card */}
            <div className="flex justify-center">
              <div className="w-full max-w-sm">
                <ReminderSignup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TikTok Carousel Section */}
      <TikTokCarousel
        videos={content?.tiktokVideos || []}
        tiktokProfileUrl={content?.socialLinks.tiktok}
      />
    </>
  );
}
