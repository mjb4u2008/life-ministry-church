import type { MinistryEvent } from "./types";

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\r\n?|\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function utc(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function foldLine(line: string) {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let limit = 75;
  for (const character of line) {
    if (current && encoder.encode(current + character).length > limit) {
      parts.push(current);
      current = character;
      limit = 74;
    } else {
      current += character;
    }
  }
  if (current) parts.push(current);
  return parts.map((part, index) => index === 0 ? part : ` ${part}`).join("\r\n");
}

export function eventCalendar(event: MinistryEvent, now = new Date()) {
  const end = event.endsAt ?? new Date(Date.parse(event.startsAt) + 4 * 60 * 60_000).toISOString();
  const location = event.locationLabel ?? (event.locationType === "online" ? "Online" : "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LIFE Ministry//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcs(event.id)}@lifeministry`,
    `DTSTAMP:${utc(now.toISOString())}`,
    `DTSTART:${utc(event.startsAt)}`,
    `DTEND:${utc(end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description)}`,
    `LOCATION:${escapeIcs(location)}`,
    ...(event.registrationUrl ? [`URL:${event.registrationUrl}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].map(foldLine).join("\r\n");
}
