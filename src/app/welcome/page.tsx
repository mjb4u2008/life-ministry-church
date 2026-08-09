import { CameraOff, HeartHandshake, MonitorPlay, MicOff } from "lucide-react";
import Link from "next/link";
import { WelcomeForm } from "@/components/care";

export default function WelcomePage() {
  return (
    <main className="min-h-screen bg-[#fafcff] pb-24 pt-28">
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-[#1a6fb5]">First time?</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-black text-[#0a1a2f] sm:text-6xl">Come exactly as you are.</h1>
        <p className="mt-5 max-w-2xl font-body text-lg leading-relaxed text-[#4a6580]">L.I.F.E. Ministry meets online through Google Meet. You can listen quietly, keep your camera off, and take your time getting comfortable.</p>
        <Link className="mt-7 inline-flex min-h-12 items-center rounded-full bg-[#071521] px-6 py-3 font-body font-bold text-white hover:bg-[#1677a8]" href="/watch">
          See the next gathering
        </Link>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: MonitorPlay, title: "Online", text: "Join from Chrome on your phone or computer." },
            { icon: MicOff, title: "No pressure", text: "You never have to speak before you’re ready." },
            { icon: CameraOff, title: "Camera optional", text: "Keeping your camera off is completely fine." },
            { icon: HeartHandshake, title: "You are welcome", text: "Come with questions, faith, doubt, or hope." },
          ].map((item) => (
            <div className="rounded-2xl border border-[#dce8f2] bg-white p-5" key={item.title}>
              <item.icon className="size-6 text-[#1a6fb5]" />
              <h2 className="mt-3 font-display text-xl font-bold text-[#0a1a2f]">{item.title}</h2>
              <p className="mt-2 font-body text-sm text-[#4a6580]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto mt-16 max-w-3xl px-4 sm:px-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-10">
          <h2 className="font-display text-3xl font-bold text-[#0a1a2f]">Let us welcome you personally</h2>
          <p className="mt-3 font-body text-[#4a6580]">Optional: send Pastor Mike a private note so he can say hello and help you get connected.</p>
          <div className="mt-7"><WelcomeForm /></div>
        </div>
      </section>
    </main>
  );
}
