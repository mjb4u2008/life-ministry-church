"use client";
import Image from "next/image";
import Link from "next/link";
import type { PublicGatheringOccurrence,PublicGatheringSeries } from "@/lib/gatherings";
import { GatheringActions } from "./GatheringActions";
import { GatheringCountdown } from "./GatheringCountdown";
import { formatGatheringDate } from "./GatheringCard";

export type GatheringPhase="upcoming"|"joining"|"live"|"replay"|"ended";
export function getGatheringPhase(occurrence:PublicGatheringOccurrence,now=new Date()):GatheringPhase{
  const time=now.getTime();
  if(time>=Date.parse(occurrence.endsAt)||occurrence.status==="completed")return occurrence.replayUrl?"replay":"ended";
  if(time>=Date.parse(occurrence.startsAt))return "live";
  return occurrence.joinUrl?"joining":"upcoming";
}
const labels:Record<GatheringPhase,string>={upcoming:"Next gathering",joining:"The room is open",live:"Live now",replay:"Latest message",ended:"Gathering complete"};

export function GatheringHero({occurrence,series,now,mode="home"}:{occurrence:PublicGatheringOccurrence;series?:PublicGatheringSeries;now?:Date;mode?:"home"|"watch"}){
  const phase=getGatheringPhase(occurrence,now);
  const name=series?.name??"L.I.F.E. Ministry";
  return <section className={"renewal-hero"+(mode==="watch"?" renewal-hero--watch":"")+(occurrence.title.length>75?" renewal-hero--long":"")} id="next-gathering" data-gathering-phase={phase} aria-labelledby="gathering-title">
    <Image className="renewal-hero-art" src="/images/renewal/living-water-hero.webp" alt="A cross formed from living water rises above a dark ocean at dawn" fill sizes="(max-width: 767px) max(1104px, 178svh), (max-aspect-ratio: 16/9) max(1156px, 178svh), 100vw" preload/>
    <div className="renewal-hero-shade"/>
    <div className="renewal-hero-note"><span>Wherever you are,<br/>you belong here.</span><Link href="/welcome">Your first visit <span aria-hidden="true">↗</span></Link></div>
    <div className="renewal-hero-content">
      <div className="renewal-hero-main">
        <div className="renewal-gathering-label" role="status" aria-live="polite"><span className={phase==="live"?"renewal-live-dot":"renewal-status-dot"} aria-hidden="true"/><span>{labels[phase]}</span><span className="renewal-label-divider"/><span>{name}</span></div>
        <h1 id="gathering-title">{occurrence.title||name}</h1>
        {occurrence.scripture&&<p className="renewal-hero-scripture">{occurrence.scripture}</p>}
        <p className="renewal-hero-date">{occurrence.dateUnknown?"Recorded message":formatGatheringDate(occurrence.startsAt)}</p>
        <GatheringActions occurrence={occurrence} now={now} reminderHref={mode==="home"?"#reminded":"/watch#reminded"}/>
      </div>
      <div className="renewal-hero-side">
        {(phase==="upcoming"||phase==="joining")?<><p>We gather in</p><GatheringCountdown startsAt={occurrence.startsAt}/></>:phase==="live"?<p className="renewal-live-invitation">The Word is open.<br/>Come join the conversation.</p>:phase==="replay"?<p>Make a little room<br/>for the Word today.</p>:<p>This gathering has ended.<br/>We’ll gather again soon.</p>}
        <span className="renewal-hero-footnote">{phase==="joining"?"The room opens before the message begins.":"Online on Google Meet · Eastern Time"}</span>
      </div>
    </div>
  </section>;
}
