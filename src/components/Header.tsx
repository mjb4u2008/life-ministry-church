"use client";

import Link from "next/link";
import { useState } from "react";
import { LiveIndicator } from "./LiveIndicator";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/watch", label: "Watch" },
  { href: "/connect", label: "Prayer Wall" },
  { href: "/ask", label: "Ask The Word" },
  { href: "/give", label: "Give" },
  { href: "/about", label: "What is L.I.F.E.?" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-warm-gray-light/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-full bg-terracotta flex items-center justify-center">
              <span className="text-white font-display text-lg font-semibold">L</span>
            </div>
            <span className="font-display text-xl md:text-2xl font-semibold text-charcoal group-hover:text-terracotta">
              L.I.F.E. Ministry
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-charcoal-light hover:text-terracotta font-medium text-sm tracking-wide uppercase"
              >
                {link.label}
              </Link>
            ))}
            <LiveIndicator />
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-charcoal hover:text-terracotta"
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

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-warm-gray-light/20 animate-fade-in">
          <nav className="px-4 py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="block text-charcoal hover:text-terracotta font-medium text-sm tracking-wide uppercase py-2"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2">
              <LiveIndicator />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
