import Image from "next/image";
import Link from "next/link";

const ministryLinks = [
  { href: "/watch", label: "Join or watch" },
  { href: "/welcome", label: "I’m new" },
  { href: "/community", label: "Prayer & care" },
  { href: "/events", label: "Events" },
];

const learnLinks = [
  { href: "/#heart", label: "What L.I.F.E. means" },
  { href: "/#pastor", label: "Meet Pastor Mike" },
  { href: "/ask", label: "Ask The Word" },
  { href: "/give", label: "Give" },
];

export function Footer() {
  return (
    <footer className="life-modernist border-t-2 border-[#201e1d] bg-[#f3f2f2] text-[#201e1d] [font-family:var(--font-archivo)]">
      <div className="mx-auto max-w-[1200px] px-5 py-12 sm:px-6 sm:py-16 lg:px-[clamp(2rem,5vw,4.5rem)]">
        <div className="grid border-y-2 border-[#201e1d] md:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div className="py-9 md:border-r-2 md:border-[#201e1d] md:py-12 md:pr-10">
            <Link className="inline-flex items-center gap-3" href="/">
              <Image alt="L.I.F.E. Ministry" className="border-2 border-[#201e1d] bg-white" height={52} src="/logo-water-cross.png" width={52} />
              <span className="text-2xl font-extrabold uppercase tracking-[-0.04em]">L.I.F.E. Ministry</span>
            </Link>
            <p className="mt-6 max-w-lg text-base leading-7 text-[#201e1d]/75">
              Lord Is Forever Emmanuel. An online church family gathering every
              Wednesday and Sunday for Scripture, prayer, and real connection.
            </p>
          </div>

          <div className="border-t-2 border-[#201e1d] py-9 md:border-t-0 md:border-r-2 md:px-8 md:py-12">
            <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#146fa3]">Join us</h2>
            <ul className="mt-4">
              {ministryLinks.map((link) => (
                <li className="border-b border-[#201e1d]/35" key={link.href}>
                  <Link className="inline-flex min-h-11 items-center font-semibold text-[#201e1d]/75 transition-colors hover:text-[#146fa3]" href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t-2 border-[#201e1d] py-9 md:border-t-0 md:pl-8 md:py-12">
            <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#146fa3]">Learn more</h2>
            <ul className="mt-4">
              {learnLinks.map((link) => (
                <li className="border-b border-[#201e1d]/35" key={link.href}>
                  <Link className="inline-flex min-h-11 items-center font-semibold text-[#201e1d]/75 transition-colors hover:text-[#146fa3]" href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-sm font-semibold text-[#201e1d]/65 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} L.I.F.E. Ministry</p>
          <p>Gathering online from Georgia · Times shown in Eastern Time</p>
        </div>
      </div>
    </footer>
  );
}
