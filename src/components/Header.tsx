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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/12 bg-[#071521]/95 text-white shadow-[0_8px_30px_rgba(7,21,33,0.16)] backdrop-blur-lg">
      <audio ref={audioRef} loop preload="none">
        <source src="/audio/ambient.mp3" type="audio/mpeg" />
      </audio>

      <div className="mx-auto flex h-[4.5rem] max-w-screen-xl items-center justify-between gap-3 px-4 sm:px-6 md:h-20 lg:px-12">
        <Link className="group flex min-w-0 items-center gap-2.5" href="/" onClick={closeMenu}>
          <Image
            alt="L.I.F.E. Ministry"
            className="size-10 shrink-0 rounded-xl ring-1 ring-white/15"
            height={40}
            priority
            src="/logo-water-cross.png"
            width={40}
          />
          <span className="truncate font-display text-xl font-black tracking-tight sm:text-2xl">
            L.I.F.E.<span className="hidden sm:inline"> Ministry</span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <Link className="text-sm font-bold text-white/72 transition-colors hover:text-white" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button
            aria-label={isPlaying ? "Pause ambient music" : "Play ambient music"}
            className={`hidden size-11 items-center justify-center rounded-full transition-colors md:flex ${isPlaying ? "bg-[#e4b75d] text-[#071521]" : "text-white/65 hover:bg-white/10 hover:text-white"}`}
            onClick={togglePlay}
            title={isPlaying ? "Pause music" : "Play ambient music"}
            type="button"
          >
            <Music className={`size-4 ${isPlaying ? "animate-pulse" : ""}`} />
          </button>

          <Link className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#e4b75d] px-4 text-sm font-black text-[#071521] transition-colors hover:bg-[#f4d690] sm:px-5" href="/watch">
            <span className="sm:hidden">Join</span>
            <span className="hidden sm:inline">Join / Watch</span>
          </Link>

          <button
            aria-controls="mobile-navigation"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="flex size-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 lg:hidden"
            onClick={() => setIsMenuOpen((open) => !open)}
            type="button"
          >
            {isMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t border-white/12 bg-[#071521] lg:hidden" id="mobile-navigation">
          <nav aria-label="Mobile navigation" className="mx-auto grid max-w-screen-xl gap-1 px-4 py-4 sm:px-6">
            {[...navLinks, ...mobileOnlyLinks].map((link) => (
              <Link
                className="flex min-h-12 items-center rounded-xl px-4 text-base font-bold text-white/78 transition-colors hover:bg-white/8 hover:text-white"
                href={link.href}
                key={link.href}
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            ))}
            <button
              className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-left text-base font-bold text-white/78 transition-colors hover:bg-white/8 hover:text-white md:hidden"
              onClick={togglePlay}
              type="button"
            >
              <Music className={`size-5 ${isPlaying ? "animate-pulse text-[#e4b75d]" : ""}`} />
              {isPlaying ? "Pause background music" : "Play background music"}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
