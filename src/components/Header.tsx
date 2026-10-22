"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, Music2, X } from "lucide-react";

const links = [{href:"/watch",label:"Gatherings"},{href:"/#heart",label:"Our heart"},{href:"/#pastor",label:"Pastor Mike"},{href:"/ask",label:"Ask the Word"}];

export function Header() {
  const pathname = usePathname();
  const [open,setOpen] = useState(false);
  const [playing,setPlaying] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e:KeyboardEvent) => { if(e.key==="Escape"){setOpen(false);buttonRef.current?.focus();} };
    document.addEventListener("keydown",close);
    return () => document.removeEventListener("keydown",close);
  },[open]);
  const toggleAudio = async () => {
    const audio=audioRef.current;
    if(!audio)return;
    if(playing){audio.pause();setPlaying(false);return;}
    try{audio.volume=0.2;await audio.play();setPlaying(true);}catch{setPlaying(false);}
  };
  if(pathname.startsWith("/admin"))return <header className="renewal-admin-header">
    <Link href="/" className="renewal-wordmark">L.I.F.E. <span>Ministry</span></Link>
    <nav aria-label="Admin navigation"><Link href="/admin">Pastor’s desk</Link><Link href="/" target="_blank" rel="noopener noreferrer">View website <ArrowUpRight size={15}/></Link></nav>
  </header>;
  return <header className={"renewal-header"+(pathname==="/"?" renewal-header--home":"")}>
    <a className="renewal-skip" href="#main-content">Skip to content</a>
    <Link href="/" className="renewal-brand" aria-label="L.I.F.E. Ministry home" onClick={()=>setOpen(false)}>
      <Image src="/images/renewal/water-cross-mark.webp" alt="" width={44} height={52} className="renewal-brand-mark"/>
      <span className="renewal-wordmark">L.I.F.E.<span>Ministry</span></span>
    </Link>
    <nav className="renewal-desktop-nav" aria-label="Main navigation">{links.map(link=><Link key={link.href} href={link.href} aria-current={pathname===link.href?"page":undefined}>{link.label}</Link>)}</nav>
    <div className="renewal-header-actions"><Link href="/watch" className="renewal-header-join" onClick={()=>setOpen(false)}>Join a gathering <ArrowUpRight size={16}/></Link>
      <button ref={buttonRef} className="renewal-menu-button" type="button" onClick={()=>setOpen(!open)} aria-expanded={open} aria-controls="mobile-navigation" aria-label={open?"Close menu":"Open menu"}>{open?<X size={24}/>:<Menu size={24}/>}</button>
    </div>
    <audio ref={audioRef} loop preload="none"><source src="/audio/ambient.mp3" type="audio/mpeg"/></audio>
    {open&&<nav className="renewal-mobile-nav" id="mobile-navigation" aria-label="Mobile navigation">
      {[...links,{href:"/welcome",label:"I’m new here"},{href:"/community",label:"Prayer & community"},{href:"/events",label:"Events"},{href:"/give",label:"Give"}].map(link=><Link key={link.href} href={link.href} onClick={()=>setOpen(false)}>{link.label}<ArrowUpRight size={19}/></Link>)}
      <button onClick={()=>void toggleAudio()} aria-pressed={playing} type="button"><Music2 size={18}/>{playing?"Pause ambient music":"Play ambient music"}</button>
    </nav>}
  </header>;
}
