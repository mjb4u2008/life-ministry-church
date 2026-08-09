import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play, Radio } from "lucide-react";
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
  replay: "Latest message",
  ended: "Gathering complete",
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
  const isLiveState = phase === "joining" || phase === "live";
  const isWednesday = series?.themeKey === "wednesday";
  const gatheringName = series?.name ?? "L.I.F.E. Gathering";
  const title = occurrence.title || gatheringName;
  const titleId = `gathering-${occurrence.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

  if (mode === "home") {
    return (
      <section
        aria-labelledby={titleId}
        className="relative isolate overflow-hidden bg-[#071521] pt-[4.5rem] text-white md:pt-20"
        data-gathering-phase={phase}
        id="next-gathering"
      >
        <Image
          alt="An open Bible in a warm worship setting"
          className="-z-20 object-cover object-[67%_center]"
          fill
          priority
          sizes="100vw"
          src="/images/life-ministry-hero.jpg"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,21,33,0.98)_0%,rgba(7,21,33,0.89)_38%,rgba(7,21,33,0.35)_72%,rgba(7,21,33,0.16)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(7,21,33,0.92)_0%,transparent_50%)]" />

        <div className="mx-auto flex min-h-[calc(100svh-4.5rem)] max-w-screen-xl flex-col justify-end px-5 pb-0 pt-10 sm:px-6 sm:pt-14 lg:min-h-[720px] lg:px-12">
          <div className="max-w-3xl pb-8 sm:pb-10 lg:pb-12">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#e4b75d] sm:text-sm">
              L.I.F.E. Ministry · Online church
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-[clamp(3rem,7vw,6.5rem)] font-black leading-[0.9] tracking-[-0.045em] text-balance">
              God is with you, right where you are.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/76 sm:text-lg sm:leading-8">
              Worship, Scripture, and real community every Wednesday and Sunday—wherever you are.
            </p>
            <Link
              className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full border border-white/30 bg-white/5 px-6 py-3 font-bold text-white transition-colors hover:bg-white hover:text-[#071521]"
              href="/welcome"
            >
              I’m new here <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className={`-mx-5 grid gap-5 border-t px-5 py-5 sm:-mx-6 sm:px-6 sm:py-6 lg:-mx-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] lg:items-center lg:gap-12 lg:px-12 ${isLiveState ? "border-red-400/35 bg-[#9f2925]/95" : isWednesday ? "border-[#77dff4]/35 bg-[#0d4d69]/95" : "border-[#f4d690]/35 bg-[#b68935]/95 text-[#071521]"}`}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] ${isLiveState ? "bg-white text-[#9f2925]" : "bg-[#071521] text-white"}`}>
                  {isLiveState && <Radio className="size-3.5" />}
                  {phaseLabel[phase]}
                </span>
                <span className={`text-xs font-extrabold uppercase tracking-[0.16em] ${isLiveState || isWednesday ? "text-white/72" : "text-[#071521]/68"}`}>
                  {gatheringName}
                </span>
              </div>
              <h2 className="mt-3 break-words font-display text-2xl font-black leading-tight sm:text-3xl lg:text-4xl" id={titleId}>
                {title}
              </h2>
              <p className={`mt-2 text-base font-bold ${isLiveState || isWednesday ? "text-white/76" : "text-[#071521]/72"}`}>
                {formatGatheringDate(occurrence.startsAt)}
              </p>
              {occurrence.scripture && (
                <p className={`mt-2 text-sm font-bold ${isLiveState || isWednesday ? "text-white" : "text-[#071521]"}`}>
                  {occurrence.scripture}
                </p>
              )}
            </div>

            <div className="min-w-0">
              <GatheringActions occurrence={occurrence} tone={isLiveState || isWednesday ? "dark" : "gold"} />
              {showCountdown && phase === "upcoming" && (
                <div className="mt-5 sm:mt-6">
                  <p className={`mb-3 text-xs font-extrabold uppercase tracking-[0.16em] ${isWednesday ? "text-white/65" : "text-[#071521]/65"}`}>Starts in</p>
                  <GatheringCountdown startsAt={occurrence.startsAt} tone={isWednesday ? "dark" : "gold"} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative isolate overflow-hidden bg-[#071521] pt-20 text-white"
      data-gathering-phase={phase}
      id="next-gathering"
    >
      <Image
        alt="An open Bible in a warm worship setting"
        className="-z-20 object-cover object-[68%_center] opacity-55"
        fill
        priority
        sizes="100vw"
        src="/images/life-ministry-hero.jpg"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,21,33,0.98),rgba(7,21,33,0.66))]" />
      <div className="mx-auto grid min-h-[650px] max-w-screen-xl grid-cols-1 gap-10 px-5 py-20 sm:px-6 md:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)] lg:items-center lg:gap-16 lg:px-12">
        <div className="min-w-0">
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] ${isLiveState ? "bg-[#c8322b] text-white" : "bg-[#e4b75d] text-[#071521]"}`}>
            {isLiveState && <Radio className="size-3.5" />}
            {phaseLabel[phase]}
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.16em] text-white/62">{gatheringName}</p>
          <h1 className="mt-3 break-words font-display text-5xl font-black leading-[0.98] sm:text-6xl" id={titleId}>{title}</h1>
          {occurrence.scripture && <p className="mt-5 text-lg font-bold text-[#e4b75d]">{occurrence.scripture}</p>}
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
            {occurrence.description || "Come worship, pray, and spend time in God’s Word with us online."}
          </p>
          <p className="mt-5 text-base font-bold text-white/68">{formatGatheringDate(occurrence.startsAt)}</p>
          <div className="mt-8"><GatheringActions occurrence={occurrence} /></div>
        </div>

        <div className="min-w-0">
          {showCountdown ? (
            <div>
              <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.16em] text-white/55">Starts in</p>
              <GatheringCountdown startsAt={occurrence.startsAt} />
            </div>
          ) : phase === "replay" ? (
            <div className="rounded-[1.5rem] border border-white/15 bg-white/8 p-7 sm:p-9">
              <Play className="size-10 text-[#e4b75d]" fill="currentColor" />
              <p className="mt-5 font-display text-3xl font-bold">Watch when you’re ready</p>
              <p className="mt-3 leading-7 text-white/65">Catch up on the full message and share it with someone who needs encouragement.</p>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-white/15 bg-white/8 p-7 text-white/70 sm:p-9">
              This gathering has ended. A replay will appear here when it is available.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
