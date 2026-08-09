import { Play, Radio } from "lucide-react";
import type {
  PublicGatheringOccurrence,
  PublicGatheringSeries,
} from "@/lib/gatherings";
import { GatheringActions } from "./GatheringActions";
import { GatheringCountdown } from "./GatheringCountdown";
import { formatGatheringDate } from "./GatheringCard";

export type GatheringPhase = "upcoming" | "joining" | "live" | "replay" | "ended";

export function getGatheringPhase(
  occurrence: PublicGatheringOccurrence,
  now = new Date(),
): GatheringPhase {
  const nowMs = now.getTime();
  if (occurrence.status === "completed") {
    return occurrence.replayUrl ? "replay" : "ended";
  }
  if (
    occurrence.status === "live" ||
    (nowMs >= Date.parse(occurrence.startsAt) && nowMs < Date.parse(occurrence.endsAt))
  ) {
    return "live";
  }
  if (occurrence.joinUrl) return "joining";
  return "upcoming";
}

const phaseLabel: Record<GatheringPhase, string> = {
  upcoming: "Next gathering",
  joining: "The room is open",
  live: "Live now",
  replay: "Latest replay",
  ended: "Gathering complete",
};

export function GatheringHero({
  occurrence,
  series,
  now,
}: {
  occurrence: PublicGatheringOccurrence;
  series?: PublicGatheringSeries;
  now?: Date;
}) {
  const phase = getGatheringPhase(occurrence, now);
  const showCountdown = phase === "upcoming" || phase === "joining";
  const isWednesday = series?.themeKey === "wednesday";

  return (
    <section
      className={`text-white ${isWednesday ? "bg-[#18253b]" : "bg-[#0a1a2f]"}`}
      data-gathering-phase={phase}
      id="next-gathering"
    >
      <div className="mx-auto grid max-w-screen-xl grid-cols-1 gap-10 px-4 py-20 min-[360px]:px-5 sm:px-6 md:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)] lg:items-center lg:gap-16 lg:px-12">
        <div className="min-w-0">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-body text-xs font-bold uppercase tracking-widest text-[#77e5ff]">
            {(phase === "live" || phase === "joining") && <Radio className="size-3.5" />}
            {phaseLabel[phase]}
          </div>
          <p className="font-body text-sm font-semibold uppercase tracking-[0.16em] text-white/60">
            {series?.name ?? "L.I.F.E. Ministry"}
          </p>
          <h2 className="mt-3 break-words font-display text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
            {occurrence.title || series?.name || "Join our next gathering"}
          </h2>
          {occurrence.scripture && (
            <p className="mt-4 font-body text-lg font-semibold text-[#77e5ff]">
              {occurrence.scripture}
            </p>
          )}
          <p className="mt-5 font-body text-base leading-relaxed text-white/75 sm:text-lg">
            {occurrence.description || "Come worship, pray, and spend time in God’s Word with us online."}
          </p>
          <p className="mt-5 font-body text-sm font-semibold text-white/65">
            {formatGatheringDate(occurrence.startsAt)}
          </p>
          <div className="mt-7">
            <GatheringActions occurrence={occurrence} />
          </div>
        </div>

        <div className="min-w-0">
          {showCountdown ? (
            <div>
              <p className="mb-4 font-body text-xs font-bold uppercase tracking-widest text-white/55">
                Starts in
              </p>
              <GatheringCountdown startsAt={occurrence.startsAt} />
            </div>
          ) : phase === "replay" ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
              <Play className="size-10 text-[#77e5ff]" fill="currentColor" />
              <p className="mt-5 font-display text-2xl font-bold">Watch when you’re ready</p>
              <p className="mt-2 font-body text-sm leading-relaxed text-white/65">
                Catch up on the full message and share it with someone who needs encouragement.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 font-body text-white/70 sm:p-8">
              This gathering has ended. A replay will appear here when it is available.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
