"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Menu, Music, X } from "lucide-react";

const navLinks = [
  { href: "/welcome", label: "I’m New" },
  { href: "/community", label: "Prayer & Care" },
  { href: "/events", label: "Events" },
  { href: "/give", label: "Give" },
];

const mobileOnlyLinks = [
  { href: "/ask", label: "Ask The Word" },
  { href: "/testimonies", label: "Testimonies" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

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

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="life-modernist fixed inset-x-0 top-0 z-50 border-b-2 border-[#201e1d] bg-[#f3f2f2] text-[#201e1d] [font-family:var(--font-archivo)]">
      <audio ref={audioRef} loop preload="none">
        <source src="/audio/ambient.mp3" type="audio/mpeg" />
      </audio>

      <div className="mx-auto flex h-[4.5rem] max-w-[90rem] items-stretch justify-between gap-3 px-4 sm:px-6 md:h-20 lg:px-10">
        <Link className="group flex min-w-0 items-center gap-3" href="/" onClick={closeMenu}>
          <Image
            alt="L.I.F.E. Ministry"
            className="size-10 shrink-0 border-2 border-[#201e1d] bg-white object-cover"
            height={40}
            priority
            src="/logo-water-cross.png"
            width={40}
          />
          <span className="truncate text-xl font-extrabold uppercase leading-none tracking-[-0.04em] sm:text-2xl">
            L.I.F.E.<span className="hidden sm:inline"> Ministry</span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-stretch lg:flex">
          {navLinks.map((link) => (
            <Link className="flex items-center border-l border-[#201e1d]/35 px-5 text-sm font-semibold text-[#201e1d] transition-colors hover:bg-[#e9eef2] hover:text-[#146fa3]" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-stretch gap-2 py-3 md:py-4">
          <button
            aria-label={isPlaying ? "Pause ambient music" : "Play ambient music"}
            className={`hidden size-11 items-center justify-center border-2 transition-colors md:flex ${isPlaying ? "border-[#146fa3] bg-[#146fa3] text-white" : "border-[#201e1d] text-[#201e1d] hover:border-[#146fa3] hover:bg-[#e9eef2] hover:text-[#146fa3]"}`}
            onClick={togglePlay}
            title={isPlaying ? "Pause music" : "Play ambient music"}
            type="button"
          >
            <Music className={`size-4 ${isPlaying ? "animate-pulse" : ""}`} />
          </button>

          <Link className="inline-flex min-h-11 items-center justify-center border-2 border-[#146fa3] bg-[#146fa3] px-4 text-sm font-extrabold text-white transition-colors hover:border-[#0b2940] hover:bg-[#0b2940] sm:px-5" href="/watch" onClick={closeMenu}>
            <span className="sm:hidden">Join</span>
            <span className="hidden sm:inline">Join / Watch</span>
          </Link>

          <button
            aria-controls="mobile-navigation"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="flex size-11 items-center justify-center border-2 border-[#201e1d] text-[#201e1d] transition-colors hover:border-[#146fa3] hover:bg-[#e9eef2] hover:text-[#146fa3] lg:hidden"
            onClick={() => setIsMenuOpen((open) => !open)}
            type="button"
          >
            {isMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t-2 border-[#201e1d] bg-[#f3f2f2] lg:hidden" id="mobile-navigation">
          <nav aria-label="Mobile navigation" className="mx-auto grid max-w-[90rem] px-4 py-3 sm:px-6">
            {[...navLinks, ...mobileOnlyLinks].map((link) => (
              <Link
                className="flex min-h-13 items-center border-b border-[#201e1d]/35 px-2 text-base font-semibold text-[#201e1d] transition-colors hover:bg-[#e9eef2] hover:text-[#146fa3]"
                href={link.href}
                key={link.href}
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            ))}
            <button
              aria-label={isPlaying ? "Pause ambient music" : "Play ambient music"}
              className="flex min-h-13 items-center gap-3 border-b border-[#201e1d]/35 px-2 text-left text-base font-semibold text-[#201e1d] transition-colors hover:bg-[#e9eef2] hover:text-[#146fa3] md:hidden"
              onClick={togglePlay}
              type="button"
            >
              <Music className={`size-5 ${isPlaying ? "animate-pulse text-[#146fa3]" : ""}`} />
              {isPlaying ? "Pause background music" : "Play background music"}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
