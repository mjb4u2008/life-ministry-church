import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play, Radio } from "lucide-react";
import type {
  PublicGatheringOccurrence,
  PublicGatheringSeries,
} from "@/lib/gatherings";
import { GatheringActions, getGatheringActionLabel } from "./GatheringActions";
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
  replay: "Latest message",
  ended: "Gathering complete",
};

const phaseLead: Record<GatheringPhase, string> = {
  upcoming: "Next",
  joining: "Room open",
  live: "Live now",
  replay: "Latest",
  ended: "Completed",
};

export function GatheringHero({
  occurrence,
  series,
  now,
  mode = "watch",
}: {
  occurrence: PublicGatheringOccurrence;
  series?: PublicGatheringSeries;
  now?: Date;
  mode?: "home" | "watch";
}) {
  const phase = getGatheringPhase(occurrence, now);
  const showCountdown = phase === "upcoming" || phase === "joining";
  const gatheringName = series?.name ?? "L.I.F.E. Gathering";
  const title = occurrence.title || gatheringName;
  const titleId = `gathering-${occurrence.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

  if (mode === "home") {
    return (
      <section
        aria-labelledby={titleId}
        className="life-modernist border-b-2 border-[#201e1d]/35 bg-[#f3f2f2] pt-[4.5rem] text-[#201e1d] md:pt-20"
        data-gathering-phase={phase}
        id="next-gathering"
      >
        <p aria-atomic="true" aria-live="polite" className="sr-only" role="status">
          {phaseLabel[phase]}. {gatheringName}. {getGatheringActionLabel(occurrence, gatheringName)}.
        </p>
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8 lg:px-[clamp(2rem,5vw,4.5rem)]">
          <div className="grid items-center gap-9 py-9 sm:py-14 lg:grid-cols-2 lg:gap-[clamp(2.5rem,5vw,4.5rem)] lg:py-8">
            <div className="min-w-0">
              <div
                className="inline-flex min-h-9 items-center gap-2 border-2 border-[var(--modernist-blue)] px-3 py-1.5 text-[0.8rem] font-extrabold uppercase tracking-[0.1em] text-[var(--modernist-deep-blue)]"
              >
                {phase === "live" && <Radio className="size-3.5 animate-pulse" />}
                <span>{phaseLabel[phase]}</span>
              </div>
              <p className="mt-3 text-sm font-extrabold text-[var(--modernist-deep-blue)]" data-testid="gathering-visible-status">
                {phaseLead[phase]}: {gatheringName}
              </p>
              <h1 className="mt-4 max-w-[16ch] font-display text-[clamp(2.5rem,5vw,4.25rem)] font-black leading-[0.98] tracking-[-0.035em] sm:mt-5">
                <span className="block">Come as you are.</span>
                <span className="block">Worship from anywhere.</span>
              </h1>
              <p className="mt-5 max-w-[52ch] text-[1.05rem] leading-7 text-[#201e1d]/78 sm:text-[1.1rem] sm:leading-8">
                L.I.F.E. Ministry gathers online every Wednesday and Sunday for worship,
                Scripture, prayer, and a church family that knows your name.
              </p>
              <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <GatheringActions appearance="modernist" gatheringName={gatheringName} occurrence={occurrence} />
                <Link
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 border-2 border-[#201e1d]/35 px-5 py-3 text-base font-extrabold text-[#201e1d] transition-colors hover:bg-[#201e1d] hover:text-white sm:w-auto"
                  href="/welcome"
                >
                  First time here? <ArrowRight className="size-4" />
                </Link>
              </div>
              <p className="mt-5 max-w-[58ch] text-sm font-semibold leading-6 text-[#201e1d]/72">
                No account, no camera, and nothing to download. Times are always shown in Eastern Time.
              </p>
            </div>

            <figure className="relative aspect-[16/10] min-w-0 overflow-hidden border-2 border-[#201e1d]/40 bg-[#eae9e9]">
              <Image
                alt="An open Bible in a worship setting"
                className="object-cover object-[67%_center] grayscale contrast-[1.08]"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                src="/images/life-ministry-hero.jpg"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-[var(--modernist-blue)] px-4 py-3 text-xs font-extrabold uppercase tracking-[0.11em] text-[#fffdf8] sm:inset-x-auto sm:left-0">
                {phaseLead[phase]} · {gatheringName}
              </figcaption>
            </figure>
          </div>

          <div className="grid border-t-2 border-[#201e1d]/35 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <div className="bg-[#0b2940] p-6 text-white sm:p-8 lg:p-10">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-white/65">{gatheringName}</p>
              <h2 className="mt-4 max-w-2xl break-words font-display text-3xl font-black leading-tight sm:text-4xl" id={titleId}>{title}</h2>
              <p className="mt-5 text-base font-semibold text-white/75">{formatGatheringDate(occurrence.startsAt)}</p>
              {occurrence.scripture && <p className="mt-3 text-base font-extrabold text-[#8fd2ec]">{occurrence.scripture}</p>}
            </div>
            <div className="border-x-2 border-[#201e1d]/35 bg-[#f3f2f2] p-6 sm:p-8 lg:border-l-0 lg:p-10">
              {showCountdown && phase === "upcoming" ? (
                <>
                  <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.12em] text-[#201e1d]/72">Starts in</p>
                  <GatheringCountdown appearance="modernist" startsAt={occurrence.startsAt} />
                </>
              ) : (
                <>
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--modernist-deep-blue)]">Status · {phaseLabel[phase]}</p>
                  <p className="mt-4 text-lg font-semibold leading-7 text-[#201e1d]/75">
                    {phase === "replay"
                      ? "The latest message is ready whenever you are."
                      : phase === "ended"
                        ? "A replay will appear here when it is ready."
                        : "The room is open. Use the join button above to enter the gathering."}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="life-modernist border-b-2 border-[#201e1d]/35 bg-[#f3f2f2] pt-20 text-[#201e1d]"
      data-gathering-phase={phase}
      id="next-gathering"
    >
      <p aria-atomic="true" aria-live="polite" className="sr-only" role="status">
        {phaseLabel[phase]}. {gatheringName}. {getGatheringActionLabel(occurrence, gatheringName)}.
      </p>
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)] lg:items-center lg:gap-16 lg:px-[clamp(2rem,5vw,4.5rem)] lg:py-24">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 border-2 border-[var(--modernist-blue)] px-3 py-1.5 text-sm font-black uppercase tracking-[0.12em] text-[var(--modernist-deep-blue)]">
            {phase === "live" && <Radio className="size-3.5 animate-pulse" />}
            {phaseLabel[phase]}
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.16em] text-[#201e1d]/72">{gatheringName}</p>
          <h1 className="mt-3 break-words font-display text-5xl font-black leading-[0.98] sm:text-6xl" id={titleId}>{title}</h1>
          {occurrence.scripture && <p className="mt-5 text-lg font-bold text-[var(--modernist-deep-blue)]">{occurrence.scripture}</p>}
          <p className="mt-5 text-base font-bold text-[#201e1d]/68">{formatGatheringDate(occurrence.startsAt)}</p>
          <div className="mt-6"><GatheringActions appearance="modernist" gatheringName={gatheringName} occurrence={occurrence} /></div>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#201e1d]/72">
            {occurrence.description || "Come worship, pray, and spend time in God’s Word with us online."}
          </p>
        </div>

        <div className="min-w-0">
          {showCountdown ? (
            <div>
              <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.16em] text-[#201e1d]/72">Starts in</p>
              <GatheringCountdown appearance="modernist" startsAt={occurrence.startsAt} />
            </div>
          ) : phase === "replay" ? (
            <div className="border-2 border-[#201e1d]/35 bg-[#e9eef2] p-7 sm:p-9">
              <Play className="size-10 text-[var(--modernist-blue)]" fill="currentColor" />
              <p className="mt-5 font-display text-3xl font-bold">Watch when you’re ready</p>
              <p className="mt-3 leading-7 text-[#201e1d]/65">Catch up on the full message and share it with someone who needs encouragement.</p>
            </div>
          ) : (
            <div className="border-2 border-[#201e1d]/35 bg-[#e9eef2] p-7 text-[#201e1d]/70 sm:p-9">
              This gathering has ended. A replay will appear here when it is available.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
