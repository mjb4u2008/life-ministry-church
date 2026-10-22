"use client";
import Image from "next/image";
import Link from "next/link";
import {useEffect,useState} from "react";
import type {PublicGatheringOccurrence,PublicGatheringsResponse} from "@/lib/gatherings";
import {GatheringCard} from "./GatheringCard";
import {GatheringHero} from "./GatheringHero";
import {useGatherings} from "./useGatherings";

export function currentPublicGathering(data:PublicGatheringsResponse,now:Date){
  const time=now.getTime();
  const unique=[...new Map([...(data.featured?[data.featured]:[]),...data.upcoming].map(item=>[item.id,item])).values()];
  const active=unique.filter(item=>item.status!=="completed"&&Date.parse(item.endsAt)>time).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt));
  return active[0]??data.recent[0]??(data.featured?.replayUrl?data.featured:null);
}
export function GatheringExperience({mode}:{mode:"home"|"watch"}){
  const {data,error,loading,retry}=useGatherings();
  const [now,setNow]=useState<Date|null>(null);
  useEffect(()=>{const first=window.setTimeout(()=>setNow(new Date()),0);const tick=window.setInterval(()=>setNow(new Date()),1000);return()=>{window.clearTimeout(first);window.clearInterval(tick);};},[]);
  const featured=data?(now?currentPublicGathering(data,now):data.featured):null;
  const findSeries=(item:PublicGatheringOccurrence)=>data?.series.find(series=>series.id===item.seriesId);
  if(!featured)return <section className="renewal-schedule-fallback" id="next-gathering">
    <Image className="renewal-hero-art" src="/images/renewal/living-water-hero.webp" alt="" fill sizes="100vw" preload/><div className="renewal-hero-shade"/>
    <div><span className="renewal-small-note">L.I.F.E. Ministry · Lord Is Forever Emmanuel</span><h1>{loading&&!data?"There’s a place for you here.":error?"Schedule temporarily unavailable":"We’re preparing our next gathering."}</h1><p aria-live="polite">{loading&&!data?"Loading gathering details…":error||"Wednesday and Sunday. Scripture, prayer, and a church family to grow with. Check back for the next gathering."}</p><div className="renewal-gathering-actions">{error?<button onClick={retry} className="renewal-primary" type="button">Try again</button>:<Link className="renewal-primary" href="/welcome">I’m new here</Link>}<Link className="renewal-text-link" href="/welcome">Get help joining</Link></div></div>
  </section>;
  const other=data!.upcoming.filter(item=>item.id!==featured.id&&Date.parse(item.endsAt)>(now?.getTime()??0)).slice(0,2);
  const recent=data!.recent.filter(item=>item.id!==featured.id);
  return <>
    {error&&<div className="renewal-stale-notice" role="status"><p>{error} Showing the last available schedule.</p><button onClick={retry} type="button">Refresh schedule</button></div>}
    <GatheringHero key={[featured.id,featured.joinUrl,featured.replayUrl].join("|")} occurrence={featured} series={findSeries(featured)} now={now??undefined} mode={mode}/>
    {mode==="watch"&&<>
      {other.length>0&&<section className="renewal-message-list renewal-container"><h2>Also coming up</h2><div className="renewal-message-grid">{other.map(item=><GatheringCard key={item.id} occurrence={item} series={findSeries(item)}/>)}</div></section>}
      <section className="renewal-message-list renewal-container"><h2>Past messages</h2><p>Make a little room for the Word.</p>{recent.length?<div className="renewal-message-grid">{recent.map(item=><GatheringCard key={item.id} occurrence={item} series={findSeries(item)}/>)}</div>:<p className="mt-6">{featured.status==="completed"?"No additional message recordings have been published yet.":"No message recordings have been published yet."}</p>}</section>
    </>}
  </>;
}
