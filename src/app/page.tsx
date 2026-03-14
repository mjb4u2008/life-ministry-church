"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
      // Parallax sunset image (desktop only)
      ScrollTrigger.matchMedia({
        "(min-width: 768px)": function () {
          gsap.to(".sunset", {
            yPercent: -60,
            ease: "none",
            scrollTrigger: {
              trigger: ".intro",
              scrub: true,
            },
          });
          gsap.to(".watch-box", {
            yPercent: 25,
            ease: "none",
            scrollTrigger: {
              trigger: ".watch",
              scrub: true,
            },
          });
          gsap.to(".watch-heading", {
            yPercent: 100,
            ease: "none",
            scrollTrigger: {
              trigger: ".watch",
              scrub: true,
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
          scrub: true,
        },
      });

      // Creed frame shifts right
      gsap.to(".creed-frame", {
        xPercent: 25,
        ease: "none",
        scrollTrigger: {
          trigger: ".creed",
          scrub: true,
        },
      });

      // Creed illustration shifts right
      gsap.to(".creed-illustration", {
        xPercent: 10,
        ease: "none",
        scrollTrigger: {
          trigger: ".creed",
          scrub: true,
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
              scrub: true,
            },
          });
        },
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

  const marqueeWords = Array.from({ length: 12 }, (_, i) =>
    i % 2 === 0 ? "Welcome" : "Home"
  );

  return (
    <div ref={containerRef}>
      {/* ========================================
          1. HEADER / HERO AREA
          ======================================== */}
      <header className="pt-6 border-black sm:border-b-4 lg:border-0">
        {/* Heading */}
        <div className="container mx-auto px-4 max-w-screen-xl">
          <div className="h-12" />
          <div className="flex items-center">
            <h1 className="text-5xl md:text-6xl font-bold uppercase whitespace-nowrap">
              Welcome Home
            </h1>
            <div className="flex-1 ml-8 border-2 border-black" />
          </div>
          <div className="h-8" />
        </div>

        {/* Latest Message */}
        <div className="container mx-auto px-4 max-w-screen-xl">
          <div className="relative">
            <div className="relative z-10">
              {/* Message Title */}
              <div className="mb-2 text-lg uppercase">
                <span className="font-bold">The Latest Message:</span> Sunday
                Worship Service
              </div>

              {/* Video Thumbnail Placeholder */}
              <a
                className="relative flex items-center justify-center video-link"
                href="/watch"
              >
                {/* Play Button SVG */}
                <svg
                  className="absolute z-10"
                  width="120"
                  height="80"
                  viewBox="0 0 120 80"
                  fill="white"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M0 0H120V80H0V0Z" />
                  <path
                    d="M80 40L50 57.3205V22.6795L80 40Z"
                    fill="#212322"
                  />
                  <path
                    d="M0 0V-2H-2V0H0ZM120 0H122V-2H120V0ZM120 80V82H122V80H120ZM0 80H-2V82H0V80ZM0 2H120V-2H0V2ZM118 0V80H122V0H118ZM120 78H0V82H120V78ZM2 80V0H-2V80H2Z"
                    fill="#212322"
                  />
                </svg>
                {/* Placeholder image */}
                <div className="w-full aspect-video bg-neutral-200 flex items-center justify-center">
                  <span className="text-neutral-400 text-sm">
                    Latest Sermon Thumbnail
                  </span>
                </div>
              </a>
            </div>

            {/* Decorative star */}
            <div className="absolute top-[-1.5rem] left-[-2.5rem] w-[90px] h-[90px] flex items-center justify-center">
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 0L23.5 16.5L40 20L23.5 23.5L20 40L16.5 23.5L0 20L16.5 16.5L20 0Z"
                  fill="#212322"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Marquee - Desktop only */}
        <div className="hidden lg:block">
          <div className="relative z-10">
            {/* Top marquee - highlight background */}
            <div className="relative font-mono font-medium uppercase border-t border-b border-black marquee-container bg-amber-200">
              <div className="flex justify-between marquee">
                {marqueeWords.map((word, i) => (
                  <span key={`t1-${i}`} className="mx-4">
                    {word}
                  </span>
                ))}
              </div>
              <div className="flex justify-between marquee marquee2">
                {marqueeWords.map((word, i) => (
                  <span key={`t2-${i}`} className="mx-4">
                    {word}
                  </span>
                ))}
              </div>
              <div className="flex justify-between marquee marquee3">
                {marqueeWords.map((word, i) => (
                  <span key={`t3-${i}`} className="mx-4">
                    {word}
                  </span>
                ))}
              </div>
            </div>
            {/* Bottom marquee - black background */}
            <div className="relative font-mono font-medium text-white uppercase bg-black marquee-container">
              <div className="flex justify-between marquee">
                {marqueeWords.map((word, i) => (
                  <span key={`b1-${i}`} className="mx-4">
                    {word}
                  </span>
                ))}
              </div>
              <div className="flex justify-between marquee marquee2">
                {marqueeWords.map((word, i) => (
                  <span key={`b2-${i}`} className="mx-4">
                    {word}
                  </span>
                ))}
              </div>
              <div className="flex justify-between marquee marquee3">
                {marqueeWords.map((word, i) => (
                  <span key={`b3-${i}`} className="mx-4">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================
          2. MISSION SECTION
          ======================================== */}
      <section className="relative flex flex-col items-center justify-between pt-20 pb-10 md:py-24 lg:flex-row intro">
        <div className="container mx-auto px-4 max-w-screen-xl relative grid gap-16 md:grid-cols-2">
          <div>
            <div className="relative z-10 flex items-center w-full">
              <h3 className="inline-flex flex-auto w-full mr-2 uppercase text-xl font-bold">
                Our Mission
              </h3>
              <div className="w-full border-4 border-amber-300" />
            </div>
          </div>
          <div className="relative z-10 flex-auto">
            <p className="text-2xl md:text-3xl font-display leading-snug">
              So that people far from God can experience{" "}
              <span className="font-bold">new life</span> in Jesus
            </p>
          </div>
          {/* Parallax sunset placeholder */}
          <div className="absolute w-2/3 sunset top-[-3rem] sm:top-[-6rem] md:top-auto">
            <div className="w-full h-48 md:h-64 bg-gradient-to-r from-amber-200 via-orange-300 to-rose-300 rounded-lg opacity-60" />
          </div>
        </div>
      </section>

      {/* ========================================
          3. VISIT US / PHOTO GRID
          ======================================== */}
      <section className="bg-black">
        <div className="max-w-screen-xl mx-auto">
          <div className="relative p-2 bg-black">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {/* Visit Us text card */}
              <div className="flex items-end justify-between p-6">
                <h3 className="mb-0 text-4xl font-bold uppercase text-white">
                  Visit Us
                </h3>
                <svg
                  width="30"
                  height="120"
                  viewBox="0 0 30 120"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-amber-300"
                >
                  <path
                    d="M15 0V110M15 110L5 100M15 110L25 100"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              {/* Photo placeholder 1 */}
              <div className="aspect-square bg-neutral-700 flex items-center justify-center max-h-[416px]">
                <span className="text-neutral-500 text-sm">
                  Community Photo
                </span>
              </div>
              {/* Photo placeholder 2 */}
              <div className="hidden sm:flex aspect-square bg-neutral-600 items-center justify-center max-h-[416px]">
                <span className="text-neutral-400 text-sm">
                  Worship Photo
                </span>
              </div>

              {/* Welcome card */}
              <div className="flex flex-col justify-end p-6 bg-amber-100">
                <h4 className="text-2xl font-bold mb-2">
                  We&apos;re glad <br /> you&apos;re here!
                </h4>
                <p className="mb-6 font-mono text-sm">
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
              <div className="hidden sm:flex aspect-square bg-neutral-800 items-center justify-center max-h-[416px]">
                <span className="text-neutral-500 text-sm">Family Photo</span>
              </div>
              {/* Photo placeholder 4 */}
              <div className="hidden sm:flex aspect-square bg-neutral-700 items-center justify-center max-h-[416px]">
                <span className="text-neutral-400 text-sm">
                  Fellowship Photo
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          4. WATCH SECTION
          ======================================== */}
      <section className="pb-12 overflow-x-hidden md:py-24 watch">
        <div className="container mx-auto px-4 max-w-screen-xl flex flex-col-reverse md:flex-row">
          <div className="relative">
            <div className="relative z-10 pl-8 md:pl-12 sm:pt-8 md:pt-12">
              {/* Overlapping heading */}
              <h3 className="relative z-10 mt-8 -mb-16 text-3xl md:text-4xl lg:text-5xl font-bold text-white uppercase md:-ml-4 md:absolute md:-mt-12 md:mb-0 watch-heading">
                Watch <br /> L.I.F.E. <br /> Ministry <br /> Online
              </h3>
              <div className="ml-6 sm:mt-10 sm:-mr-12 md:ml-0 md:mr-0">
                {/* Video placeholder */}
                <div className="w-full aspect-video max-w-[900px] bg-neutral-200 flex items-center justify-center">
                  <span className="text-neutral-400 text-sm">
                    Worship Service Image
                  </span>
                </div>
              </div>
            </div>
            {/* Service times and button */}
            <div className="flex flex-col mt-6 md:items-center md:flex-row md:ml-14 lg:ml-12">
              <div className="flex-auto mr-4">
                <span className="inline-block w-full text-xl uppercase md:text-2xl lg:text-3xl">
                  Join Us Live
                </span>
                <span className="inline-block w-full mt-1 text-2xl md:text-3xl font-display">
                  Sundays: 10:00 AM EST
                </span>
              </div>
              <div className="mt-6 md:mt-0 min-w-[8rem] md:text-right flex flex-col">
                <Link
                  href="/watch"
                  className="gc-button inline-block text-center"
                >
                  Watch Live
                </Link>
              </div>
            </div>
            {/* Background box that parallaxes */}
            <div className="absolute top-0 md:top-[-1rem] left-0 h-[50%] w-full md:w-[75%] lg:w-[50%] bg-neutral-200 watch-box" />
          </div>
          {/* Rotating circle decoration */}
          <div className="relative z-30 flex items-center justify-center md:-ml-12 text-center h-[11rem] sm:h-[13rem] md:h-auto overflow-hidden md:overflow-visible">
            {/* Outer rotating circle */}
            <div className="relative w-56 sm:w-80 md:w-[528px] h-56 sm:h-80 md:h-[529px] watch-circle">
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
                  stroke="#212322"
                  strokeWidth="1"
                />
                {/* Decorative text around the circle */}
                <path
                  id="circlePath"
                  d="M264,4.5 a260,260 0 1,1 0,520 a260,260 0 1,1 0,-520"
                  fill="none"
                />
                <text fontSize="14" fill="#212322" fontFamily="monospace">
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
                  stroke="#212322"
                  strokeWidth="1"
                />
                <path
                  d="M43 15L43 71M15 43L71 43"
                  stroke="#212322"
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
      <section className="relative py-16 overflow-hidden lg:py-24 bg-zinc-100 creed">
        <div className="container mx-auto px-4 max-w-screen-xl flex flex-col items-center justify-start py-12 lg:flex-row">
          {/* Decorative frame - parallaxes */}
          <div className="absolute -ml-8 opacity-50 creed-frame w-[650px] h-[385px] border-4 border-amber-300 pointer-events-none" />
          {/* Illustration placeholder - parallaxes */}
          <div className="creed-illustration -mt-10 md:mt-auto mr-12 max-w-[32rem] opacity-75">
            <div className="w-64 h-32 bg-neutral-300 rounded flex items-center justify-center">
              <span className="text-neutral-500 text-xs">Illustration</span>
            </div>
          </div>
          <div className="flex-col">
            <div className="relative z-10 text-4xl md:text-5xl uppercase lg:text-6xl font-display leading-tight">
              Therefore, since we have such a hope, we are very bold.
            </div>
            <div className="relative z-10 inline-block p-4 mt-4 text-white bg-black">
              2 Corinthians 3:12
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          6. TAKE ME TO
          ======================================== */}
      <section className="py-24 take">
        <div className="container mx-auto px-4 max-w-screen-xl">
          <div className="flex flex-col items-center mb-10 lg:flex-row lg:mb-0">
            <h3 className="mb-10 lg:ml-16 take-heading text-5xl md:text-6xl font-bold uppercase">
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
                fill="#212322"
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
                  className="inline-block h-full p-4 transition-all duration-200 bg-gray-100 hover:-translate-y-2"
                >
                  <div className="mb-4 border-2 border-black" />
                  <span className="inline-block mb-6 text-4xl md:text-5xl leading-[3rem] uppercase font-display whitespace-pre-line">
                    {item.title}
                  </span>
                  <div className="text-sm">
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
      <section className="relative">
        <div className="pt-16 pb-20 overflow-hidden lg:pt-24 lg:pb-32 slide-section">
          <div className="container mx-auto px-4 max-w-screen-xl flex flex-col gap-4 lg:gap-16 lg:flex-row">
            {/* Heading */}
            <div className="relative lg:ml-auto">
              <h3 className="text-5xl font-bold text-center uppercase lg:text-right lg:text-6xl">
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
                  className="rounded-full border border-black min-h-[52px] min-w-[52px] flex items-center justify-center hover:bg-black hover:text-white transition-colors"
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
                  className="rounded-full border border-black min-h-[52px] min-w-[52px] flex items-center justify-center hover:bg-black hover:text-white transition-colors"
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
                    <div className="flex flex-col h-full px-12 py-10 text-left bg-amber-100 lg:p-10">
                      <h4 className="text-4xl uppercase font-bold mb-4">
                        {slide.title}
                      </h4>
                      <div className="max-w-md text-base">
                        <p>{slide.content}</p>
                        {slide.bold && (
                          <p className="mt-3">
                            <strong>{slide.bold}</strong>
                          </p>
                        )}
                      </div>
                      <div className="mt-auto">
                        <div className="flex justify-between py-2 items-center">
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
                            className="inline-block font-medium"
                          >
                            {slide.linkText}
                          </Link>
                        </div>
                        <div className="w-full border-2 border-current" />
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
        <div className="py-24 bg-black">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="relative z-10 p-8 md:p-12 bg-amber-100">
              <h4 className="uppercase font-display text-2xl md:text-3xl font-bold mb-6">
                Sign Up for News &amp; Encouragement
              </h4>
              <form
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                onSubmit={(e) => e.preventDefault()}
              >
                <label className="inline-block w-full col-span-1">
                  <span className="inline-block mb-2 text-sm font-bold uppercase">
                    First Name
                  </span>
                  <input
                    className="w-full border-2 border-black p-2 bg-transparent focus:bg-black focus:text-white outline-none"
                    type="text"
                    placeholder="Alex"
                  />
                </label>
                <label className="inline-block w-full col-span-1">
                  <span className="inline-block mb-2 text-sm font-bold uppercase">
                    Last Name
                  </span>
                  <input
                    className="w-full border-2 border-black p-2 bg-transparent focus:bg-black focus:text-white outline-none"
                    type="text"
                    placeholder="Smith"
                  />
                </label>
                <label className="inline-block w-full col-span-1">
                  <span className="inline-block mb-2 text-sm font-bold uppercase">
                    Email
                  </span>
                  <input
                    type="email"
                    className="w-full border-2 border-black p-2 bg-transparent focus:bg-black focus:text-white outline-none"
                    placeholder="Email"
                  />
                </label>
                <div className="col-span-1 flex items-end">
                  <button
                    type="submit"
                    className="w-full border-2 border-black p-2 text-sm uppercase font-bold hover:bg-black hover:text-white transition-colors"
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
