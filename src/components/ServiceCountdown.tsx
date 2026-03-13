"use client";

import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface ServiceSchedule {
  dayOfWeek: number;
  hour: number;
  minute: number;
  timezone: string;
}

function getNextService(schedule: ServiceSchedule): Date {
  const now = new Date();
  const nextService = new Date(now);

  const daysUntilService = (schedule.dayOfWeek - now.getDay() + 7) % 7;

  // If it's the service day, check if we're past the service time
  if (daysUntilService === 0) {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    // If we're 2+ hours past start time, next service is next week
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

function formatScheduleTime(schedule: ServiceSchedule): string {
  const days = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
  const hour = schedule.hour % 12 || 12;
  const ampm = schedule.hour >= 12 ? "PM" : "AM";
  const minute = schedule.minute > 0 ? `:${String(schedule.minute).padStart(2, "0")}` : ":00";
  return `${days[schedule.dayOfWeek]} at ${hour}${minute} ${ampm}`;
}

export function ServiceCountdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isLive, setIsLive] = useState(false);
  const [schedule, setSchedule] = useState<ServiceSchedule>({
    dayOfWeek: 0,
    hour: 10,
    minute: 0,
    timezone: "America/New_York",
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Fetch content from API
    async function fetchContent() {
      try {
        const res = await fetch("/api/content");
        if (res.ok) {
          const data = await res.json();
          setIsLive(data.serviceLive || false);
          if (data.serviceSchedule) {
            setSchedule(data.serviceSchedule);
          }
        }
      } catch (error) {
        console.error("Failed to fetch content:", error);
      }
    }

    fetchContent();
    // Poll for live status every 30 seconds
    const pollInterval = setInterval(fetchContent, 30000);

    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const updateCountdown = () => {
      if (isLive) return;
      const nextService = getNextService(schedule);
      setTimeLeft(calculateTimeLeft(nextService));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [mounted, isLive, schedule]);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center">
        <p className="text-sm uppercase tracking-wider text-warm-gray mb-4">
          Next Service
        </p>
        <div className="flex gap-4 md:gap-6">
          {[0, 0, 0, 0].map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="bg-white rounded-xl shadow-md px-4 py-3 md:px-6 md:py-4 min-w-[60px] md:min-w-[80px]">
                <span className="font-display text-3xl md:text-4xl font-semibold text-charcoal">
                  --
                </span>
              </div>
              <span className="text-xs uppercase tracking-wider text-warm-gray mt-2">
                {["Days", "Hours", "Mins", "Secs"][i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isLive) {
    return (
      <div className="flex flex-col items-center">
        <div className="inline-flex items-center gap-3 bg-terracotta text-white px-6 py-3 rounded-full text-lg font-medium animate-pulse-soft">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          Service is Live!
        </div>
        <p className="mt-4 text-charcoal-light">
          Join us now for Sunday worship
        </p>
      </div>
    );
  }

  const timeUnits = [
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hours" },
    { value: timeLeft.minutes, label: "Mins" },
    { value: timeLeft.seconds, label: "Secs" },
  ];

  return (
    <div className="flex flex-col items-center">
      <p className="text-sm uppercase tracking-wider text-warm-gray mb-4">
        Next Service
      </p>
      <div className="flex gap-3 md:gap-4">
        {timeUnits.map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center">
            <div className="bg-white rounded-xl shadow-md px-3 py-2 md:px-5 md:py-3 min-w-[50px] md:min-w-[70px]">
              <span className="font-display text-2xl md:text-3xl font-semibold text-charcoal">
                {String(value).padStart(2, "0")}
              </span>
            </div>
            <span className="text-xs uppercase tracking-wider text-warm-gray mt-2">
              {label}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-charcoal-light">
        {formatScheduleTime(schedule)}
      </p>
    </div>
  );
}
