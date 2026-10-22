"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { SiteContent } from "@/lib/data";
import { GatheringExperience } from "@/components/gatherings";
import { TikTokCarousel } from "@/components/TikTokCarousel";
import { GatheringReminderPanel } from "@/components/renewal/GatheringReminderPanel";
import { DailyScriptureSection } from "@/components/DailyScripture";

export default function HomePage(){
  const [content,setContent]=useState<Partial<SiteContent>|null>(null);
  const [contentStatus,setContentStatus]=useState<"loading"|"ready"|"error">("loading");
  const [contentVersion,setContentVersion]=useState(0);
  useEffect(()=>{
    let active=true;
    const controller=new AbortController();
    const timeout=window.setTimeout(()=>controller.abort(),8000);
    fetch("/api/content",{signal:controller.signal}).then(async response=>{
      if(!response.ok)throw new Error("Content unavailable");
      const value=await response.json();
      if(!value||typeof value!=="object"||!Array.isArray(value.tiktokVideos))throw new Error("Content unavailable");
      setContent({...value,tiktokVideos:value.tiktokVideos.filter((item:unknown)=>item&&typeof item==="object"&&["id","url","title"].every(key=>typeof (item as Record<string,unknown>)[key]==="string"))});setContentStatus("ready");
    }).catch(()=>{if(active)setContentStatus("error");}).finally(()=>window.clearTimeout(timeout));
    return ()=>{active=false;controller.abort();window.clearTimeout(timeout);};
  },[contentVersion]);
  const videos=Array.isArray(content?.tiktokVideos)?content.tiktokVideos:[];
  return <main className="renewal-home">
    <GatheringExperience mode="home"/>
    <section className="renewal-heart renewal-container" id="heart">
      <div className="renewal-heart-grid">
        <div className="renewal-life-lockup"><h2>Welcome to LIFE.</h2><dl className="renewal-life-meaning" aria-label="LIFE means Lord Is Forever Emmanuel">{[["L","Lord"],["I","Is"],["F","Forever"],["E","Emmanuel"]].map(([letter,meaning])=><div key={letter}><dt>{letter}</dt><dd>{meaning}</dd></div>)}</dl></div>
        <div className="renewal-heart-copy"><p>We’re an online church family learning to follow Jesus in everyday life. Wherever you are, whatever your story, there’s room for you here.</p><p>We open Scripture, pray for one another, and grow in a love that becomes action. No perfect people. Just a faithful God.</p><Link className="renewal-text-link" href="/welcome">Get to know LIFE <ArrowUpRight size={19}/></Link></div>
      </div>
    </section>
    <section className="renewal-faith" id="beliefs" aria-labelledby="faith-title">
      <Image src="/images/renewal/trinity-light.webp" alt="Symbolic artwork of a dove above living water, beneath cross-shaped light" fill sizes="(max-width: 767px) 1780px, (max-width: 1460px) 1460px, 100vw"/>
      <div className="renewal-faith-shade"/>
      <div className="renewal-faith-content renewal-container"><h2 id="faith-title">Because<br/>He lives.</h2><div className="renewal-faith-copy"><p>Jesus gave His life for our sins.<br/>He rose again. And in Him, we have life.</p><p>That’s where our story begins. Following Jesus, loving our neighbors, and living out His Word—together.</p><p className="renewal-faith-trinity">One God. Father, Son & Holy Spirit.</p><Link className="renewal-text-link" href="/ask">Explore the Word <ArrowUpRight size={19}/></Link></div></div>
    </section>
    <section className="renewal-pastor renewal-container" id="pastor">
      <div className="renewal-pastor-heading"><h2>Meet Pastor Mike.</h2><p>A conversation about Jesus can change your day. Join Pastor Mike for Scripture, honest encouragement, and the kind of faith you can carry into real life.</p></div>
      {contentStatus==="ready"?<TikTokCarousel videos={videos} tiktokProfileUrl={content?.socialLinks?.tiktok} embedded/>:<div className="renewal-video-loading" role="status">{contentStatus==="loading"?"Loading Pastor Mike’s videos…":<><p>Pastor Mike’s videos couldn’t load right now.</p><button className="renewal-text-link" type="button" onClick={()=>{setContentStatus("loading");setContentVersion(value=>value+1);}}>Try loading videos again</button></>}</div>}
    </section>
    <DailyScriptureSection/>
    <section className="renewal-connections renewal-container" aria-label="Connect with LIFE">
      <Link className="renewal-connection" href="/community"><span><span className="renewal-connection-title">Ask for prayer.</span><span className="renewal-connection-description">For whatever you’re carrying.</span></span><ArrowUpRight aria-hidden="true" strokeWidth={1} /></Link>
      <Link className="renewal-connection" href="/welcome"><span><span className="renewal-connection-title">Talk with Pastor Mike.</span><span className="renewal-connection-description">A question, a conversation, a place to begin.</span></span><ArrowUpRight aria-hidden="true" strokeWidth={1} /></Link>
      <p className="renewal-connection-privacy">Prayer requests are private unless you choose to share.</p>
      <GatheringReminderPanel/>
    </section>
  </main>;
}
