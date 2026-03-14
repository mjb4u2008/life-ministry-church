"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

function useCountdown() {
  const getNext = () => {
    const now = new Date();
    const sunday = new Date(now);
    sunday.setHours(11, 30, 0, 0); // 11:30 AM EST = 8:30 AM PST
    const day = now.getDay();
    const daysUntil = day === 0 && now < sunday ? 0 : (7 - day) % 7 || 7;
    sunday.setDate(now.getDate() + daysUntil);
    return sunday;
  };

  const [target] = useState(getNext);
  const [diff, setDiff] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const ms = target.getTime() - Date.now();
      if (ms <= 0) {
        setDiff({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }
      const s = Math.floor(ms / 1000);
      setDiff({
        d: Math.floor(s / 86400),
        h: Math.floor((s % 86400) / 3600),
        m: Math.floor((s % 3600) / 60),
        s: s % 60,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return diff;
}

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const countdown = useCountdown();

  const slides = useMemo(
    () => [
      {
        title: "Community Groups",
        content:
          "Connect with others and grow your faith in a welcoming small group setting.",
        bold: "Join a group near you and experience life-changing community.",
        link: "/connect",
        linkText: "Learn More",
      },
      {
        title: "Sunday Worship",
        content:
          "Experience powerful worship, relevant teaching, and genuine community every Sunday.",
        bold: "Sundays at 8:30 AM PST / 11:30 AM EST - Join us in person or online.",
        link: "/watch",
        linkText: "Learn More",
      },
      {
        title: "Prayer Wall",
        content:
          "Share your prayer requests and let our community lift you up in prayer.",
        bold: "Every request is seen, every prayer is heard.",
        link: "/connect",
        linkText: "Learn More",
      },
      {
        title: "Youth Ministry",
        content:
          "Leading our youth to love and follow Jesus through engaging programs and mentorship.",
        bold: "A safe place for the next generation to grow in faith.",
        link: "/about",
        linkText: "Learn More",
      },
      {
        title: "Serve Team",
        content:
          "Use your gifts and talents to make a difference in our church and community.",
        bold: "There is a place for you on our team. Everyone has a role to play.",
        link: "/connect",
        linkText: "Learn More",
      },
    ],
    []
  );

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Parallax ocean gradient (desktop only)
      ScrollTrigger.matchMedia({
        "(min-width: 768px)": function () {
          gsap.to(".ocean-glow", {
            yPercent: -60,
            ease: "none",
            scrollTrigger: {
              trigger: ".intro",
              scrub: 1,
            },
          });
          gsap.to(".watch-box", {
            yPercent: 25,
            ease: "none",
            scrollTrigger: {
              trigger: ".watch",
              scrub: 1,
            },
          });
          gsap.to(".watch-heading", {
            yPercent: 50,
            ease: "none",
            scrollTrigger: {
              trigger: ".watch",
              scrub: 1,
            },
          });
        },
      });

      // Scripture accent line
      gsap.to(".creed-accent", {
        scaleY: 1.5,
        ease: "none",
        scrollTrigger: {
          trigger: ".creed",
          scrub: 1,
        },
      });

      // Take heading shifts left (desktop only)
      ScrollTrigger.matchMedia({
        "(min-width: 1024px)": function () {
          gsap.to(".take-heading", {
            xPercent: -8,
            ease: "none",
            scrollTrigger: {
              trigger: ".take",
              scrub: 1,
            },
          });
        },
      });

      // Hero fade-in on load
      gsap.from(".hero-title", {
        opacity: 0,
        y: 60,
        duration: 1,
        ease: "power3.out",
        delay: 0.1,
      });
      gsap.from(".hero-subtitle", {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.4,
      });
      gsap.from(".hero-line", {
        scaleX: 0,
        duration: 1.2,
        ease: "power3.out",
        delay: 0.3,
        transformOrigin: "left center",
      });
      gsap.from(".hero-meta", {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: "power2.out",
        delay: 0.7,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Auto-rotate slides
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const marqueeWords = Array.from({ length: 8 }, () => "LORD IS FOREVER EMMANUEL");

  return (
    <div ref={containerRef}>
      {/* ========================================
          1. HERO — BOLD MAGAZINE COVER
          ======================================== */}
      <header
        className="relative min-h-screen flex flex-col justify-center overflow-hidden"
        style={{ background: "#fafcff" }}
      >
        <div className="container mx-auto px-6 md:px-12 max-w-screen-2xl relative z-10">
          {/* Spacer for header nav */}
          <div className="h-20" />

          {/* MASSIVE "LIFE" */}
          <h1
            className="hero-title font-display uppercase gpu leading-[0.85] tracking-tight"
            style={{
              fontSize: "clamp(6rem, 20vw, 22rem)",
              fontWeight: 900,
              color: "#0a1a2f",
            }}
          >
            LIFE
          </h1>

          {/* Subtitle */}
          <p
            className="hero-subtitle mt-4 md:mt-6 font-body font-semibold text-xl md:text-2xl lg:text-3xl uppercase gpu"
            style={{ letterSpacing: "0.15em", color: "#4a6580" }}
          >
            Lord Is Forever Emmanuel
          </p>

          {/* Gradient line */}
          <div
            className="hero-line mt-6 h-[3px] w-48 md:w-80 gpu"
            style={{
              background: "linear-gradient(90deg, #1a6fb5, #00d4ff, transparent)",
            }}
          />

          {/* Meta info + Video */}
          <div className="hero-meta mt-8 md:mt-12 max-w-3xl">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mb-6">
              <span className="text-sm uppercase tracking-[0.12em] font-body font-semibold" style={{ color: "#4a6580" }}>
                Join our next service
              </span>
              <span className="hidden sm:block w-px h-4 bg-[#c8dded]" />
              <span className="text-sm uppercase tracking-[0.1em] font-body font-bold" style={{ color: "#0a1a2f" }}>
                The Latest Message: Sunday Worship
              </span>
            </div>

            {/* Video Thumbnail */}
            <a className="relative flex items-center justify-center video-link group" href="/watch">
              <svg
                className="absolute z-10 opacity-90 group-hover:opacity-100 transition-opacity"
                width="100"
                height="68"
                viewBox="0 0 120 80"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="120" height="80" rx="12" fill="white" fillOpacity="0.95" />
                <path d="M80 40L50 57.3205V22.6795L80 40Z" fill="#0a1a2f" />
              </svg>
              <div className="w-full aspect-video bg-gradient-to-br from-[#dce8f2] to-[#b8d0e4] rounded-2xl flex items-center justify-center shadow-[0_8px_40px_rgba(26,111,181,0.12)] overflow-hidden">
                <span className="text-[#4a6580] text-sm tracking-wide font-body">Latest Sermon Thumbnail</span>
              </div>
            </a>
          </div>
        </div>
      </header>

      {/* Marquee - Desktop only */}
      <div className="hidden lg:block">
        <div className="relative z-10">
          {/* Top marquee */}
          <div className="relative font-body font-bold uppercase tracking-[0.2em] text-sm marquee-container bg-[#f0f4f8] border-t border-b border-[#c8dded]">
            <div className="flex justify-between marquee" style={{ color: "rgba(26,111,181,0.35)" }}>
              {marqueeWords.map((word, i) => (
                <span key={`t1-${i}`} className="mx-6">{word}</span>
              ))}
            </div>
            <div className="flex justify-between marquee marquee2" style={{ color: "rgba(26,111,181,0.35)" }}>
              {marqueeWords.map((word, i) => (
                <span key={`t2-${i}`} className="mx-6">{word}</span>
              ))}
            </div>
            <div className="flex justify-between marquee marquee3" style={{ color: "rgba(26,111,181,0.35)" }}>
              {marqueeWords.map((word, i) => (
                <span key={`t3-${i}`} className="mx-6">{word}</span>
              ))}
            </div>
          </div>
          {/* Bottom marquee */}
          <div className="relative font-body font-bold uppercase tracking-[0.2em] text-sm marquee-container bg-[#0a1a2f]">
            <div className="flex justify-between marquee" style={{ color: "rgba(255,255,255,0.25)" }}>
              {marqueeWords.map((word, i) => (
                <span key={`b1-${i}`} className="mx-6">{word}</span>
              ))}
            </div>
            <div className="flex justify-between marquee marquee2" style={{ color: "rgba(255,255,255,0.25)" }}>
              {marqueeWords.map((word, i) => (
                <span key={`b2-${i}`} className="mx-6">{word}</span>
              ))}
            </div>
            <div className="flex justify-between marquee marquee3" style={{ color: "rgba(255,255,255,0.25)" }}>
              {marqueeWords.map((word, i) => (
                <span key={`b3-${i}`} className="mx-6">{word}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================
          WAVE TRANSITION: Hero -> Mission
          ======================================== */}
      <div className="relative h-16 overflow-hidden" style={{ background: "#fafcff" }}>
        <div className="wave-layer wave-layer-1" style={{ bottom: 0 }} />
        <div className="wave-layer wave-layer-2" style={{ bottom: "-20%" }} />
        <div className="wave-layer wave-layer-3" style={{ bottom: "-10%" }} />
      </div>

      {/* ========================================
          2. MISSION SECTION
          ======================================== */}
      <section className="relative flex flex-col items-center justify-between py-32 md:py-40 lg:flex-row intro bg-bg">
        <div className="container mx-auto px-6 md:px-12 max-w-screen-xl relative grid gap-16 md:grid-cols-2">
          <div>
            <div className="relative z-10 flex items-center w-full">
              <h3 className="inline-flex flex-auto w-full mr-2 uppercase text-xl font-display font-extrabold tracking-[0.1em]" style={{ color: "#0a1a2f" }}>
                Our Mission
              </h3>
              <div className="w-full h-[3px] bg-gradient-to-r from-[#1a6fb5] to-[#00d4ff] rounded-full" />
            </div>
          </div>
          <div className="relative z-10 flex-auto">
            <p className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-snug" style={{ color: "#0a1a2f" }}>
              So that people far from God can experience{" "}
              <span className="text-gradient-water">new life</span> in
              Jesus
            </p>
          </div>
          {/* Parallax gradient element */}
          <div className="absolute w-2/3 ocean-glow top-[-3rem] sm:top-[-6rem] md:top-auto gpu">
            <div className="w-full h-48 md:h-64 bg-gradient-to-r from-[#b8d0e4] via-[#8bb8d8] to-[#5c9ec8] rounded-2xl opacity-30" />
          </div>
        </div>
      </section>

      {/* ========================================
          WAVE TRANSITION: Mission -> Photos
          ======================================== */}
      <div className="relative h-16 overflow-hidden" style={{ background: "#0a1a2f" }}>
        <div className="wave-layer wave-layer-1" style={{ top: 0, borderRadius: "0 0 1000% 1000%", background: "#fafcff", opacity: 0.6 }} />
        <div className="wave-layer wave-layer-2" style={{ top: "-20%", borderRadius: "0 0 1000% 1000%", background: "#f0f4f8", opacity: 0.4 }} />
        <div className="wave-layer wave-layer-3" style={{ top: "-10%", borderRadius: "0 0 1000% 1000%", background: "#fafcff", opacity: 0.2 }} />
      </div>

      {/* ========================================
          3. JOIN US LIVE / PHOTO GRID
          ======================================== */}
      <section style={{ background: "#0a1a2f" }}>
        <div className="max-w-screen-xl mx-auto">
          <div className="relative p-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {/* JOIN US LIVE text card */}
              <div className="flex flex-col justify-end p-8">
                <h3
                  className="mb-6 text-5xl md:text-6xl font-display uppercase text-white tracking-tight"
                  style={{ fontWeight: 900 }}
                >
                  Join Us<br />Live
                </h3>
                {/* Countdown Timer */}
                <div className="mb-4">
                  <div className="flex gap-3 mb-3">
                    {[
                      { val: countdown.d, label: "DAYS" },
                      { val: countdown.h, label: "HRS" },
                      { val: countdown.m, label: "MIN" },
                      { val: countdown.s, label: "SEC" },
                    ].map((unit) => (
                      <div key={unit.label} className="text-center">
                        <div className="text-2xl md:text-3xl font-body font-black text-white countdown-pulse">
                          {String(unit.val).padStart(2, "0")}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-[#7a9ab4] font-body font-semibold">
                          {unit.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-sm font-body font-semibold text-[#7a9ab4] uppercase tracking-wider mb-1">
                  Every Sunday &mdash; 8:30 AM PST / 11:30 AM EST
                </p>
                <p className="text-sm font-body text-[#7a9ab4] mb-1">
                  <span className="font-bold text-white">Next Topic:</span> Walking in the Spirit
                </p>
                <p className="text-sm font-body text-[#7a9ab4] mb-6">
                  <span className="font-bold text-white">Scripture:</span> Galatians 5:16-25
                </p>
                <a
                  href="https://meet.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-center px-6 py-3 bg-[#1a6fb5] text-white font-body font-bold text-sm uppercase tracking-[0.08em] rounded-xl hover:bg-[#145a94] transition-colors"
                >
                  Join on Google Meet
                </a>
              </div>
              {/* Photo placeholder 1 */}
              <div className="aspect-square bg-gradient-to-br from-[#1a3d5c] to-[#0a1a2f] flex items-center justify-center max-h-[416px] rounded-lg overflow-hidden">
                <span className="text-[#4a6580] text-sm tracking-wide font-body">Community Photo</span>
              </div>
              {/* Photo placeholder 2 */}
              <div className="hidden sm:flex aspect-square bg-gradient-to-br from-[#1e4a6e] to-[#0f3555] items-center justify-center max-h-[416px] rounded-lg overflow-hidden">
                <span className="text-[#4a6580] text-sm tracking-wide font-body">Worship Photo</span>
              </div>

              {/* Welcome card */}
              <div className="flex flex-col justify-end p-8 bg-[#f0f4f8] rounded-2xl">
                <h4 className="text-3xl font-display mb-2" style={{ fontWeight: 800, color: "#0a1a2f" }}>
                  We&apos;re glad <br /> you&apos;re here!
                </h4>
                <p className="mb-6 font-body text-sm leading-relaxed" style={{ color: "#4a6580" }}>
                  Come as you are and worship with us. Everyone is welcome at
                  L.I.F.E. Ministry.
                </p>
                <Link
                  href="/about"
                  className="gc-button inline-block text-center"
                >
                  Learn More
                </Link>
              </div>
              {/* Photo placeholder 3 */}
              <div className="hidden sm:flex aspect-square bg-gradient-to-br from-[#163a58] to-[#0a263d] items-center justify-center max-h-[416px] rounded-lg overflow-hidden">
                <span className="text-[#4a6580] text-sm tracking-wide font-body">Family Photo</span>
              </div>
              {/* Photo placeholder 4 */}
              <div className="hidden sm:flex aspect-square bg-gradient-to-br from-[#1a3d5c] to-[#0a1a2f] items-center justify-center max-h-[416px] rounded-lg overflow-hidden">
                <span className="text-[#4a6580] text-sm tracking-wide font-body">Fellowship Photo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          WAVE TRANSITION: Photos -> Watch
          ======================================== */}
      <div className="relative h-16 overflow-hidden bg-bg">
        <div className="wave-layer wave-layer-1" style={{ top: 0, borderRadius: "0 0 1000% 1000%", background: "#0a1a2f", opacity: 0.5 }} />
        <div className="wave-layer wave-layer-2" style={{ top: "-20%", borderRadius: "0 0 1000% 1000%", background: "#0a1a2f", opacity: 0.3 }} />
        <div className="wave-layer wave-layer-3" style={{ top: "-10%", borderRadius: "0 0 1000% 1000%", background: "#0a1a2f", opacity: 0.15 }} />
      </div>

      {/* ========================================
          4. WATCH SECTION — Clean two-column
          ======================================== */}
      <section className="py-32 md:py-40 overflow-x-hidden watch bg-bg">
        <div className="container mx-auto px-6 md:px-12 max-w-screen-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Left: MASSIVE heading */}
            <div>
              <h3
                className="watch-heading gpu font-display uppercase tracking-tight"
                style={{ fontSize: "clamp(3rem, 8vw, 7rem)", fontWeight: 900, color: "#0a1a2f", lineHeight: 0.95 }}
              >
                Watch<br />Online
              </h3>
            </div>
            {/* Right: Video placeholder */}
            <div className="relative">
              <div className="absolute top-[-1rem] left-[-1rem] md:top-[-2rem] md:left-[-2rem] h-[50%] w-[80%] bg-[#f0f4f8] rounded-2xl watch-box gpu" />
              <div className="relative z-10">
                <div className="w-full aspect-video bg-gradient-to-br from-[#dce8f2] to-[#b8d0e4] rounded-2xl flex items-center justify-center shadow-[0_8px_40px_rgba(26,111,181,0.12)]">
                  <span className="text-[#4a6580] text-sm tracking-wide font-body">
                    Worship Service Image
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Service times and button */}
          <div className="flex flex-col mt-12 md:items-center md:flex-row">
            <div className="flex-auto mr-4">
              <span className="inline-block w-full text-lg uppercase md:text-xl lg:text-2xl tracking-[0.08em] font-body font-bold" style={{ color: "#4a6580" }}>
                Join Us Live
              </span>
              <span className="inline-block w-full mt-1 text-3xl md:text-4xl font-display" style={{ fontWeight: 800, color: "#0a1a2f" }}>
                Sundays: 8:30 AM PST / 11:30 AM EST
              </span>
            </div>
            <div className="mt-6 md:mt-0 min-w-[8rem] md:text-right flex flex-col">
              <Link
                href="/watch"
                className="inline-block text-center px-8 py-4 bg-[#1a6fb5] text-white font-body font-bold text-sm uppercase tracking-[0.08em] rounded-xl hover:bg-[#0a1a2f] transition-colors"
              >
                Watch Live
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          5. SCRIPTURE / CREED — BOLD
          ======================================== */}
      <section className="relative py-32 md:py-40 overflow-hidden bg-[#f0f4f8] creed">
        <div className="container mx-auto px-6 md:px-12 max-w-screen-xl flex flex-col items-start justify-center py-12">
          {/* Solid left border accent */}
          <div className="flex items-stretch gap-8 md:gap-12">
            <div
              className="creed-accent gpu w-[4px] md:w-[6px] rounded-full flex-shrink-0"
              style={{ background: "linear-gradient(180deg, #1a6fb5, #00d4ff)" }}
            />
            <div className="flex-col">
              <div
                className="relative z-10 text-5xl md:text-6xl lg:text-7xl uppercase font-display leading-[1.05]"
                style={{ fontWeight: 800, color: "#0a1a2f" }}
              >
                Therefore, since we have such a hope, we are very bold.
              </div>
              <div
                className="relative z-10 inline-block px-6 py-3 mt-8 text-white rounded-lg font-body font-bold text-sm tracking-[0.08em]"
                style={{ background: "#1a6fb5" }}
              >
                2 Corinthians 3:12
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          6. TAKE ME TO — BOLD CARDS
          ======================================== */}
      <section className="py-32 md:py-40 take bg-bg">
        <div className="container mx-auto px-6 md:px-12 max-w-screen-xl">
          <div className="flex flex-col items-center mb-12 lg:flex-row lg:mb-0">
            <h3
              className="mb-10 lg:ml-16 take-heading gpu text-6xl md:text-7xl lg:text-8xl font-display uppercase tracking-tight"
              style={{ fontWeight: 900, color: "#0a1a2f" }}
            >
              Take Me To:
            </h3>
            <svg
              className="ml-auto"
              width="60"
              height="31"
              viewBox="0 0 60 31"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18.1624 3.25439L15 0.092041L0 15.092L15 30.092L18.1624 26.9297L8.56116 17.3286H60V12.8555H8.56116L18.1624 3.25439Z"
                fill="#1a6fb5"
              />
            </svg>
          </div>
          <ul className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {[
              {
                title: "Prayer\nWall",
                desc: "Share your requests and let our community lift you up.",
                href: "/connect",
              },
              {
                title: "Watch\nOnline",
                desc: "Experience worship from anywhere, anytime.",
                href: "/watch",
              },
              {
                title: "Testimonies",
                desc: "Read stories of God's faithfulness in our community.",
                href: "/testimonies",
              },
              {
                title: "Ask The\nWord",
                desc: "Get biblical answers to your questions.",
                href: "/ask",
              },
            ].map((item, index) => (
              <li key={index}>
                <Link
                  href={item.href}
                  className="inline-block h-full p-6 md:p-8 transition-all duration-300 bg-[#f0f4f8] hover:bg-[#dce8f2] rounded-2xl hover:-translate-y-3 shadow-[0_2px_15px_rgba(26,111,181,0.06)] hover:shadow-[0_12px_40px_rgba(26,111,181,0.14)] border-t-[3px] border-[#1a6fb5]"
                >
                  <span
                    className="inline-block mb-6 text-4xl md:text-5xl leading-[1.1] uppercase font-display whitespace-pre-line"
                    style={{ fontWeight: 900, color: "#0a1a2f" }}
                  >
                    {item.title}
                  </span>
                  <div className="text-sm font-body leading-relaxed" style={{ color: "#4a6580" }}>
                    <p>{item.desc}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ========================================
          7. WHAT WE HAVE GOING ON / SLIDER — FIXED
          ======================================== */}
      <section className="relative bg-bg">
        <div className="pt-16 pb-20 overflow-hidden lg:pt-24 lg:pb-32 slide-section">
          <div className="container mx-auto px-6 md:px-12 max-w-screen-xl flex flex-col gap-4 lg:gap-16 lg:flex-row">
            {/* Heading */}
            <div className="relative lg:ml-auto">
              <h3
                className="text-6xl font-display text-center uppercase lg:text-right lg:text-7xl tracking-tight"
                style={{ fontWeight: 900, color: "#0a1a2f" }}
              >
                What
                <br className="hidden lg:inline-block" /> We
                <br className="hidden lg:inline-block" /> Have
                <br /> Going
                <br className="hidden lg:inline-block" /> On.
              </h3>
            </div>
            {/* Carousel */}
            <div className="lg:w-1/2 relative">
              {/* Navigation arrows */}
              <div className="flex justify-center gap-4 mb-4 lg:mb-0 lg:absolute lg:top-[-4rem] lg:right-0 z-10">
                <button
                  className="rounded-full border-2 border-[#1a6fb5] min-h-[52px] min-w-[52px] flex items-center justify-center text-[#1a6fb5] hover:bg-[#1a6fb5] hover:text-white transition-colors"
                  onClick={() =>
                    setActiveSlide(
                      (prev) =>
                        (prev - 1 + slides.length) % slides.length
                    )
                  }
                  aria-label="Previous slide"
                >
                  <svg
                    className="h-4"
                    viewBox="0 0 31 31"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18.6624 3.66236L15.5 0.500003L0.499997 15.5L15.5 30.5L18.6623 27.3376L9.06115 17.7365L30.5 17.7365L30.5 13.2635L9.06115 13.2635L18.6624 3.66236Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
                <button
                  className="rounded-full border-2 border-[#1a6fb5] min-h-[52px] min-w-[52px] flex items-center justify-center text-[#1a6fb5] hover:bg-[#1a6fb5] hover:text-white transition-colors"
                  onClick={() =>
                    setActiveSlide((prev) => (prev + 1) % slides.length)
                  }
                  aria-label="Next slide"
                >
                  <svg
                    className="h-4"
                    viewBox="0 0 31 31"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12.3376 27.3376L15.5 30.5L30.5 15.5L15.5 0.499999L12.3376 3.66235L21.9388 13.2635L0.500002 13.2635L0.500001 17.7365L21.9388 17.7365L12.3376 27.3376Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>

              {/* Slide cards — FIXED: only active visible */}
              <div className="relative h-[28rem] overflow-hidden">
                {slides.map((slide, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                      index === activeSlide
                        ? "opacity-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 translate-y-full pointer-events-none"
                    }`}
                  >
                    <div className="flex flex-col h-full px-10 py-10 text-left bg-[#f0f4f8] rounded-2xl lg:p-10">
                      <h4
                        className="text-4xl md:text-5xl uppercase font-display mb-4"
                        style={{ fontWeight: 800, color: "#0a1a2f" }}
                      >
                        {slide.title}
                      </h4>
                      <div className="max-w-md text-base font-body leading-relaxed" style={{ color: "#4a6580" }}>
                        <p>{slide.content}</p>
                        {slide.bold && (
                          <p className="mt-3">
                            <strong style={{ color: "#0a1a2f" }}>{slide.bold}</strong>
                          </p>
                        )}
                      </div>
                      <div className="mt-auto">
                        <div className="flex justify-between py-2 items-center" style={{ color: "#1a6fb5" }}>
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M9.47011 21.4701L12 24L24 12L12 0L9.47011 2.52989L17.151 10.2108L0 10.2108L0 13.7892L17.151 13.7892L9.47011 21.4701Z"
                              fill="currentColor"
                            />
                          </svg>
                          <Link
                            href={slide.link}
                            className="inline-block font-body font-bold hover:opacity-70 transition-opacity"
                            style={{ color: "#1a6fb5" }}
                          >
                            {slide.linkText}
                          </Link>
                        </div>
                        <div className="w-full border-2 rounded-full" style={{ borderColor: "rgba(26,111,181,0.3)" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:inline-block w-[128px]" />
          </div>
        </div>
      </section>

      {/* ========================================
          8. STAY CONNECTED — Newsletter
          ======================================== */}
      <section className="relative">
        <div className="py-32 md:py-40" style={{ background: "#0a1a2f" }}>
          <div className="container mx-auto px-6 md:px-12 max-w-3xl">
            <div className="relative z-10 p-8 md:p-14 bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.2)]">
              <h4
                className="uppercase font-display text-3xl md:text-4xl mb-2 tracking-tight"
                style={{ fontWeight: 900, color: "#0a1a2f" }}
              >
                Stay Connected
              </h4>
              <p className="font-body text-base mb-8" style={{ color: "#4a6580" }}>
                Get notified before each service. Stay in the loop with L.I.F.E. Ministry.
              </p>
              <form
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                onSubmit={(e) => e.preventDefault()}
              >
                <label className="inline-block w-full col-span-1">
                  <span className="inline-block mb-2 text-xs font-body font-bold uppercase tracking-[0.1em]" style={{ color: "#4a6580" }}>
                    First Name
                  </span>
                  <input
                    className="w-full border-2 border-[#c8dded] focus:border-[#1a6fb5] p-3 bg-transparent rounded-lg outline-none transition-colors font-body"
                    style={{ color: "#0a1a2f" }}
                    type="text"
                    placeholder="Alex"
                  />
                </label>
                <label className="inline-block w-full col-span-1">
                  <span className="inline-block mb-2 text-xs font-body font-bold uppercase tracking-[0.1em]" style={{ color: "#4a6580" }}>
                    Last Name
                  </span>
                  <input
                    className="w-full border-2 border-[#c8dded] focus:border-[#1a6fb5] p-3 bg-transparent rounded-lg outline-none transition-colors font-body"
                    style={{ color: "#0a1a2f" }}
                    type="text"
                    placeholder="Smith"
                  />
                </label>
                <label className="inline-block w-full col-span-1">
                  <span className="inline-block mb-2 text-xs font-body font-bold uppercase tracking-[0.1em]" style={{ color: "#4a6580" }}>
                    Email
                  </span>
                  <input
                    type="email"
                    className="w-full border-2 border-[#c8dded] focus:border-[#1a6fb5] p-3 bg-transparent rounded-lg outline-none transition-colors font-body"
                    style={{ color: "#0a1a2f" }}
                    placeholder="alex@email.com"
                  />
                </label>
                <div className="col-span-1 flex items-end">
                  <button
                    type="submit"
                    className="w-full p-3 text-sm uppercase font-body font-bold tracking-[0.08em] text-white rounded-lg hover:opacity-90 transition-opacity"
                    style={{ background: "#1a6fb5" }}
                  >
                    Get Notified Before Each Service
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
