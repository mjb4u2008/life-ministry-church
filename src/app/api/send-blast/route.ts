import { NextRequest, NextResponse } from "next/server";
import { getSubscribers, getBlastLogs, addBlastLog } from "@/lib/data";
import { verifyToken } from "@/lib/auth";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// GET — return blast logs (requires auth)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const logs = await getBlastLogs();
    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Error fetching blast logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch blast logs" },
      { status: 500 }
    );
  }
}

// POST — send a blast message (requires auth)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subject, message, channels } = await request.json();

    if (!subject || !message || !channels || !Array.isArray(channels)) {
      return NextResponse.json(
        { error: "subject, message, and channels are required" },
        { status: 400 }
      );
    }

    const subscribers = await getSubscribers();
    const emailSubscribers = subscribers.filter(
      (s) => s.contactType === "email"
    );
    const phoneSubscribers = subscribers.filter(
      (s) => s.contactType === "phone"
    );

    let emailsSent = 0;
    let smsSent = 0;
    const errors: string[] = [];

    // ─── Send Emails via Resend ──────────────────────────────────────────────
    if (channels.includes("email") && emailSubscribers.length > 0) {
      if (!process.env.RESEND_API_KEY) {
        errors.push(
          "RESEND_API_KEY not configured — skipped email delivery"
        );
      } else {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        for (const subscriber of emailSubscribers) {
          try {
            await resend.emails.send({
              from: "L.I.F.E. Ministry <hello@lifeministry.com>",
              to: subscriber.contact,
              subject: subject,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                  <h1 style="color: #0a1a2f; font-size: 24px; margin-bottom: 20px;">${escapeHtml(subject)}</h1>
                  <p style="color: #4a6580; font-size: 16px; line-height: 1.6;">${escapeHtml(message).replace(/\n/g, "<br>")}</p>
                  <hr style="border: none; border-top: 1px solid #e0eaf3; margin: 30px 0;">
                  <p style="color: #4a6580; font-size: 12px;">L.I.F.E. Ministry — Lord Is Forever Emmanuel</p>
                  <p style="color: #4a6580; font-size: 12px;">Join us Sundays at 8:30 AM PST / 11:30 AM EST</p>
                </div>
              `,
            });
            emailsSent++;
          } catch (err) {
            const errMsg =
              err instanceof Error ? err.message : "Unknown error";
            errors.push(`Email to ${subscriber.contact}: ${errMsg}`);
          }
        }
      }
    }

    // ─── Send SMS via Twilio ─────────────────────────────────────────────────
    if (channels.includes("sms") && phoneSubscribers.length > 0) {
      if (
        !process.env.TWILIO_ACCOUNT_SID ||
        !process.env.TWILIO_AUTH_TOKEN ||
        !process.env.TWILIO_PHONE_NUMBER
      ) {
        errors.push(
          "Twilio credentials not configured — skipped SMS delivery"
        );
      } else {
        const twilio = (await import("twilio")).default;
        const twilioClient = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );

        for (const subscriber of phoneSubscribers) {
          try {
            await twilioClient.messages.create({
              body: `${subject}\n\n${message}\n\n— L.I.F.E. Ministry`,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: subscriber.contact,
            });
            smsSent++;
          } catch (err) {
            const errMsg =
              err instanceof Error ? err.message : "Unknown error";
            errors.push(`SMS to ${subscriber.contact}: ${errMsg}`);
          }
        }
      }
    }

    // ─── Log the blast ───────────────────────────────────────────────────────
    await addBlastLog({
      subject,
      message,
      channels,
      emailsSent,
      smsSent,
    });

    return NextResponse.json({ emailsSent, smsSent, errors });
  } catch (error) {
    console.error("Error sending blast:", error);
    return NextResponse.json(
      { error: "Failed to send blast" },
      { status: 500 }
    );
  }
}
