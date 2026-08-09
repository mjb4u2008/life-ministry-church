import { CalendarDays, Play } from "lucide-react";
import type {
  PublicGatheringOccurrence,
  PublicGatheringSeries,
} from "@/lib/gatherings";

export function formatGatheringDate(startsAt: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(startsAt));
}

export function GatheringCard({
  occurrence,
  series,
}: {
  occurrence: PublicGatheringOccurrence;
  series?: PublicGatheringSeries;
}) {
  return (
    <article className="flex h-full min-w-0 flex-col rounded-2xl border border-[#dce8f2] bg-white p-5 shadow-sm sm:p-6">
      <p className="font-body text-xs font-bold uppercase tracking-widest text-[#1a6fb5]">
        {series?.name ?? "L.I.F.E. Gathering"}
      </p>
      <h3 className="mt-3 break-words font-display text-2xl font-extrabold text-[#0a1a2f]">
        {occurrence.title || series?.name || "Upcoming gathering"}
      </h3>
      {occurrence.scripture && (
        <p className="mt-2 font-body text-sm font-semibold text-[#1a6fb5]">
          {occurrence.scripture}
        </p>
      )}
      <p className="mt-4 flex items-start gap-2 font-body text-sm leading-relaxed text-[#4a6580]">
        <CalendarDays className="mt-0.5 size-4 shrink-0" />
        <span>{formatGatheringDate(occurrence.startsAt)}</span>
      </p>
      {occurrence.description && (
        <p className="mt-4 flex-1 font-body text-sm leading-relaxed text-[#4a6580]">
          {occurrence.description}
        </p>
      )}
      {occurrence.replayUrl && (
        <a
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#0a1a2f] px-4 py-2.5 font-body text-sm font-bold text-white hover:bg-[#1a6fb5]"
          href={occurrence.replayUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Watch replay <Play className="size-4" fill="currentColor" />
        </a>
      )}
    </article>
  );
}
