import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function Footer(){
  return <footer className="renewal-footer">
    <div className="renewal-footer-directory">
      <div><Link href="/watch" className="renewal-footer-gather">Gather with us <ArrowUpRight size={30} strokeWidth={1}/></Link><p className="renewal-footer-times">Sunday mornings. Wednesday evenings.<br/>Wherever you are, we gather online.</p></div>
      <nav className="renewal-footer-links" aria-label="Footer navigation"><Link href="/welcome">Your first visit</Link><Link href="/ask">Ask the Word</Link><Link href="/community">Prayer & care</Link><Link href="/watch">Past messages</Link><Link href="/events">Events</Link><Link href="/give">Give</Link></nav>
    </div>
    <div className="renewal-footer-wordmark" aria-hidden="true">LIFE</div>
    <div className="renewal-footer-bottom"><span>Lord Is Forever Emmanuel.</span><span>© {new Date().getFullYear()} L.I.F.E. Ministry</span><Link href="/admin">Pastor’s desk</Link></div>
  </footer>;
}
