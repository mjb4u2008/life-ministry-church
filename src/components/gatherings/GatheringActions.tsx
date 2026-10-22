"use client";
import { useState } from "react";
import { ArrowUpRight,Check,Copy,Play } from "lucide-react";
import type { PublicGatheringOccurrence } from "@/lib/gatherings";

export function GatheringActions({occurrence,reminderHref="/watch#reminded",now=new Date()}:{occurrence:PublicGatheringOccurrence;reminderHref?:string;now?:Date}){
  const [copied,setCopied]=useState(false);
  const [copyError,setCopyError]=useState(false);
  const time=now.getTime(), ended=time>=Date.parse(occurrence.endsAt)||occurrence.status==="completed", live=!ended&&time>=Date.parse(occurrence.startsAt);
  const copy=async()=>{try{await navigator.clipboard.writeText(occurrence.joinUrl!);setCopied(true);setCopyError(false);}catch{setCopyError(true);}};
  if(!ended&&occurrence.joinUrl)return <div className="renewal-gathering-actions">
    <a className="renewal-primary" href={occurrence.joinUrl} target="_blank" rel="noopener noreferrer" aria-label={live?"Join on Google Meet — join us live":"Join on Google Meet — the room is open"}>{live&&<span className="renewal-live-dot" aria-hidden="true"/>}{live?"Join us live":"Enter the room"}<ArrowUpRight size={19}/></a>
    <button className="renewal-copy" onClick={()=>void copy()} type="button" aria-label={copied?"Join link copied":"Copy join link"}>{copied?<Check size={17}/>:<Copy size={17}/>}<span>{copied?"Copied":"Copy link"}</span></button>
    {copyError&&<p role="status" className="renewal-small-note">Use the Join button to open the gathering.</p>}
  </div>;
  if(ended&&occurrence.replayUrl)return <a className="renewal-primary" href={occurrence.replayUrl} target="_blank" rel="noopener noreferrer">Watch replay <Play size={17}/></a>;
  return <a className="renewal-primary" href={reminderHref}>Get a reminder <ArrowUpRight size={19}/></a>;
}
