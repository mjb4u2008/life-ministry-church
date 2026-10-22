import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function Footer(){
  return <footer className="renewal-footer">
    <div className="renewal-footer-top">
      <div className="renewal-footer-brand"><Image src="/images/renewal/water-cross-mark.webp" alt="L.I.F.E. living-water cross" width={58} height={70}/><p>Lord Is Forever<br/><span>Emmanuel.</span></p></div>
      <p>An online church family.<br/>Rooted in Jesus. Growing together.</p>
      <Link href="/watch" className="renewal-link-light">Come as you are <ArrowUpRight size={19}/></Link>
    </div>
    <nav className="renewal-footer-links" aria-label="Footer navigation"><Link href="/watch">Join or watch</Link><Link href="/welcome">Your first visit</Link><Link href="/community">Prayer & care</Link><Link href="/ask">Ask the Word</Link><Link href="/events">Events</Link><Link href="/give">Give</Link></nav>
    <div className="renewal-footer-bottom"><span>© {new Date().getFullYear()} L.I.F.E. Ministry</span><span>Wednesdays & Sundays · Online on Google Meet</span><Link href="/admin">Pastor’s desk</Link></div>
  </footer>;
}
