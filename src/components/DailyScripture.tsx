"use client";
import {useEffect,useState} from "react";
interface Scripture{verse:string;reference:string;reflection:string}
const fallback:Scripture={verse:"I am come that they might have life, and that they might have it more abundantly.",reference:"John 10:10",reflection:""};
export function DailyScriptureSection(){
  const [scripture,setScripture]=useState<Scripture>(fallback);
  useEffect(()=>{
    const controller=new AbortController();
    const timer=window.setTimeout(()=>controller.abort(),8000);
    fetch("/api/daily-scripture",{signal:controller.signal}).then(async response=>{
      if(!response.ok)return;const data=await response.json();
      if(typeof data?.verse==="string"&&data.verse.trim()&&typeof data.reference==="string")setScripture({verse:data.verse,reference:data.reference,reflection:typeof data.reflection==="string"?data.reflection:""});
    }).catch(()=>{}).finally(()=>window.clearTimeout(timer));
    return()=>{controller.abort();window.clearTimeout(timer);};
  },[]);
  return <section className="renewal-scripture"><p>A moment in the Word</p><blockquote>“{scripture.verse}”<cite>{scripture.reference}</cite></blockquote>{scripture.reflection&&<p className="renewal-scripture-reflection">{scripture.reflection}</p>}</section>;
}
