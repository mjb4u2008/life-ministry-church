"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function LiveIndicator() {
  const [serviceLive, setServiceLive] = useState(false);

  useEffect(() => {
    async function checkLiveStatus() {
      try {
        const res = await fetch("/api/content");
        if (res.ok) {
          const data = await res.json();
          setServiceLive(data.serviceLive || false);
        }
      } catch (error) {
        console.error("Failed to check live status:", error);
      }
    }

    checkLiveStatus();
    // Poll every 30 seconds
    const interval = setInterval(checkLiveStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!serviceLive) return null;

  return (
    <Link
      href="/watch"
      className="flex items-center gap-2 bg-terracotta text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-terracotta-dark transition-colors"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
      </span>
      Live Now
    </Link>
  );
}

export function LiveBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 bg-terracotta text-white px-3 py-1.5 rounded-full text-sm font-medium ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
      </span>
      Live Now
    </div>
  );
}
