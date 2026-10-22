"use client";
import {useEffect,useState} from "react";
import type {PublicGatheringsResponse} from "@/lib/gatherings";

export function isPublicGatheringsResponse(value:unknown):value is PublicGatheringsResponse{
  if(!value||typeof value!=="object")return false;
  const item=value as Partial<PublicGatheringsResponse>;
  const valid=(entry:unknown)=>{
    if(!entry||typeof entry!=="object")return false;
    const row=entry as Record<string,unknown>;
    return ["id","seriesId","localDate","title","scripture","description","startsAt","endsAt"].every(key=>typeof row[key]==="string")&&Number.isFinite(Date.parse(row.startsAt as string))&&Date.parse(row.endsAt as string)>Date.parse(row.startsAt as string)&&["published","live","completed"].includes(row.status as string)&&["joinUrl","replayUrl","bannerUrl"].every(key=>row[key]===undefined||typeof row[key]==="string");
  };
  const validSeries=(entry:unknown)=>{
    if(!entry||typeof entry!=="object")return false;
    const row=entry as Record<string,unknown>;
    return typeof row.id==="string"&&typeof row.name==="string"&&typeof row.themeKey==="string";
  };
  return Array.isArray(item.series)&&item.series.every(validSeries)&&Array.isArray(item.upcoming)&&item.upcoming.every(valid)&&Array.isArray(item.recent)&&item.recent.every(valid)&&(item.featured===null||valid(item.featured));
}
export function nextGatheringRefresh(payload:PublicGatheringsResponse,now=Date.now()){
  const entries=[...(payload.featured?[payload.featured]:[]),...payload.upcoming];
  const boundaries=entries.flatMap(item=>[Date.parse(item.startsAt)-30*60000,Date.parse(item.startsAt),Date.parse(item.endsAt)]).filter(time=>time>now);
  return Math.max(250,Math.min(30000,...boundaries.map(time=>time-now+50)));
}
export function useGatherings(){
  const [data,setData]=useState<PublicGatheringsResponse|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  const [version,setVersion]=useState(0);
  useEffect(()=>{
    let stopped=false,timer:number|undefined,controller:AbortController|undefined,sequence=0;
    const load=async()=>{
      const request=++sequence;
      controller?.abort();
      const active=new AbortController();controller=active;
      const timeout=window.setTimeout(()=>active.abort("timeout"),8000);
      let delay=30000;
      try{
        const response=await fetch("/api/gatherings",{cache:"no-store",signal:active.signal});
        if(!response.ok)throw new Error("Schedule unavailable");
        const payload:unknown=await response.json();
        if(!isPublicGatheringsResponse(payload))throw new Error("Invalid schedule");
        if(!stopped&&request===sequence){setData(payload);setError(null);delay=nextGatheringRefresh(payload);}
      }catch{
        if(!stopped&&request===sequence)setError("We couldn’t refresh the gathering schedule. Check your connection and try again.");
      }finally{
        window.clearTimeout(timeout);
        if(!stopped&&request===sequence){setLoading(false);window.clearTimeout(timer);timer=window.setTimeout(()=>void load(),delay);}
      }
    };
    const refresh=()=>{if(document.visibilityState==="visible")void load();};
    void load();document.addEventListener("visibilitychange",refresh);window.addEventListener("focus",refresh);
    return()=>{stopped=true;sequence++;controller?.abort();window.clearTimeout(timer);document.removeEventListener("visibilitychange",refresh);window.removeEventListener("focus",refresh);};
  },[version]);
  return {data,error,loading,retry:()=>{setLoading(true);setVersion(value=>value+1);}};
}
