import { NextRequest, NextResponse } from "next/server";
import { addBlastLog } from "@/lib/data";
import { GatheringRepository, serializePublicGatherings } from "@/lib/gatherings";
import { MessagingRepository, unsubscribeUrl } from "@/lib/messaging";

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function json(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) return json({ error: "Cron secret not configured" }, { status: 500 });
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const publicGatherings = serializePublicGatherings(await new GatheringRepository().getEffectiveStore(now), now);
    const featured = publicGatherings.featured;
    const gathering = featured && Date.parse(featured.endsAt) > now.getTime() ? featured : publicGatherings.upcoming[0];
    if (!gathering) return json({ message: "No upcoming gathering to announce" });
    const series = publicGatherings.series.find((item) => item.id === gathering.seriesId);
    const gatheringName = series?.name ?? "Online Gathering";
    const subject = gathering.title ? `${gatheringName}: ${gathering.title}` : `${gatheringName} Reminder`;
    const details = [
      gathering.title,
      gathering.scripture ? `Scripture: ${gathering.scripture}` : "",
      gathering.description,
      `Join details: ${new URL(`/gatherings/${series?.slug ?? "sunday"}`, request.nextUrl.origin).toString()}`,
    ].filter(Boolean).join("\n\n");

    const subscribers = await new MessagingRepository().getActiveSubscribers(now);
    if (subscribers.length === 0) return json({ message: "No active subscribers to notify" });
    const emailSubscribers = subscribers.filter((subscriber) => subscriber.contactType === "email");
    const phoneSubscribers = subscribers.filter((subscriber) => subscriber.contactType === "phone");
    let emailsSent = 0;
    let smsSent = 0;
    let emailFailures = 0;
    let smsFailures = 0;
    const errors: string[] = [];

    if (emailSubscribers.length && process.env.RESEND_API_KEY) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      for (const subscriber of emailSubscribers) {
        try {
          const optOut = unsubscribeUrl(request.nextUrl.origin, subscriber.id);
          const result = await resend.emails.send({
            from: "L.I.F.E. Ministry <hello@lifeministry.com>",
            to: subscriber.contact,
            subject,
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px"><h1 style="color:#0a1a2f;font-size:24px;margin-bottom:20px">${escapeHtml(subject)}</h1><p style="color:#4a6580;font-size:16px;line-height:1.6">${escapeHtml(details).replace(/\n/g, "<br>")}</p><hr style="border:none;border-top:1px solid #e0eaf3;margin:30px 0"><p style="color:#4a6580;font-size:12px">L.I.F.E. Ministry — Lord Is Forever Emmanuel</p><p style="color:#4a6580;font-size:12px">You received this because you asked for gathering reminders. <a href="${escapeHtml(optOut)}">Unsubscribe</a>.</p></div>`,
          });
          if (result.error) throw new Error("Provider rejected email");
          emailsSent += 1;
        } catch { emailFailures += 1; }
      }
    } else if (emailSubscribers.length) errors.push("Email delivery is not configured");

    if (phoneSubscribers.length && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      const twilio = (await import("twilio")).default;
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      for (const subscriber of phoneSubscribers) {
        try {
          await client.messages.create({
            body: `${subject}\n\n${details}\n\n— L.I.F.E. Ministry\nReply STOP to opt out.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: subscriber.contact,
          });
          smsSent += 1;
        } catch { smsFailures += 1; }
      }
    } else if (phoneSubscribers.length) errors.push("Text-message delivery is not configured");

    if (emailFailures) errors.push(`${emailFailures} email ${emailFailures === 1 ? "delivery" : "deliveries"} failed`);
    if (smsFailures) errors.push(`${smsFailures} text-message ${smsFailures === 1 ? "delivery" : "deliveries"} failed`);
    await addBlastLog({ subject: `[Auto] ${subject}`, message: details, channels: ["email", "sms"], emailsSent, smsSent });
    return json({ message: "Gathering reminder sent", emailsSent, smsSent, errors });
  } catch (error) {
    console.error("Scheduled reminder failed", error instanceof Error ? error.name : "UnknownError");
    return json({ error: "Failed to send gathering reminder" }, { status: 500 });
  }
}
