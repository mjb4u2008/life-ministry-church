import { NextRequest, NextResponse } from "next/server";
import { addBlastLog, getBlastLogs } from "@/lib/data";
import { verifyToken } from "@/lib/auth";
import { MessagingRepository, unsubscribeUrl } from "@/lib/messaging";

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function tokenFrom(request: NextRequest) {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}

function json(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest) {
  const token = tokenFrom(request);
  if (!token || !verifyToken(token)) return json({ error: "Unauthorized" }, { status: 401 });
  try { return json({ logs: await getBlastLogs() }); }
  catch (error) {
    console.error("Blast log read failed", error instanceof Error ? error.name : "UnknownError");
    return json({ error: "Failed to fetch blast logs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = tokenFrom(request);
  if (!token || !verifyToken(token)) return json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const channels = Array.isArray(body.channels) ? [...new Set(body.channels)] : [];
    if (!subject || subject.length > 200 || !message || message.length > 10_000 || channels.length === 0 || channels.some((channel) => channel !== "email" && channel !== "sms")) {
      return json({ error: "Provide a subject, message, and valid delivery channels" }, { status: 400 });
    }

    const subscribers = await new MessagingRepository().getActiveSubscribers();
    const emailSubscribers = subscribers.filter((subscriber) => subscriber.contactType === "email");
    const phoneSubscribers = subscribers.filter((subscriber) => subscriber.contactType === "phone");
    let emailsSent = 0;
    let smsSent = 0;
    let emailFailures = 0;
    let smsFailures = 0;
    const errors: string[] = [];

    if (channels.includes("email") && emailSubscribers.length > 0) {
      if (!process.env.RESEND_API_KEY) errors.push("Email delivery is not configured");
      else {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        for (const subscriber of emailSubscribers) {
          try {
            const optOut = unsubscribeUrl(request.nextUrl.origin, subscriber.id);
            const result = await resend.emails.send({
              from: "L.I.F.E. Ministry <hello@lifeministry.com>",
              to: subscriber.contact,
              subject,
              html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px"><h1 style="color:#0a1a2f;font-size:24px;margin-bottom:20px">${escapeHtml(subject)}</h1><p style="color:#4a6580;font-size:16px;line-height:1.6">${escapeHtml(message).replace(/\n/g, "<br>")}</p><hr style="border:none;border-top:1px solid #e0eaf3;margin:30px 0"><p style="color:#4a6580;font-size:12px">L.I.F.E. Ministry — Lord Is Forever Emmanuel</p><p style="color:#4a6580;font-size:12px">You received this because you asked for ministry updates. <a href="${escapeHtml(optOut)}">Unsubscribe</a>.</p></div>`,
            });
            if (result.error) throw new Error("Provider rejected email");
            emailsSent += 1;
          } catch { emailFailures += 1; }
        }
      }
    }

    if (channels.includes("sms") && phoneSubscribers.length > 0) {
      if (process.env.TWILIO_STOP_SYNC_VERIFIED !== "true") {
        errors.push("Text-message delivery is disabled until STOP synchronization is verified");
      } else if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
        errors.push("Text-message delivery is not configured");
      } else {
        const twilio = (await import("twilio")).default;
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        for (const subscriber of phoneSubscribers) {
          try {
            await client.messages.create({
              body: `${subject}\n\n${message}\n\n— L.I.F.E. Ministry\nReply STOP to opt out.`,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: subscriber.contact,
            });
            smsSent += 1;
          } catch { smsFailures += 1; }
        }
      }
    }

    if (emailFailures) errors.push(`${emailFailures} email ${emailFailures === 1 ? "delivery" : "deliveries"} failed`);
    if (smsFailures) errors.push(`${smsFailures} text-message ${smsFailures === 1 ? "delivery" : "deliveries"} failed`);
    await addBlastLog({ subject, message, channels: channels as string[], emailsSent, smsSent });
    return json({ emailsSent, smsSent, errors });
  } catch (error) {
    console.error("Blast send failed", error instanceof Error ? error.name : "UnknownError");
    return json({ error: "Failed to send blast" }, { status: 500 });
  }
}
