import type { SiteContent } from "./data";

export class WednesdayValidationError extends Error {}

export function validateWednesdayContent(value: unknown): Partial<SiteContent> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new WednesdayValidationError("Content must be an object.");
  const updates = { ...value } as Partial<SiteContent>;
  if ("thisWednesday" in updates) {
    const message = updates.thisWednesday;
    if (!message || typeof message !== "object" || Array.isArray(message)) throw new WednesdayValidationError("Wednesday details are invalid.");
    for (const [field, limit] of [["date", 10], ["title", 60], ["scripture", 40], ["description", 300]] as const) {
      if (typeof message[field] !== "string" || message[field].length > limit) throw new WednesdayValidationError(`Wednesday ${field} is invalid.`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(message.date) || Number.isNaN(Date.parse(message.date)) || new Date(message.date).toISOString().slice(0, 10) !== message.date || new Date(`${message.date}T12:00:00Z`).getUTCDay() !== 3) {
      throw new WednesdayValidationError("Choose a valid Wednesday date.");
    }
    updates.thisWednesday = { date: message.date, title: message.title.trim(), scripture: message.scripture.trim(), description: message.description.trim() };
  }
  if ("wednesdayMeetLink" in updates) {
    if (typeof updates.wednesdayMeetLink !== "string") throw new WednesdayValidationError("Wednesday meeting link is invalid.");
    const raw = updates.wednesdayMeetLink.trim();
    if (raw) {
      try {
        const url = new URL(raw);
        if (raw.length > 2048 || url.protocol !== "https:" || url.hostname !== "meet.google.com" || url.username || url.password || url.port || url.hash || !/^\/(?:[a-z]{3}-[a-z]{4}-[a-z]{3}|lookup\/[a-zA-Z0-9_-]+)\/?$/.test(url.pathname)) throw new Error("Invalid link");
      } catch { throw new WednesdayValidationError("Use a full HTTPS Google Meet link, or leave it blank to use Sunday's link."); }
    }
    updates.wednesdayMeetLink = raw;
  }
  return updates;
}
