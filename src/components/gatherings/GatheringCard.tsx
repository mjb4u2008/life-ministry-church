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
    <article className="life-modernist flex h-full min-w-0 flex-col border-2 border-[#201e1d]/35 bg-[#f3f2f2] p-6 sm:p-7">
      <p className="font-body text-xs font-extrabold uppercase tracking-[0.13em] text-[var(--modernist-deep-blue)]">
        {series?.name ?? "L.I.F.E. Gathering"}
      </p>
      <h3 className="mt-3 break-words font-display text-3xl font-black text-[#201e1d]">
        {occurrence.title || series?.name || "Upcoming gathering"}
      </h3>
      {occurrence.scripture && (
        <p className="mt-2 font-body text-sm font-bold text-[var(--modernist-deep-blue)]">
          {occurrence.scripture}
        </p>
      )}
      <p className="mt-4 flex items-start gap-2 font-body text-sm leading-relaxed text-[#201e1d]/70">
        <CalendarDays className="mt-0.5 size-4 shrink-0" />
        <span>
          {formatGatheringDate(
            occurrence.startsAt,
            series?.schedule?.timezone ?? MINISTRY_TIMEZONE,
          )}
        </span>
      </p>
      {occurrence.description && (
        <p className="mt-4 flex-1 font-body text-sm leading-relaxed text-[#201e1d]/70">
          {occurrence.description}
        </p>
      )}
      {occurrence.replayUrl && (
        <a
          className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 border-2 border-[var(--modernist-blue)] bg-[var(--modernist-blue)] px-5 py-3 font-body text-base font-extrabold text-white hover:border-[var(--modernist-deep-blue)] hover:bg-[var(--modernist-deep-blue)]"
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
