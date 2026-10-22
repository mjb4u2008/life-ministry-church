"use client";
import { useEffect,useState } from "react";
export function GatheringCountdown({startsAt}:{startsAt:string}){
  const [now,setNow]=useState<number|null>(null);
  useEffect(()=>{const tick=()=>setNow(Date.now());const first=window.setTimeout(tick,0);const timer=window.setInterval(tick,1000);return()=>{window.clearTimeout(first);window.clearInterval(timer);};},[]);
  const left=now===null?null:Math.max(0,Math.floor((Date.parse(startsAt)-now)/1000));
  const units=left===null?[null,null,null,null]:[Math.floor(left/86400),Math.floor(left%86400/3600),Math.floor(left%3600/60),left%60];
  return <div className="renewal-countdown" aria-label="Time until gathering" role="timer" aria-live="off">{units.map((value,index)=><div key={index}><strong>{value===null?"–":String(value).padStart(2,"0")}</strong><span>{["Days","Hours","Mins","Secs"][index]}</span></div>)}</div>;
}
