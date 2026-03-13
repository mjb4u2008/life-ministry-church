"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/Button";
import { JitsiMeet } from "@/components/JitsiMeet";
import { ReminderSignup } from "@/components/ReminderSignup";

const LOCAL_STORAGE_KEY = "lifeMinistryUserName";

interface ServiceSchedule {
  dayOfWeek: number;
  hour: number;
  minute: number;
  timezone: string;
}

interface WeeklyMessage {
  title: string;
  scripture: string;
  description: string;
}

interface ContentData {
  lobbyOpen: boolean;
  serviceLive: boolean;
  roomName: string;
  testMode: boolean;
  serviceSchedule: ServiceSchedule;
  weeklyMessage: WeeklyMessage;
}

const pastServices = [
  {
    id: 1,
    title: "Finding Rest in Restless Times",
    date: "January 5, 2026",
    duration: "45 min",
    scripture: "Matthew 11:28-30",
  },
  {
    id: 2,
    title: "Walking in Faith, Not Fear",
    date: "December 29, 2025",
    duration: "52 min",
    scripture: "Isaiah 41:10",
  },
  {
    id: 3,
    title: "The Gift of Presence",
    date: "December 22, 2025",
    duration: "48 min",
    scripture: "Matthew 1:23",
  },
  {
    id: 4,
    title: "Gratitude in All Seasons",
    date: "December 15, 2025",
    duration: "41 min",
    scripture: "1 Thessalonians 5:18",
  },
];

