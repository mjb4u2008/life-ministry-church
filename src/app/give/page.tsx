import { HeartHandshake, Sprout, Users } from "lucide-react";
import { ZeffyPanel } from "@/components/giving";

export default function GivePage() {
  return (
    <main className="min-h-screen bg-[#fafcff] pb-24 pt-20">
      <section className="bg-[#0a1a2f] px-4 py-20 text-center text-white sm:py-28">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00d4ff]">Support the ministry</p>
        <h1 className="mt-5 font-display text-5xl font-black sm:text-7xl">Give Generously</h1>
        <p className="mx-auto mt-5 max-w-2xl font-body text-lg leading-relaxed text-white/70">Giving is always optional. Your support helps L.I.F.E. Ministry gather, teach, care for people, and serve the community.</p>
      </section>
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20"><ZeffyPanel /></section>
      <section className="bg-[#f0f4f8] py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6"><h2 className="text-center font-display text-3xl font-bold text-[#0a1a2f]">What generosity supports</h2><div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {[
            { icon: Users, title: "Weekly ministry", text: "Online Wednesday and Sunday gatherings and teaching resources." },
            { icon: HeartHandshake, title: "Pastoral care", text: "Prayer, welcome, follow-up, and practical care for people." },
            { icon: Sprout, title: "Outreach", text: "Opportunities to encourage and serve the wider community." },
          ].map((item) => <div className="rounded-2xl bg-white p-6" key={item.title}><item.icon className="size-7 text-[#1a6fb5]" /><h3 className="mt-4 font-display text-xl font-bold text-[#0a1a2f]">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-[#4a6580]">{item.text}</p></div>)}
        </div></div>
      </section>
    </main>
  );
}
