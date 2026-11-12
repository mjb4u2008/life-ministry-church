"use client";

import { useEffect, useState } from "react";
import { getWeeklyService, type ServiceContent } from "@/lib/service-schedule";

export function useWeeklyService(content: ServiceContent | null) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const first = window.setTimeout(() => setNow(Date.now()), 0);
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { window.clearTimeout(first); window.clearInterval(interval); };
  }, []);
  return now === null ? null : getWeeklyService(content, new Date(now));
}