// Types for page states
type PageState =
  | "default"           // Lobby closed, service not live
  | "lobby-no-name"     // Lobby open but user hasn't entered name
  | "waiting-room"      // User in waiting room with name
  | "live-no-name"      // Service live but user hasn't entered name
  | "in-service";       // User in service with Jitsi

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getNextService(schedule: ServiceSchedule): Date {
  const now = new Date();
  const nextService = new Date(now);

  const daysUntilService = (schedule.dayOfWeek - now.getDay() + 7) % 7;

  if (daysUntilService === 0) {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    if (
      currentHour > schedule.hour + 2 ||
      (currentHour === schedule.hour + 2 && currentMinute > 0)
    ) {
      nextService.setDate(now.getDate() + 7);
    }
  } else {
    nextService.setDate(now.getDate() + daysUntilService);
  }

  nextService.setHours(schedule.hour, schedule.minute, 0, 0);
  return nextService;
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const now = new Date();
  const difference = targetDate.getTime() - now.getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

export default function WatchPage() {
  const [content, setContent] = useState<ContentData | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  // Fetch content from API
  const fetchContent = useCallback(async () => {
    try {
      const res = await fetch("/api/content");
      if (res.ok) {
        const data = await res.json();
        setContent(data);
        return data;
      }
    } catch (error) {
      console.error("Failed to fetch content:", error);
    }
    return null;
  }, []);

  // Load name from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const storedName = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedName) {
      setUserName(storedName);
    }
    fetchContent();
  }, [fetchContent]);

  // Determine page state
  const getPageState = (): PageState => {
    if (!content) return "default";

    const lobbyAccessible = content.lobbyOpen || content.testMode;

    // Service is live
    if (content.serviceLive) {
      return userName ? "in-service" : "live-no-name";
    }

    // Lobby is open (or test mode)
    if (lobbyAccessible) {
      return userName ? "waiting-room" : "lobby-no-name";
    }

    // Default state
    return "default";
  };

  const pageState = getPageState();

  // Poll for serviceLive when in waiting room
  useEffect(() => {
    if (pageState !== "waiting-room") return;

    const pollInterval = setInterval(async () => {
      await fetchContent();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [pageState, fetchContent]);

  // Countdown timer for default state
  useEffect(() => {
    if (!content || !mounted || pageState !== "default") return;

    const updateCountdown = () => {
      const nextService = getNextService(content.serviceSchedule);
      setTimeLeft(calculateTimeLeft(nextService));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [content, mounted, pageState]);

  // Handle joining (save name to localStorage)
  const handleJoin = () => {
    if (nameInput.trim()) {
      localStorage.setItem(LOCAL_STORAGE_KEY, nameInput.trim());
      setUserName(nameInput.trim());
    }
  };

  // Handle leaving
  const handleLeave = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setUserName(null);
    setNameInput("");
  };

  // ============================================
  // STATE 1: DEFAULT
  // ============================================
  if (pageState === "default") {
    return (
      <div className="min-h-screen bg-[#FAF8F5]">
        {/* Subtle texture */}
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Hero Section */}
        <section className="pt-24 pb-16 md:pt-32 md:pb-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-forest/5 to-transparent" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold text-charcoal mb-4">
                Join Us This Sunday
              </h1>
              <p className="text-charcoal/60 text-lg max-w-2xl mx-auto">
                Interactive worship and fellowship every Sunday at 10:00 AM Eastern.
                Join face-to-face with our community.
              </p>
            </div>

            {/* Countdown */}
            {mounted && (
              <div className="flex flex-col items-center mb-16">
                <div className="flex gap-3 md:gap-4 mb-4">
                  {[
                    { value: timeLeft.days, label: "Days" },
                    { value: timeLeft.hours, label: "Hours" },
                    { value: timeLeft.minutes, label: "Mins" },
                    { value: timeLeft.seconds, label: "Secs" },
                  ].map(({ value, label }) => (
                    <div key={label} className="flex flex-col items-center">
                      <div className="bg-white rounded-2xl px-5 py-4 md:px-8 md:py-6 min-w-[70px] md:min-w-[100px] shadow-sm border border-charcoal/5">
                        <span className="font-display text-3xl md:text-5xl font-semibold text-charcoal">
                          {String(value).padStart(2, "0")}
                        </span>
                      </div>
                      <span className="text-xs uppercase tracking-wider text-charcoal/40 mt-2 font-medium">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-charcoal/50 text-sm">until next service</p>
              </div>
            )}
          </div>
        </section>

        {/* Two-column: Message + Reminder */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              {/* This Week's Message */}
              <div>
                <span className="text-terracotta font-medium tracking-wider uppercase text-xs">
                  This Week&apos;s Message
                </span>
                <h2 className="text-2xl md:text-3xl font-display font-semibold text-charcoal mt-2 mb-4">
                  {content?.weeklyMessage?.title || "Sunday Service"}
                </h2>
                {content?.weeklyMessage?.scripture && (
                  <p className="text-terracotta font-medium mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {content.weeklyMessage.scripture}
                  </p>
                )}
                <p className="text-charcoal/70 text-lg leading-relaxed">
                  {content?.weeklyMessage?.description ||
                    "Join us for worship, fellowship, and an encouraging word from Scripture."}
                </p>
              </div>

              {/* Get Reminded */}
              <div>
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-charcoal/5">
                  <h3 className="text-xl font-display font-semibold text-charcoal mb-2">
                    Get Reminded
                  </h3>
                  <p className="text-charcoal/60 text-sm mb-6">
                    We&apos;ll send you a friendly reminder before each Sunday service.
                  </p>
                  <ReminderSignup />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Past Services */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-transparent to-cream-dark/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-terracotta font-medium tracking-wider uppercase text-xs">
                Catch Up
              </span>
              <h2 className="text-2xl md:text-3xl font-display font-semibold text-charcoal mt-2">
                Past Services
              </h2>
              <p className="text-charcoal/60 mt-3 max-w-xl mx-auto text-sm">
                Missed a Sunday? Watch previous messages and be encouraged.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {pastServices.map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer border border-charcoal/5"
                >
                  <div className="aspect-video bg-gradient-to-br from-forest to-forest-dark relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-terracotta group-hover:scale-110 transition-all">
                        <svg
                          className="w-5 h-5 text-white ml-0.5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
                      {service.duration}
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-terracotta font-medium mb-1">
                      {service.date}
                    </p>
                    <h3 className="font-display text-lg font-semibold text-charcoal mb-1">
                      {service.title}
                    </h3>
                    <p className="text-charcoal/50 text-sm">
                      {service.scripture}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Button variant="outline">View All Past Services</Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ============================================
  // STATE 2: LOBBY OPEN (no name entered yet)
  // ============================================
  if (pageState === "lobby-no-name") {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4 pt-20 pb-8">
        {/* Background elements */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-terracotta/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-forest/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-md w-full text-center">
          {/* Pulsing indicator */}
          <div className="mb-8">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-terracotta/20 animate-ping" style={{ animationDuration: "2s" }} />
              <div className="absolute inset-2 rounded-full bg-terracotta/30 animate-pulse" />
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-terracotta to-terracotta-dark flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-semibold text-charcoal mb-3">
            Service Starting Soon
          </h1>
          <p className="text-charcoal/60 text-lg mb-10">
            Pastor Mike is preparing. Enter your name to join when we go live.
          </p>

          {/* Name input */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-charcoal/5">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="Enter your name..."
              className="w-full px-5 py-4 text-lg rounded-xl bg-cream-dark/50 text-charcoal placeholder:text-charcoal/40 outline-none focus:ring-2 focus:ring-terracotta/20 transition-all mb-4"
              autoFocus
            />
            <button
              onClick={handleJoin}
              disabled={!nameInput.trim()}
              className="w-full bg-charcoal text-white py-4 rounded-xl font-medium text-lg hover:bg-charcoal/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Join Waiting Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // STATE 3: IN WAITING ROOM
  // ============================================
  if (pageState === "waiting-room") {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4 pt-20 pb-8">
        {/* Soft animated background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(196, 112, 74, 0.08) 0%, transparent 70%)",
              animation: "breathe 6s ease-in-out infinite",
            }}
          />
        </div>

        <div className="relative max-w-md w-full text-center">
          {/* Breathing animation circle */}
          <div className="mb-10">
            <div className="relative w-32 h-32 mx-auto">
              {/* Outer ring */}
              <div
                className="absolute inset-0 rounded-full border-2 border-forest/20"
                style={{ animation: "breathe 4s ease-in-out infinite" }}
              />
              {/* Middle ring */}
              <div
                className="absolute inset-3 rounded-full border-2 border-forest/30"
                style={{ animation: "breathe 4s ease-in-out infinite 0.5s" }}
              />
              {/* Inner content */}
              <div className="absolute inset-6 rounded-full bg-gradient-to-br from-forest to-forest-dark flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-semibold text-charcoal mb-2">
            You&apos;re in, {userName}!
          </h1>
          <p className="text-charcoal/60 text-lg mb-8">
            You&apos;ll join automatically when service begins
          </p>

          {/* Status card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-charcoal/5 mb-8">
            <div className="flex items-center justify-center gap-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-forest rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-forest rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-forest rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-forest font-medium">Pastor Mike is getting ready...</span>
            </div>
          </div>

          <button
            onClick={handleLeave}
            className="text-charcoal/40 hover:text-charcoal/60 transition-colors text-sm"
          >
            Leave waiting room
          </button>
        </div>

        {/* Breathing animation */}
        <style jsx>{`
          @keyframes breathe {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.05); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // ============================================
  // STATE 4: SERVICE LIVE (late joiner, no name)
  // ============================================
  if (pageState === "live-no-name") {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4 pt-20 pb-8">
        {/* Background pulse */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-terracotta/5 rounded-full animate-pulse" />
        </div>

        <div className="relative max-w-md w-full text-center">
          {/* Live indicator */}
          <div className="mb-8 flex justify-center">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-charcoal/5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <span className="font-medium text-charcoal">We&apos;re Live!</span>
            </div>
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-semibold text-charcoal mb-3">
            Service is Happening Now
          </h1>
          <p className="text-charcoal/60 text-lg mb-10">
            Enter your name to join the service.
          </p>

          {/* Name input */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-charcoal/5">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="Enter your name..."
              className="w-full px-5 py-4 text-lg rounded-xl bg-cream-dark/50 text-charcoal placeholder:text-charcoal/40 outline-none focus:ring-2 focus:ring-terracotta/20 transition-all mb-4"
              autoFocus
            />
            <button
              onClick={handleJoin}
              disabled={!nameInput.trim()}
              className="w-full bg-terracotta text-white py-4 rounded-xl font-semibold text-lg hover:bg-terracotta-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Join Service Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // STATE 5: IN SERVICE (Jitsi room)
  // ============================================
  return (
    <div className="min-h-screen bg-charcoal">
      {/* Header bar */}
      <div className="fixed top-0 left-0 right-0 bg-charcoal/95 backdrop-blur-sm border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Live badge */}
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
                <span className="text-white text-sm font-medium">Live</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-white font-display font-semibold">
                  L.I.F.E. Sunday Worship
                </h1>
                <p className="text-white/60 text-xs">
                  Joined as {userName}
                </p>
              </div>
            </div>
            <button
              onClick={handleLeave}
              className="text-white/60 hover:text-white text-sm font-medium transition-colors px-4 py-2 rounded-lg hover:bg-white/10"
            >
              Leave
            </button>
          </div>
        </div>
      </div>

      {/* Jitsi container */}
      <div className="pt-16 h-screen">
        <div className="h-full">
          <JitsiMeet
            roomName={content?.roomName || "LIFEMinistryService"}
            displayName={userName || "Guest"}
            onReady={() => console.log("Jitsi is ready")}
          />
        </div>
      </div>
    </div>
  );
}
