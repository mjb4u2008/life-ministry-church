"use client";

import { useState } from "react";
import { Bell, Check, Copy, ExternalLink, Play } from "lucide-react";
import type { PublicGatheringOccurrence } from "@/lib/gatherings";

export function GatheringActions({
  occurrence,
  reminderHref = "/watch#reminded",
  tone = "dark",
}: {
  occurrence: PublicGatheringOccurrence;
  reminderHref?: string;
  tone?: "dark" | "gold";
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
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-body text-sm font-black text-[#071521] transition-colors hover:bg-[#f3efe6] sm:w-auto"
          href={occurrence.joinUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Join on Google Meet <ExternalLink className="size-4" />
        </a>
        <button
          className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-body text-sm font-bold transition-colors sm:w-auto ${tone === "gold" ? "border border-[#071521]/25 text-[#071521] hover:bg-[#071521]/10" : "border border-white/30 text-white hover:bg-white/10"}`}
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
        className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-body text-sm font-black transition-colors sm:w-auto ${tone === "gold" ? "bg-[#071521] text-white hover:bg-[#162c3b]" : "bg-[#e4b75d] text-[#071521] hover:bg-[#f4d690]"}`}
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
      className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-body text-sm font-black transition-colors sm:w-auto ${tone === "gold" ? "bg-[#071521] text-white hover:bg-[#162c3b]" : "bg-[#e4b75d] text-[#071521] hover:bg-[#f4d690]"}`}
      href={reminderHref}
    >
      Get a reminder <Bell className="size-4" />
    </a>
  );
}
