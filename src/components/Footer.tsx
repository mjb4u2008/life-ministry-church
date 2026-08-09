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
    <footer className="bg-[#071521] text-white">
      <div className="mx-auto max-w-screen-xl px-5 py-16 sm:px-6 sm:py-20 lg:px-12">
        <div className="grid gap-12 border-b border-white/12 pb-14 md:grid-cols-[1.35fr_0.7fr_0.7fr]">
          <div className="max-w-md">
            <Link className="inline-flex items-center gap-3" href="/">
              <Image alt="L.I.F.E. Ministry" className="rounded-xl" height={52} src="/logo-water-cross.png" width={52} />
              <span className="font-display text-2xl font-black">L.I.F.E. Ministry</span>
            </Link>
            <p className="mt-5 text-base leading-7 text-white/62">
              Lord Is Forever Emmanuel. An online church family gathering every
              Wednesday and Sunday for Scripture, prayer, and real connection.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#e4b75d]">Join us</h2>
            <ul className="mt-5 space-y-3">
              {ministryLinks.map((link) => (
                <li key={link.href}>
                  <Link className="inline-flex min-h-11 items-center text-white/68 transition-colors hover:text-white" href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#e4b75d]">Learn more</h2>
            <ul className="mt-5 space-y-3">
              {learnLinks.map((link) => (
                <li key={link.href}>
                  <Link className="inline-flex min-h-11 items-center text-white/68 transition-colors hover:text-white" href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-7 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} L.I.F.E. Ministry</p>
          <p>Gathering online from Georgia · Times shown in Eastern Time</p>
        </div>
      </div>
    </footer>
  );
}
