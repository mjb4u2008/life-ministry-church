"use client";

import { useState, useRef, useEffect } from "react";

export function AmbientMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem("lifeMinistryMusic");
    if (saved === "playing") {
      setHasInteracted(true);
      // Don't auto-play, but show that it was playing before
    }
  }, []);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        localStorage.setItem("lifeMinistryMusic", "paused");
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
        setHasInteracted(true);
        localStorage.setItem("lifeMinistryMusic", "playing");
      }
    } catch (error) {
      console.error("Audio playback failed:", error);
    }
  };

  return (
    <>
      <audio ref={audioRef} loop preload="none">
        <source src="/audio/ambient.mp3" type="audio/mpeg" />
      </audio>

      <button
        onClick={togglePlay}
        className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg group ${
          isPlaying
            ? "bg-water text-white shadow-water/30 animate-pulse-soft"
            : "bg-white text-water border border-border-light hover:bg-water/10 shadow-water/10"
        }`}
        aria-label={isPlaying ? "Pause ambient music" : "Play ambient music"}
        title={isPlaying ? "Pause music" : "Play ambient music"}
      >
        {isPlaying ? (
          // Pause icon
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          // Music note icon
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        )}
      </button>
    </>
  );
}
