"use client";

import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function remaining(target: string, now: number): TimeLeft {
  const milliseconds = Math.max(0, Date.parse(target) - now);
  const totalSeconds = Math.floor(milliseconds / 1_000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function GatheringCountdown({
  startsAt,
  tone = "dark",
}: {
  startsAt: string;
  tone?: "dark" | "gold";
}) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => remaining(startsAt, Date.now()));

  useEffect(() => {
    const update = () => setTimeLeft(remaining(startsAt, Date.now()));
    const interval = window.setInterval(update, 1_000);
    return () => window.clearInterval(interval);
  }, [startsAt]);

  const units = [
    [timeLeft.days, "Days"],
    [timeLeft.hours, "Hours"],
    [timeLeft.minutes, "Mins"],
    [timeLeft.seconds, "Secs"],
  ] as const;

  return (
    <div aria-label="Time until gathering" className="w-full max-w-md">
      <div className="grid grid-cols-4 gap-1.5 min-[360px]:gap-2 sm:gap-3">
        {units.map(([value, label]) => (
          <div
            className={`min-w-0 rounded-xl px-1 py-3 text-center sm:px-3 sm:py-4 ${
              tone === "gold"
                ? "border border-[#071521]/15 bg-[#071521]/8"
                : "border border-white/15 bg-white/8"
            }`}
            key={label}
          >
            <div className={`font-body text-2xl font-black tabular-nums min-[360px]:text-3xl sm:text-4xl ${tone === "gold" ? "text-[#071521]" : "text-white"}`}>
              {String(value).padStart(2, "0")}
            </div>
            <div className={`mt-1 truncate font-body text-xs font-bold uppercase tracking-wide ${tone === "gold" ? "text-[#071521]/65" : "text-white/60"}`}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
