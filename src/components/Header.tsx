"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { Music } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/watch", label: "Watch" },
  { href: "/community", label: "Community" },
  { href: "/events", label: "Events" },
  { href: "/ask", label: "Ask The Word" },
  { href: "/give", label: "Give" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("lifeMinistryMusic");
    // Auto-play on first visit OR if they had it playing before
    // Only skip autoplay if they explicitly paused it
    if (saved !== "paused" && audioRef.current) {
      audioRef.current.volume = 0.3; // Start at 30% volume — not jarring
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          localStorage.setItem("lifeMinistryMusic", "playing");
        })
        .catch(() => {
          // Autoplay blocked by browser — user can click the icon
        });
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
        audioRef.current.volume = 0.3;
        await audioRef.current.play();
        setIsPlaying(true);
        localStorage.setItem("lifeMinistryMusic", "playing");
      }
    } catch (error) {
      console.error("Audio playback failed:", error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#e8edf2]">
      {/* Audio element */}
      <audio ref={audioRef} loop preload="auto" autoPlay>
        <source src="/audio/ambient.mp3" type="audio/mpeg" />
      </audio>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group"
          >
            <Image
              src="/logo-water-cross.png" className="rounded-xl"
              alt="L.I.F.E. Ministry"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="text-xl md:text-2xl font-semibold text-[#0a1a2f] group-hover:text-[#1a6fb5] transition-colors">
              L.I.F.E. Ministry
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[#0a1a2f] hover:text-[#1a6fb5] font-medium text-sm tracking-wide uppercase transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Desktop Music Toggle */}
            <button
              onClick={togglePlay}
              className={`hidden md:flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 cursor-pointer ${
                isPlaying
                  ? "bg-[#1a6fb5] text-white shadow-md"
                  : "bg-[#f0f4f8] text-[#4a6580] hover:bg-[#1a6fb5]/10 hover:text-[#1a6fb5]"
              }`}
              aria-label={isPlaying ? "Pause ambient music" : "Play ambient music"}
              title={isPlaying ? "Pause music" : "Play ambient music"}
            >
              <Music className={`size-4 ${isPlaying ? "animate-pulse" : ""}`} />
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-[#0a1a2f] hover:text-[#1a6fb5] transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-[#e8edf2]">
          <nav className="px-4 py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="block text-[#0a1a2f] hover:text-[#1a6fb5] font-medium text-sm tracking-wide uppercase py-2 transition-colors"
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile Music Toggle */}
            <button
              onClick={togglePlay}
              className={`flex items-center gap-3 w-full py-2 font-medium text-sm tracking-wide uppercase transition-colors cursor-pointer ${
                isPlaying
                  ? "text-[#1a6fb5]"
                  : "text-[#0a1a2f] hover:text-[#1a6fb5]"
              }`}
            >
              <Music className={`size-4 ${isPlaying ? "animate-pulse" : ""}`} />
              {isPlaying ? "Pause Music" : "Play Music"}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
