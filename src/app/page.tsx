"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
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
      bold: "Sundays at 10:00 AM EST - Join us in person or online.",
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
  ];

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
            yPercent: 100,
            ease: "none",
            scrollTrigger: {
              trigger: ".watch",
              scrub: 1,
            },
          });
        },
      });

      // Watch circle rotates
      gsap.to(".watch-circle", {
        rotation: 180,
        ease: "none",
        scrollTrigger: {
          trigger: ".watch",
          scrub: 1,
        },
      });

      // Creed frame shifts right
      gsap.to(".creed-frame", {
        xPercent: 25,
        ease: "none",
        scrollTrigger: {
          trigger: ".creed",
          scrub: 1,
        },
      });

      // Creed illustration shifts right
      gsap.to(".creed-illustration", {
        xPercent: 10,
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
        y: 40,
        duration: 1.2,
        ease: "power2.out",
        delay: 0.3,
      });
      gsap.from(".hero-subtitle", {
        opacity: 0,
        y: 20,
        duration: 1,
        ease: "power2.out",
        delay: 0.7,
      });
      gsap.from(".hero-line", {
        scaleX: 0,
        duration: 1.4,
        ease: "power2.out",
        delay: 0.5,
        transformOrigin: "left center",
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
      {/* SVG Water Ripple Filter — invisible, used by hero logo */}
      <svg
        style={{ position: "absolute", width: 0, height: 0 }}
        aria-hidden="true"
      >
        <filter id="water-ripple">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.01 0.09"
            numOctaves={3}
            result="turbulence"
          >
            <animate
              attributeName="baseFrequency"
              dur="4s"
              values="0.01 0.09;0.02 0.13;0.01 0.09"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="turbulence"
            scale={12}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      {/* ========================================
          1. HERO
          ======================================== */}
      <header className="relative pt-6 overflow-hidden" style={{ background: "linear-gradient(180deg, #fafcff 0%, #edf4f9 100%)" }}>
        {/* Floating water particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="water-particle animate-float-particle w-2 h-2 top-[20%] left-[10%] opacity-40" />
          <div className="water-particle animate-float-particle animation-delay-500 w-3 h-3 top-[40%] left-[25%] opacity-30" />
          <div className="water-particle animate-float-particle-slow w-1.5 h-1.5 top-[60%] left-[70%] opacity-50" />
          <div className="water-particle animate-float-particle animation-delay-1000 w-2 h-2 top-[30%] left-[80%] opacity-35" />
          <div className="water-particle animate-float-particle-slow animation-delay-1500 w-2.5 h-2.5 top-[50%] left-[50%] opacity-25" />
          <div className="water-particle animate-float-particle animation-delay-2000 w-1.5 h-1.5 top-[75%] left-[15%] opacity-45" />
          <div className="water-particle animate-float-particle-slow animation-delay-3000 w-2 h-2 top-[15%] left-[60%] opacity-30" />
        </div>

        <div className="container mx-auto px-4 max-w-screen-xl relative z-10">
          <div className="h-16" />

          {/* Logo with water ripple + radial glow */}
          <div className="flex flex-col items-center text-center mb-12">
            {/* Radial glow behind logo */}
            <div className="relative mb-8">
              <div
                className="absolute inset-0 -m-12 rounded-full animate-pulse"
                style={{
                  background: "radial-gradient(circle, rgba(0,212,255,0.15) 0%, rgba(45,122,181,0.08) 40%, transparent 70%)",
                  animationDuration: "4s",
                }}
              />
              <Image
                src="/logo-water-cross.png"
                alt="L.I.F.E. Ministry — Water Cross"
                width={120}
                height={120}
                className="relative z-10 rounded-full"
                style={{ filter: "url(#water-ripple)" }}
                priority
              />
            </div>

            {/* Church Name */}
            <h1
              className="hero-title font-display font-light text-6xl sm:text-7xl md:text-8xl lg:text-9xl uppercase gpu"
              style={{ letterSpacing: "0.3em", color: "#0c2d48" }}
            >
              L.I.F.E.
            </h1>
            <p
              className="hero-subtitle mt-4 font-display font-light text-lg sm:text-xl md:text-2xl uppercase gpu"
              style={{ letterSpacing: "0.15em", color: "#6b8ca8" }}
            >
              Lord Is Forever Emmanuel
            </p>

            {/* Gradient line */}
            <div
              className="hero-line mt-8 h-[2px] w-48 md:w-72 gpu"
              style={{
                background: "linear-gradient(90deg, transparent, #2d7ab5, transparent)",
              }}
            />
          </div>

          {/* Latest Message */}
          <div className="relative pb-8">
            <div className="relative z-10">
              <div className="mb-3 text-sm uppercase tracking-[0.12em] text-muted font-body">
                <span className="font-semibold text-text">The Latest Message:</span>{" "}
                Sunday Worship Service
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
                  <path d="M80 40L50 57.3205V22.6795L80 40Z" fill="#0c2d48" />
                </svg>
                <div className="w-full aspect-video bg-gradient-to-br from-[#e0eef7] to-[#c8dded] rounded-2xl flex items-center justify-center shadow-[0_4px_30px_rgba(45,122,181,0.08)] overflow-hidden">
                  <span className="text-muted text-sm tracking-wide">Latest Sermon Thumbnail</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Marquee - Desktop only */}
        <div className="hidden lg:block">
          <div className="relative z-10">
            {/* Top marquee */}
            <div className="relative font-body font-medium uppercase tracking-[0.2em] text-sm marquee-container bg-surface border-t border-b border-border-light">
              <div className="flex justify-between marquee" style={{ color: "rgba(45,122,181,0.3)" }}>
                {marqueeWords.map((word, i) => (
                  <span key={`t1-${i}`} className="mx-6">{word}</span>
                ))}
              </div>
              <div className="flex justify-between marquee marquee2" style={{ color: "rgba(45,122,181,0.3)" }}>
                {marqueeWords.map((word, i) => (
                  <span key={`t2-${i}`} className="mx-6">{word}</span>
                ))}
              </div>
              <div className="flex justify-between marquee marquee3" style={{ color: "rgba(45,122,181,0.3)" }}>
                {marqueeWords.map((word, i) => (
                  <span key={`t3-${i}`} className="mx-6">{word}</span>
                ))}
              </div>
            </div>
            {/* Bottom marquee */}
            <div className="relative font-body font-medium uppercase tracking-[0.2em] text-sm marquee-container bg-deep">
              <div className="flex justify-between marquee" style={{ color: "rgba(255,255,255,0.2)" }}>
                {marqueeWords.map((word, i) => (
                  <span key={`b1-${i}`} className="mx-6">{word}</span>
                ))}
              </div>
              <div className="flex justify-between marquee marquee2" style={{ color: "rgba(255,255,255,0.2)" }}>
                {marqueeWords.map((word, i) => (
                  <span key={`b2-${i}`} className="mx-6">{word}</span>
                ))}
              </div>
              <div className="flex justify-between marquee marquee3" style={{ color: "rgba(255,255,255,0.2)" }}>
                {marqueeWords.map((word, i) => (
                  <span key={`b3-${i}`} className="mx-6">{word}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

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
      <section className="relative flex flex-col items-center justify-between py-24 md:py-32 lg:flex-row intro bg-bg">
        <div className="container mx-auto px-4 max-w-screen-xl relative grid gap-16 md:grid-cols-2">
          <div>
            <div className="relative z-10 flex items-center w-full">
              <h3 className="inline-flex flex-auto w-full mr-2 uppercase text-xl font-display font-semibold tracking-[0.1em] text-deep">
                Our Mission
              </h3>
              <div className="w-full h-[3px] bg-gradient-to-r from-primary to-cyan rounded-full" />
            </div>
          </div>
          <div className="relative z-10 flex-auto">
            <p className="text-2xl md:text-3xl lg:text-4xl font-display font-light leading-snug text-deep">
              So that people far from God can experience{" "}
              <span className="font-semibold text-gradient-water">new life</span> in
              Jesus
            </p>
          </div>
          {/* Parallax gradient element */}
          <div className="absolute w-2/3 ocean-glow top-[-3rem] sm:top-[-6rem] md:top-auto gpu">
            <div className="w-full h-48 md:h-64 bg-gradient-to-r from-[#c8dded] via-[#a3c4e0] to-[#7fb3d8] rounded-2xl opacity-40" />
          </div>
        </div>
      </section>

      {/* ========================================
          WAVE TRANSITION: Mission -> Photos
          ======================================== */}
      <div className="relative h-16 overflow-hidden bg-deep">
        <div className="wave-layer wave-layer-1" style={{ top: 0, borderRadius: "0 0 1000% 1000%", background: "#fafcff", opacity: 0.6 }} />
        <div className="wave-layer wave-layer-2" style={{ top: "-20%", borderRadius: "0 0 1000% 1000%", background: "#edf4f9", opacity: 0.4 }} />
        <div className="wave-layer wave-layer-3" style={{ top: "-10%", borderRadius: "0 0 1000% 1000%", background: "#fafcff", opacity: 0.2 }} />
      </div>

      {/* ========================================
          3. VISIT US / PHOTO GRID
          ======================================== */}
      <section className="bg-deep">
        <div className="max-w-screen-xl mx-auto">
          <div className="relative p-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {/* Visit Us text card */}
              <div className="flex items-end justify-between p-6">
                <h3 className="mb-0 text-4xl font-display font-light uppercase text-white tracking-[0.08em]">
                  Visit Us
                </h3>
                <svg
                  width="30"
                  height="120"
                  viewBox="0 0 30 120"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-cyan"
                >
                  <path
                    d="M15 0V110M15 110L5 100M15 110L25 100"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              {/* Photo placeholder 1 */}
              <div className="aspect-square bg-gradient-to-br from-[#1a3d5c] to-[#0c2d48] flex items-center justify-center max-h-[416px] rounded-lg overflow-hidden">
                <span className="text-muted text-sm tracking-wide">Community Photo</span>
              </div>
              {/* Photo placeholder 2 */}
              <div className="hidden sm:flex aspect-square bg-gradient-to-br from-[#1e4a6e] to-[#0f3555] items-center justify-center max-h-[416px] rounded-lg overflow-hidden">
                <span className="text-muted text-sm tracking-wide">Worship Photo</span>
              </div>

              {/* Welcome card */}
              <div className="flex flex-col justify-end p-6 bg-surface rounded-2xl">
                <h4 className="text-2xl font-display font-semibold mb-2 text-deep">
                  We&apos;re glad <br /> you&apos;re here!
                </h4>
                <p className="mb-6 font-body text-sm text-muted leading-relaxed">
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
                <span className="text-muted text-sm tracking-wide">Family Photo</span>
              </div>
              {/* Photo placeholder 4 */}
              <div className="hidden sm:flex aspect-square bg-gradient-to-br from-[#1a3d5c] to-[#0c2d48] items-center justify-center max-h-[416px] rounded-lg overflow-hidden">
                <span className="text-muted text-sm tracking-wide">Fellowship Photo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          WAVE TRANSITION: Photos -> Watch
          ======================================== */}
      <div className="relative h-16 overflow-hidden bg-bg">
        <div className="wave-layer wave-layer-1" style={{ top: 0, borderRadius: "0 0 1000% 1000%", background: "#0c2d48", opacity: 0.5 }} />
        <div className="wave-layer wave-layer-2" style={{ top: "-20%", borderRadius: "0 0 1000% 1000%", background: "#0c2d48", opacity: 0.3 }} />
        <div className="wave-layer wave-layer-3" style={{ top: "-10%", borderRadius: "0 0 1000% 1000%", background: "#0c2d48", opacity: 0.15 }} />
      </div>

      {/* ========================================
          4. WATCH SECTION
          ======================================== */}
      <section className="py-16 overflow-x-hidden md:py-32 watch bg-bg">
        <div className="container mx-auto px-4 max-w-screen-xl flex flex-col-reverse md:flex-row">
          <div className="relative">
            <div className="relative z-10 pl-8 md:pl-12 sm:pt-8 md:pt-12">
              {/* Overlapping heading */}
              <h3 className="watch-heading gpu relative z-10 mt-8 -mb-16 text-3xl md:text-4xl lg:text-5xl font-display font-light text-white uppercase tracking-[0.06em] md:-ml-4 md:absolute md:-mt-12 md:mb-0">
                Watch <br /> L.I.F.E. <br /> Ministry <br /> Online
              </h3>
              <div className="ml-6 sm:mt-10 sm:-mr-12 md:ml-0 md:mr-0">
                {/* Video placeholder */}
                <div className="w-full aspect-video max-w-[900px] bg-gradient-to-br from-[#e0eef7] to-[#c8dded] rounded-2xl flex items-center justify-center shadow-[0_4px_30px_rgba(45,122,181,0.08)]">
                  <span className="text-muted text-sm tracking-wide">
                    Worship Service Image
                  </span>
                </div>
              </div>
            </div>
            {/* Service times and button */}
            <div className="flex flex-col mt-8 md:items-center md:flex-row md:ml-14 lg:ml-12">
              <div className="flex-auto mr-4">
                <span className="inline-block w-full text-lg uppercase md:text-xl lg:text-2xl tracking-[0.08em] text-muted font-body">
                  Join Us Live
                </span>
                <span className="inline-block w-full mt-1 text-2xl md:text-3xl font-display font-light text-deep">
                  Sundays: 10:00 AM EST
                </span>
              </div>
              <div className="mt-6 md:mt-0 min-w-[8rem] md:text-right flex flex-col">
                <Link
                  href="/watch"
                  className="inline-block text-center px-6 py-3 bg-primary text-white font-body font-semibold text-sm uppercase tracking-[0.08em] rounded-xl hover:bg-deep transition-colors"
                >
                  Watch Live
                </Link>
              </div>
            </div>
            {/* Background box that parallaxes */}
            <div className="absolute top-0 md:top-[-1rem] left-0 h-[50%] w-full md:w-[75%] lg:w-[50%] bg-surface rounded-2xl watch-box gpu" />
          </div>
          {/* Rotating circle decoration */}
          <div className="relative z-30 flex items-center justify-center md:-ml-12 text-center h-[11rem] sm:h-[13rem] md:h-auto overflow-hidden md:overflow-visible">
            <div className="relative w-56 sm:w-80 md:w-[528px] h-56 sm:h-80 md:h-[529px] watch-circle gpu">
              <svg
                viewBox="0 0 528 529"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                <circle
                  cx="264"
                  cy="264.5"
                  r="260"
                  stroke="#2d7ab5"
                  strokeWidth="1"
                />
                <path
                  id="circlePath"
                  d="M264,4.5 a260,260 0 1,1 0,520 a260,260 0 1,1 0,-520"
                  fill="none"
                />
                <text fontSize="14" fill="#2d7ab5" fontFamily="monospace">
                  <textPath href="#circlePath">
                    WATCH ONLINE - L.I.F.E. MINISTRY - WATCH ONLINE - L.I.F.E.
                    MINISTRY -
                  </textPath>
                </text>
              </svg>
            </div>
            {/* Inner static element */}
            <div className="absolute w-12 sm:w-16 md:w-[86px] h-12 sm:h-16 md:h-[86px] flex items-center justify-center">
              <svg
                viewBox="0 0 86 86"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                <circle
                  cx="43"
                  cy="43"
                  r="40"
                  stroke="#2d7ab5"
                  strokeWidth="1"
                />
                <path
                  d="M43 15L43 71M15 43L71 43"
                  stroke="#2d7ab5"
                  strokeWidth="1"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          5. SCRIPTURE / CREED
          ======================================== */}
      <section className="relative py-24 overflow-hidden lg:py-32 bg-surface creed">
        <div className="container mx-auto px-4 max-w-screen-xl flex flex-col items-center justify-start py-12 lg:flex-row">
          {/* Decorative frame - parallaxes */}
          <div className="absolute -ml-8 opacity-40 creed-frame w-[650px] h-[385px] border-4 border-cyan pointer-events-none gpu rounded-2xl" />
          {/* Illustration placeholder - parallaxes */}
          <div className="creed-illustration gpu -mt-10 md:mt-auto mr-12 max-w-[32rem] opacity-75">
            <div className="w-64 h-32 bg-gradient-to-br from-[#c8dded] to-[#a3c4e0] rounded-2xl flex items-center justify-center">
              <span className="text-muted text-xs tracking-wide">Illustration</span>
            </div>
          </div>
          <div className="flex-col">
            <div className="relative z-10 text-4xl md:text-5xl uppercase lg:text-6xl font-display font-light leading-tight text-deep">
              Therefore, since we have such a hope, we are very bold.
            </div>
            <div className="relative z-10 inline-block px-5 py-3 mt-6 text-white bg-primary rounded-lg font-body text-sm tracking-[0.08em]">
              2 Corinthians 3:12
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          6. TAKE ME TO
          ======================================== */}
      <section className="py-24 md:py-32 take bg-bg">
        <div className="container mx-auto px-4 max-w-screen-xl">
          <div className="flex flex-col items-center mb-10 lg:flex-row lg:mb-0">
            <h3 className="mb-10 lg:ml-16 take-heading gpu text-5xl md:text-6xl font-display font-light uppercase text-deep tracking-[0.06em]">
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
                fill="#2d7ab5"
              />
            </svg>
          </div>
          <ul className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {[
              {
                title: "Youth\nMinistry",
                desc: "Leading our youth to love and follow Jesus.",
                href: "/about",
              },
              {
                title: "Community\nGroups",
                desc: "Connect with others and grow your faith in community.",
                href: "/connect",
              },
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
            ].map((item, index) => (
              <li key={index}>
                <Link
                  href={item.href}
                  className="inline-block h-full p-5 transition-all duration-300 bg-surface hover:bg-[#e0eef7] rounded-2xl hover:-translate-y-2 shadow-[0_2px_15px_rgba(45,122,181,0.05)] hover:shadow-[0_8px_30px_rgba(45,122,181,0.1)]"
                >
                  <div className="mb-4 border-2 border-primary rounded-full" />
                  <span className="inline-block mb-6 text-4xl md:text-5xl leading-[3rem] uppercase font-display font-light whitespace-pre-line text-deep">
                    {item.title}
                  </span>
                  <div className="text-sm text-muted font-body leading-relaxed">
                    <p>{item.desc}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ========================================
          7. WHAT WE HAVE GOING ON / SLIDER
          ======================================== */}
      <section className="relative bg-bg">
        <div className="pt-16 pb-20 overflow-hidden lg:pt-24 lg:pb-32 slide-section">
          <div className="container mx-auto px-4 max-w-screen-xl flex flex-col gap-4 lg:gap-16 lg:flex-row">
            {/* Heading */}
            <div className="relative lg:ml-auto">
              <h3 className="text-5xl font-display font-light text-center uppercase lg:text-right lg:text-6xl text-deep tracking-[0.04em]">
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
                  className="rounded-full border border-primary min-h-[52px] min-w-[52px] flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
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
                  className="rounded-full border border-primary min-h-[52px] min-w-[52px] flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
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

              {/* Slide cards */}
              <div className="relative h-[28rem] overflow-hidden">
                {slides.map((slide, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                      index === activeSlide
                        ? "opacity-100 translate-y-0"
                        : index ===
                          (activeSlide + 1) % slides.length
                        ? "opacity-50 translate-y-8"
                        : "opacity-0 -translate-y-full"
                    }`}
                  >
                    <div className="flex flex-col h-full px-12 py-10 text-left bg-surface rounded-2xl lg:p-10">
                      <h4 className="text-4xl uppercase font-display font-semibold mb-4 text-deep">
                        {slide.title}
                      </h4>
                      <div className="max-w-md text-base text-muted font-body leading-relaxed">
                        <p>{slide.content}</p>
                        {slide.bold && (
                          <p className="mt-3">
                            <strong className="text-text">{slide.bold}</strong>
                          </p>
                        )}
                      </div>
                      <div className="mt-auto">
                        <div className="flex justify-between py-2 items-center text-primary">
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
                            className="inline-block font-body font-medium text-primary hover:text-deep transition-colors"
                          >
                            {slide.linkText}
                          </Link>
                        </div>
                        <div className="w-full border-2 border-primary/30 rounded-full" />
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
          8. NEWSLETTER SIGNUP
          ======================================== */}
      <section className="relative">
        <div className="py-24 md:py-32 bg-deep">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="relative z-10 p-8 md:p-12 bg-surface rounded-2xl shadow-[0_4px_30px_rgba(45,122,181,0.08)]">
              <h4 className="uppercase font-display text-2xl md:text-3xl font-light mb-2 text-deep tracking-[0.06em]">
                Sign Up for News &amp; Encouragement
              </h4>
              <p className="text-muted font-body text-sm mb-8">
                Stay connected with the L.I.F.E. Ministry community.
              </p>
              <form
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                onSubmit={(e) => e.preventDefault()}
              >
                <label className="inline-block w-full col-span-1">
                  <span className="inline-block mb-2 text-xs font-body font-semibold uppercase tracking-[0.1em] text-muted">
                    First Name
                  </span>
                  <input
                    className="w-full border-2 border-primary/30 focus:border-primary p-3 bg-transparent text-text rounded-lg outline-none transition-colors font-body"
                    type="text"
                    placeholder="Alex"
                  />
                </label>
                <label className="inline-block w-full col-span-1">
                  <span className="inline-block mb-2 text-xs font-body font-semibold uppercase tracking-[0.1em] text-muted">
                    Last Name
                  </span>
                  <input
                    className="w-full border-2 border-primary/30 focus:border-primary p-3 bg-transparent text-text rounded-lg outline-none transition-colors font-body"
                    type="text"
                    placeholder="Smith"
                  />
                </label>
                <label className="inline-block w-full col-span-1">
                  <span className="inline-block mb-2 text-xs font-body font-semibold uppercase tracking-[0.1em] text-muted">
                    Email
                  </span>
                  <input
                    type="email"
                    className="w-full border-2 border-primary/30 focus:border-primary p-3 bg-transparent text-text rounded-lg outline-none transition-colors font-body"
                    placeholder="alex@email.com"
                  />
                </label>
                <div className="col-span-1 flex items-end">
                  <button
                    type="submit"
                    className="w-full p-3 text-sm uppercase font-body font-semibold tracking-[0.08em] bg-primary text-white rounded-lg hover:bg-deep transition-colors"
                  >
                    Send me Updates
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
