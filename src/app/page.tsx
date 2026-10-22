"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Heart, Waves } from "lucide-react";
import type { SiteContent } from "@/lib/data";
import { GatheringExperience } from "@/components/gatherings";
import { TikTokCarousel } from "@/components/TikTokCarousel";
import { ReminderSignup } from "@/components/ReminderSignup";
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
      <p className="renewal-intro">Lord Is Forever Emmanuel.<br/>God with us. In every season.</p>
      <div className="renewal-heart-grid">
        <h2>A life with Jesus.<br/>A place for you.</h2>
        <div><p>We’re an online church family learning to follow Jesus in everyday life. Wherever you are, whatever your story, there’s room for you here.</p><p>We open Scripture, pray for one another, and grow in a love that becomes action. No perfect people. Just a faithful God.</p><Link className="renewal-text-link" href="/welcome">Get to know L.I.F.E. <ArrowUpRight size={19}/></Link></div>
      </div>
      <div className="renewal-life-meaning" aria-label="L.I.F.E. means Lord Is Forever Emmanuel"><span><b>L</b>Lord</span><span><b>I</b>Is</span><span><b>F</b>Forever</span><span><b>E</b>Emmanuel</span></div>
    </section>
    <section className="renewal-gospel" id="beliefs">
      <div className="renewal-gospel-image"><Image src="/images/renewal/trinity-light.webp" alt="Symbolic artwork of a dove above living water, beneath cross-shaped light" fill sizes="(max-width: 800px) 100vw, 60vw"/></div>
      <div className="renewal-gospel-copy"><span className="renewal-small-note">The heart of our faith</span><h2>Love that gave<br/>everything.</h2><p>Jesus gave His life for our sins and rose again, opening the way to new life with God. We don’t earn His love. We receive it—and let it change how we live.</p><p>Our response is love and obedience to Jesus: loving our neighbors, caring for one another, and walking in His Word.</p><div className="renewal-trinity"><Waves size={22}/><p>One God.<br/><strong>Father, Son & Holy Spirit.</strong></p></div><Link className="renewal-text-link" href="/ask">Explore the Word <ArrowUpRight size={19}/></Link></div>
    </section>
    <section className="renewal-pastor renewal-container" id="pastor">
      <div className="renewal-pastor-heading"><h2>Meet Pastor Mike.</h2><p>A conversation about Jesus can change your day. Join Pastor Mike for Scripture, honest encouragement, and the kind of faith you can carry into real life.</p></div>
      {contentStatus==="ready"?<TikTokCarousel videos={videos} tiktokProfileUrl={content?.socialLinks?.tiktok} embedded/>:<div className="renewal-video-loading" role="status">{contentStatus==="loading"?"Loading Pastor Mike’s videos…":<><p>Pastor Mike’s videos couldn’t load right now.</p><button className="renewal-text-link" type="button" onClick={()=>{setContentStatus("loading");setContentVersion(value=>value+1);}}>Try loading videos again</button></>}</div>}
    </section>
    <DailyScriptureSection/>
    <section className="renewal-care renewal-container">
      <Heart size={30} strokeWidth={1.2}/><h2>You don’t have to<br/>carry it alone.</h2><p>A prayer. A question. A difficult week.<br/>We’re here to walk with you.</p>
      <div className="renewal-care-actions"><Link href="/community" className="renewal-primary">Ask for prayer <ArrowUpRight size={18}/></Link><Link href="/welcome" className="renewal-text-link">Connect with Pastor Mike</Link></div>
      <span className="renewal-small-note">Prayer requests are private unless you choose to share.</span>
    </section>
    <section className="renewal-reminders" id="reminded"><div className="renewal-container renewal-reminder-grid"><div><h2>A little reminder.<br/>A moment together.</h2><p>Make room for the Word in your week. Choose an email or a text before our next gathering.</p></div><ReminderSignup signupContext="homepage"/></div></section>
  </main>;
}
