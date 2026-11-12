"use client";

import type { WeeklyService } from "@/lib/service-schedule";

export function ServiceCountdown({ service }: { service: WeeklyService | null }) {
  if (!service) {
    return (
      <div className="flex flex-col items-center">
        <p className="text-sm uppercase tracking-wider text-text-light mb-4">
          Next Service
        </p>
        <div className="flex gap-4 md:gap-6">
          {[0, 0, 0, 0].map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="bg-cloud rounded-xl shadow-sm shadow-water/10 px-4 py-3 md:px-6 md:py-4 min-w-[60px] md:min-w-[80px]">
                <span className="font-display text-3xl md:text-4xl font-semibold text-deep">
                  --
                </span>
              </div>
              <span className="text-xs uppercase tracking-wider text-text-light mt-2">
                {["Days", "Hours", "Mins", "Secs"][i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (service.isLive) {
    return (
      <div className="flex flex-col items-center">
        <div className="inline-flex items-center gap-3 bg-water text-white px-6 py-3 rounded-full text-lg font-medium animate-pulse-soft">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          Service is Live!
        </div>
        <p className="mt-4 text-text-body">
          Join us now for {service.day} worship
        </p>
      </div>
    );
  }

  const timeUnits = [
    { value: service.countdown.d, label: "Days" },
    { value: service.countdown.h, label: "Hours" },
    { value: service.countdown.m, label: "Mins" },
    { value: service.countdown.s, label: "Secs" },
  ];

  return (
    <div className="flex flex-col items-center">
      <p className="text-sm uppercase tracking-wider text-text-light mb-4">
        Next Service
      </p>
      <div className="flex gap-3 md:gap-4">
        {timeUnits.map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center">
            <div className="bg-cloud rounded-xl shadow-sm shadow-water/10 px-3 py-2 md:px-5 md:py-3 min-w-[50px] md:min-w-[70px]">
              <span className="font-display text-2xl md:text-3xl font-semibold text-deep">
                {String(value).padStart(2, "0")}
              </span>
            </div>
            <span className="text-xs uppercase tracking-wider text-text-light mt-2">
              {label}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-text-body">
        {service.scheduleLabel}
      </p>
    </div>
  );
}
