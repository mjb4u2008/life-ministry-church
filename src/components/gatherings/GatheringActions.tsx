"use client";

import { useState } from "react";
import { Bell, Check, Copy, ExternalLink, Play } from "lucide-react";
import type { PublicGatheringOccurrence } from "@/lib/gatherings";

function gatheringDay(gatheringName?: string) {
  if (/wednesday/i.test(gatheringName ?? "")) return "Wednesday";
  if (/sunday/i.test(gatheringName ?? "")) return "Sunday";
  return "the gathering";
}

export function getGatheringActionLabel(
  occurrence: PublicGatheringOccurrence,
  gatheringName?: string,
) {
  const day = gatheringDay(gatheringName);
  if (occurrence.joinUrl) return day === "the gathering" ? "Join now" : `Join ${day} now`;
  if (occurrence.replayUrl) {
    return day === "the gathering" ? "Watch the latest message" : `Watch ${day}’s message`;
  }
  return day === "the gathering" ? "Get a gathering reminder" : `Remind me about ${day}`;
}

export function GatheringActions({
  occurrence,
  reminderHref = "/watch#reminded",
  tone = "dark",
  appearance = "pill",
  gatheringName,
}: {
  occurrence: PublicGatheringOccurrence;
  reminderHref?: string;
  tone?: "dark" | "gold";
  appearance?: "pill" | "modernist";
  gatheringName?: string;
}) {
  const [copied, setCopied] = useState(false);
  const actionLabel = getGatheringActionLabel(occurrence, gatheringName);

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
    const primaryClass = appearance === "modernist"
      ? "border-2 border-[var(--modernist-blue)] bg-[var(--modernist-blue)] px-6 py-3.5 text-white hover:border-[var(--modernist-deep-blue)] hover:bg-[var(--modernist-deep-blue)]"
      : "rounded-full bg-white px-7 py-3.5 text-[#071521] hover:bg-[#f3efe6]";
    const secondaryClass = appearance === "modernist"
      ? "border-2 border-[#201e1d]/40 px-5 py-3 text-[#201e1d] hover:bg-[#201e1d]/7"
      : tone === "gold"
        ? "rounded-full border border-[#071521]/25 px-5 py-3 text-[#071521] hover:bg-[#071521]/10"
        : "rounded-full border border-white/30 px-5 py-3 text-white hover:bg-white/10";

    return (
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <a
          className={`inline-flex min-h-14 w-full items-center justify-center gap-2 font-body text-base font-black transition-colors sm:w-auto ${primaryClass}`}
          href={occurrence.joinUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          {actionLabel} <ExternalLink className="size-4" />
        </a>
        <button
          className={`inline-flex min-h-12 w-full items-center justify-center gap-2 font-body text-base font-bold transition-colors sm:w-auto ${secondaryClass}`}
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
    const replayClass = appearance === "modernist"
      ? "border-2 border-[var(--modernist-blue)] bg-[var(--modernist-blue)] px-6 py-3.5 text-white hover:border-[var(--modernist-deep-blue)] hover:bg-[var(--modernist-deep-blue)]"
      : tone === "gold"
        ? "rounded-full bg-[#071521] px-7 py-3.5 text-white hover:bg-[#162c3b]"
        : "rounded-full bg-[#e4b75d] px-7 py-3.5 text-[#071521] hover:bg-[#f4d690]";
    return (
      <a
        className={`inline-flex min-h-14 w-full items-center justify-center gap-2 font-body text-base font-black transition-colors sm:w-auto ${replayClass}`}
        href={occurrence.replayUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        {actionLabel} <Play className="size-4" fill="currentColor" />
      </a>
    );
  }

  const reminderClass = appearance === "modernist"
    ? "border-2 border-[var(--modernist-blue)] bg-[var(--modernist-blue)] px-6 py-3.5 text-white hover:border-[var(--modernist-deep-blue)] hover:bg-[var(--modernist-deep-blue)]"
    : tone === "gold"
      ? "rounded-full bg-[#071521] px-7 py-3.5 text-white hover:bg-[#162c3b]"
      : "rounded-full bg-[#e4b75d] px-7 py-3.5 text-[#071521] hover:bg-[#f4d690]";

  return (
    <a
      className={`inline-flex min-h-14 w-full items-center justify-center gap-2 font-body text-base font-black transition-colors sm:w-auto ${reminderClass}`}
      href={reminderHref}
    >
      {actionLabel} <Bell className="size-4" />
    </a>
  );
}
