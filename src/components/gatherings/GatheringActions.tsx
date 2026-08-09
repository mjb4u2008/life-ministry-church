"use client";

import { useState } from "react";
import { Bell, Check, Copy, ExternalLink, Play } from "lucide-react";
import type { PublicGatheringOccurrence } from "@/lib/gatherings";

export function GatheringActions({
  occurrence,
  reminderHref = "/watch#reminded",
}: {
  occurrence: PublicGatheringOccurrence;
  reminderHref?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyJoinLink = async () => {
    if (!occurrence.joinUrl) return;
    try {
      await navigator.clipboard.writeText(occurrence.joinUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setCopied(false);
    }
  };

  if (occurrence.joinUrl) {
    return (
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <a
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1a6fb5] px-6 py-3 font-body text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#145a94] sm:w-auto"
          href={occurrence.joinUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Join on Google Meet <ExternalLink className="size-4" />
        </a>
        <button
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/25 px-5 py-3 font-body text-sm font-bold text-white transition-colors hover:bg-white/10 sm:w-auto"
          onClick={copyJoinLink}
          type="button"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    );
  }

  if (occurrence.replayUrl) {
    return (
      <a
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1a6fb5] px-6 py-3 font-body text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#145a94] sm:w-auto"
        href={occurrence.replayUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        Watch replay <Play className="size-4" fill="currentColor" />
      </a>
    );
  }

  return (
    <a
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/30 px-6 py-3 font-body text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/10 sm:w-auto"
      href={reminderHref}
    >
      Get a reminder <Bell className="size-4" />
    </a>
  );
}
