import Link from "next/link";
import { verifyUnsubscribeToken } from "@/lib/messaging";

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; status?: string }>;
}) {
  const { token, status } = await searchParams;
  let validToken = false;
  try { validToken = Boolean(verifyUnsubscribeToken(token)); }
  catch { validToken = false; }

  return (
    <main className="min-h-screen bg-[#f0f4f8] px-4 pb-20 pt-32">
      <div className="mx-auto max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm sm:p-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1a6fb5]">L.I.F.E. Ministry</p>
        {status === "success" ? (
          <><h1 className="mt-4 font-display text-3xl font-black text-[#0a1a2f]">You’re unsubscribed</h1><p className="mt-4 leading-relaxed text-[#4a6580]">We will no longer send ministry updates to this contact. You can sign up again anytime.</p></>
        ) : status === "invalid" || !validToken ? (
          <><h1 className="mt-4 font-display text-3xl font-black text-[#0a1a2f]">This link is not valid</h1><p className="mt-4 leading-relaxed text-[#4a6580]">The unsubscribe link may be incomplete or no longer match the ministry’s current security key.</p></>
        ) : (
          <><h1 className="mt-4 font-display text-3xl font-black text-[#0a1a2f]">Stop ministry updates?</h1><p className="mt-4 leading-relaxed text-[#4a6580]">Confirm below and we will suppress this contact from future email reminders and announcements.</p><form action="/api/unsubscribe" className="mt-8" method="post"><input name="token" type="hidden" value={token} /><button className="min-h-12 w-full rounded-xl bg-[#0a1a2f] px-5 py-3 font-bold text-white" type="submit">Unsubscribe</button></form></>
        )}
        <Link className="mt-7 inline-block font-semibold text-[#1a6fb5] underline underline-offset-4" href="/">Return home</Link>
      </div>
    </main>
  );
}
