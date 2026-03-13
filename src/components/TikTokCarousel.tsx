"use client";

import { useRef, useState, useEffect } from "react";

interface TikTokVideo {
  id: string;
  url: string;
  title: string;
}

interface TikTokCarouselProps {
  videos: TikTokVideo[];
  tiktokProfileUrl?: string;
}

function extractVideoId(url: string): string | null {
  const match = url.match(/\/video\/(\d+)/);
  return match ? match[1] : null;
}

export function TikTokCarousel({ videos, tiktokProfileUrl }: TikTokCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollRef.current;
    if (container) {
      container.addEventListener("scroll", updateScrollButtons);
      window.addEventListener("resize", updateScrollButtons);
      return () => {
        container.removeEventListener("scroll", updateScrollButtons);
        window.removeEventListener("resize", updateScrollButtons);
      };
    }
  }, [videos]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Empty state
  if (videos.length === 0) {
    return (
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-terracotta font-medium tracking-wider uppercase text-sm">
              Daily Encouragement
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-charcoal mt-2">
              Latest from Pastor Mike
            </h2>
          </div>

          <div className="flex justify-center">
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center max-w-md">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-charcoal/5 flex items-center justify-center">
                <svg className="w-10 h-10 text-charcoal/30" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                </svg>
              </div>
              <p className="text-charcoal-light text-lg mb-2">
                Videos coming soon
              </p>
              <p className="text-charcoal-light/70 text-sm">
                Check back for daily encouragement!
              </p>
              {tiktokProfileUrl && (
                <a
                  href={tiktokProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-6 text-terracotta hover:text-terracotta-dark font-medium transition-colors"
                >
                  Follow on TikTok
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Single video - centered display
  if (videos.length === 1) {
    const video = videos[0];
    const videoId = extractVideoId(video.url);

    return (
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-terracotta font-medium tracking-wider uppercase text-sm">
              Daily Encouragement
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-semibold text-charcoal mt-2">
              Latest from Pastor Mike
            </h2>
          </div>

          <div className="flex justify-center">
            <div className="w-[300px]">
              <div className="bg-white rounded-2xl shadow-md overflow-hidden">
                {videoId ? (
                  <iframe
                    src={`https://www.tiktok.com/embed/v2/${videoId}`}
                    className="w-full h-[530px]"
                    allowFullScreen
                    allow="encrypted-media"
                  />
                ) : (
                  <div className="w-full h-[530px] bg-charcoal/5 flex items-center justify-center">
                    <p className="text-charcoal-light text-sm">Invalid video URL</p>
                  </div>
                )}
                {video.title && (
                  <div className="p-4 border-t border-charcoal/5">
                    <p className="text-charcoal text-sm font-medium line-clamp-2">
                      {video.title}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {tiktokProfileUrl && (
            <div className="text-center mt-8">
              <a
                href={tiktokProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-terracotta hover:text-terracotta-dark font-medium transition-colors"
              >
                Follow @pastormike on TikTok
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Multiple videos - carousel
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-terracotta font-medium tracking-wider uppercase text-sm">
            Daily Encouragement
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-charcoal mt-2">
            Latest from Pastor Mike
          </h2>
          <p className="text-charcoal-light text-lg mt-4 max-w-2xl mx-auto">
            Get daily encouragement and stay connected with our community throughout the week.
          </p>
        </div>
      </div>

      {/* Carousel container */}
      <div className="relative group">
        {/* Left arrow - desktop only */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg items-center justify-center text-charcoal hover:bg-white hover:text-terracotta transition-all opacity-0 group-hover:opacity-100"
            aria-label="Scroll left"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Right arrow - desktop only */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg items-center justify-center text-charcoal hover:bg-white hover:text-terracotta transition-all opacity-0 group-hover:opacity-100"
            aria-label="Scroll right"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Left fade gradient */}
        {canScrollLeft && (
          <div className="hidden md:block absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-cream to-transparent z-[1] pointer-events-none" />
        )}

        {/* Right fade gradient */}
        {canScrollRight && (
          <div className="hidden md:block absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-cream to-transparent z-[1] pointer-events-none" />
        )}

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide px-4 md:px-8 pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* Left padding for centering on larger screens */}
          <div className="hidden lg:block flex-shrink-0 w-[calc((100vw-1280px)/2+32px)]" />

          {videos.map((video) => {
            const videoId = extractVideoId(video.url);
            return (
              <div
                key={video.id}
                className="flex-shrink-0 w-[300px] snap-center"
              >
                <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {videoId ? (
                    <iframe
                      src={`https://www.tiktok.com/embed/v2/${videoId}`}
                      className="w-full h-[530px]"
                      allowFullScreen
                      allow="encrypted-media"
                    />
                  ) : (
                    <div className="w-full h-[530px] bg-charcoal/5 flex items-center justify-center">
                      <p className="text-charcoal-light text-sm">Invalid video URL</p>
                    </div>
                  )}
                  {video.title && (
                    <div className="p-4 border-t border-charcoal/5">
                      <p className="text-charcoal text-sm font-medium line-clamp-2">
                        {video.title}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Follow card at the end */}
          {tiktokProfileUrl && (
            <div className="flex-shrink-0 w-[300px] snap-center">
              <a
                href={tiktokProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full min-h-[530px] bg-gradient-to-br from-charcoal to-charcoal-light rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all group/card"
              >
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-24 h-24 mb-6 rounded-full bg-white/10 flex items-center justify-center group-hover/card:bg-white/20 transition-colors">
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                    </svg>
                  </div>
                  <h3 className="text-white text-xl font-display font-semibold mb-2">
                    Follow on TikTok
                  </h3>
                  <p className="text-white/70 text-sm mb-6">
                    More encouragement, behind-the-scenes, and daily inspiration
                  </p>
                  <div className="flex items-center gap-2 text-white font-medium group-hover/card:gap-3 transition-all">
                    @pastormike
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
              </a>
            </div>
          )}

          {/* Right padding for centering on larger screens */}
          <div className="hidden lg:block flex-shrink-0 w-[calc((100vw-1280px)/2+32px)]" />
        </div>
      </div>
    </section>
  );
}
