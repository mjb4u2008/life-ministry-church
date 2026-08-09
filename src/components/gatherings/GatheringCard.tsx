import { CalendarDays, Play } from "lucide-react";
import {
  MINISTRY_TIMEZONE,
  type PublicGatheringOccurrence,
  type PublicGatheringSeries,
} from "@/lib/gatherings";

export function formatGatheringDate(
  startsAt: string,
  timezone = MINISTRY_TIMEZONE,
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
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
    <article className="flex h-full min-w-0 flex-col rounded-[1.5rem] border border-[#071521]/10 bg-[#fffdf8] p-6 shadow-sm sm:p-7">
      <p className="font-body text-xs font-extrabold uppercase tracking-[0.16em] text-[#1677a8]">
        {series?.name ?? "L.I.F.E. Gathering"}
      </p>
      <h3 className="mt-3 break-words font-display text-3xl font-black text-[#071521]">
        {occurrence.title || series?.name || "Upcoming gathering"}
      </h3>
      {occurrence.scripture && (
        <p className="mt-2 font-body text-sm font-bold text-[#1677a8]">
          {occurrence.scripture}
        </p>
      )}
      <p className="mt-4 flex items-start gap-2 font-body text-sm leading-relaxed text-[#526675]">
        <CalendarDays className="mt-0.5 size-4 shrink-0" />
        <span>
          {formatGatheringDate(
            occurrence.startsAt,
            series?.schedule?.timezone ?? MINISTRY_TIMEZONE,
          )}
        </span>
      </p>
      {occurrence.description && (
        <p className="mt-4 flex-1 font-body text-sm leading-relaxed text-[#526675]">
          {occurrence.description}
        </p>
      )}
      {occurrence.replayUrl && (
        <a
          className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#071521] px-5 py-3 font-body text-sm font-bold text-white hover:bg-[#1677a8]"
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
