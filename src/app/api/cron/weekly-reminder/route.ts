import { NextRequest, NextResponse } from "next/server";
import { getContent, getSubscribers, addBlastLog } from "@/lib/data";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret or allow if from Vercel
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const content = await getContent();
    const subscribers = await getSubscribers();

    if (subscribers.length === 0) {
      return NextResponse.json({ message: "No subscribers to notify" });
    }

    // Build reminder message from This Sunday content
    const sundayInfo = content.thisSunday;
    const meetLink = content.googleMeetLink;

    const subject = sundayInfo.title
      ? `This Sunday: ${sundayInfo.title}`
      : "Sunday Service Reminder";

    let message = "";
    if (sundayInfo.title) {
      message += `${sundayInfo.title}\n\n`;
    }
    if (sundayInfo.scripture) {
      message += `Scripture: ${sundayInfo.scripture}\n\n`;
    }
    if (sundayInfo.description) {
      message += `${sundayInfo.description}\n\n`;
    }
    message += "Join us Sundays at 8:30 AM PST / 11:30 AM EST";
    if (meetLink) {
      message += `\n\nJoin online: ${meetLink}`;
    }

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
    if (emailSubscribers.length > 0 && process.env.RESEND_API_KEY) {
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
                <h1 style="color: #0a1a2f; font-size: 24px; margin-bottom: 20px;">${subject}</h1>
                <p style="color: #4a6580; font-size: 16px; line-height: 1.6;">${message.replace(/\n/g, "<br>")}</p>
                ${meetLink ? `<a href="${meetLink}" style="display: inline-block; background: #1a6fb5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; font-weight: 600;">Join Service Online</a>` : ""}
                <hr style="border: none; border-top: 1px solid #e0eaf3; margin: 30px 0;">
                <p style="color: #4a6580; font-size: 12px;">L.I.F.E. Ministry — Lord Is Forever Emmanuel</p>
                <p style="color: #4a6580; font-size: 12px;">Join us Sundays at 8:30 AM PST / 11:30 AM EST</p>
              </div>
            `,
          });
          emailsSent++;
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : "Unknown error";
          errors.push(`Email to ${subscriber.contact}: ${errMsg}`);
        }
      }
    } else if (emailSubscribers.length > 0) {
      errors.push("RESEND_API_KEY not configured — skipped email delivery");
    }

    // ─── Send SMS via Twilio ─────────────────────────────────────────────────
    if (
      phoneSubscribers.length > 0 &&
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    ) {
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
          const errMsg = err instanceof Error ? err.message : "Unknown error";
          errors.push(`SMS to ${subscriber.contact}: ${errMsg}`);
        }
      }
    } else if (phoneSubscribers.length > 0) {
      errors.push("Twilio credentials not configured — skipped SMS delivery");
    }

    // ─── Log the blast ───────────────────────────────────────────────────────
    await addBlastLog({
      subject: `[Auto] ${subject}`,
      message,
      channels: ["email", "sms"],
      emailsSent,
      smsSent,
    });

    return NextResponse.json({
      message: "Weekly reminder sent",
      emailsSent,
      smsSent,
      errors,
    });
  } catch (error) {
    console.error("Cron weekly reminder error:", error);
    return NextResponse.json(
      { error: "Failed to send weekly reminder" },
      { status: 500 }
    );
  }
}
