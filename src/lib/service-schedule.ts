export interface SessionMessage {
  date?: string;
  title?: string;
  scripture?: string;
  description?: string;
}

export interface ServiceContent {
  serviceSchedule?: { dayOfWeek: number; hour: number; minute: number; timezone: string };
  weeklyMessage?: SessionMessage;
  thisSunday?: SessionMessage;
  thisWednesday?: SessionMessage;
  googleMeetLink?: string;
  meetLink?: string;
  wednesdayMeetLink?: string;
}

export interface WeeklyService {
  kind: "sunday" | "wednesday";
  day: "Sunday" | "Wednesday";
  date: string;
  startsAt: Date;
  endsAt: Date;
  isLive: boolean;
  title: string;
  scripture: string;
  description: string;
  meetLink: string;
  scheduleLabel: string;
  weeklyScheduleLabel: string;
  countdown: { d: number; h: number; m: number; s: number };
}

const EASTERN = "America/New_York";
const DEFAULT_MEET = "https://meet.google.com/hqk-sryh-ado";

function localParts(date: Date, timezone: string) {
  const values = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const read = (name: Intl.DateTimeFormatPartTypes) => Number(values.find((part) => part.type === name)?.value);
  return { year: read("year"), month: read("month"), day: read("day"), hour: read("hour"), minute: read("minute"), second: read("second") };
}

function wallTime(year: number, month: number, day: number, hour: number, minute: number, timezone: string) {
  const desired = Date.UTC(year, month - 1, day, hour, minute);
  let instant = desired;
  for (let attempt = 0; attempt < 3; attempt++) {
    const actual = localParts(new Date(instant), timezone);
    instant += desired - Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
  }
  return new Date(instant);
}

function occurrence(now: Date, weekday: number, hour: number, minute: number, duration: number, timezone: string) {
  const local = localParts(now, timezone);
  const calendar = new Date(Date.UTC(local.year, local.month - 1, local.day));
  calendar.setUTCDate(calendar.getUTCDate() + (weekday - calendar.getUTCDay() + 7) % 7);
  let startsAt = wallTime(calendar.getUTCFullYear(), calendar.getUTCMonth() + 1, calendar.getUTCDate(), hour, minute, timezone);
  if (now.getTime() >= startsAt.getTime() + duration * 60_000) {
    calendar.setUTCDate(calendar.getUTCDate() + 7);
    startsAt = wallTime(calendar.getUTCFullYear(), calendar.getUTCMonth() + 1, calendar.getUTCDate(), hour, minute, timezone);
  }
  return { startsAt, endsAt: new Date(startsAt.getTime() + duration * 60_000) };
}

function dateString(date: Date) {
  const parts = localParts(date, EASTERN);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function meetUrl(value?: string) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "meet.google.com" && !url.username && !url.password && !url.port && !url.hash && /^\/(?:[a-z]{3}-[a-z]{4}-[a-z]{3}|lookup\/[a-zA-Z0-9_-]+)\/?$/.test(url.pathname) ? url.href : "";
  } catch { return ""; }
}

export function nextWednesdayDate(now = new Date()) {
  return dateString(occurrence(now, 3, 19, 30, 120, EASTERN).startsAt);
}

export function getWeeklyService(content: ServiceContent | null = null, now = new Date()): WeeklyService {
  // The old single schedule may be set to Wednesday. It must not replace Sunday.
  const stored = content?.serviceSchedule;
  const sunday = { hour: 11, minute: 30, timezone: EASTERN };
  if (stored?.dayOfWeek === 0 && Number.isInteger(stored.hour) && stored.hour >= 0 && stored.hour < 24 && Number.isInteger(stored.minute) && stored.minute >= 0 && stored.minute < 60 && typeof stored.timezone === "string" && stored.timezone.trim()) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: stored.timezone }).format(now);
      Object.assign(sunday, { hour: stored.hour, minute: stored.minute, timezone: stored.timezone });
    } catch { /* Keep the Eastern default for an invalid legacy timezone. */ }
  }
  const sessions = [
    { kind: "sunday" as const, day: "Sunday" as const, ...occurrence(now, 0, sunday.hour, sunday.minute, 90, sunday.timezone) },
    { kind: "wednesday" as const, day: "Wednesday" as const, ...occurrence(now, 3, 19, 30, 120, EASTERN) },
  ].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const session = sessions[0];
  const date = dateString(session.startsAt);
  const details = session.kind === "wednesday" ? content?.thisWednesday : content?.thisSunday;
  const message = details && (!details.date || details.date === date) ? details : undefined;
  const legacy = session.kind === "sunday" && !details?.date ? content?.weeklyMessage : undefined;
  const remaining = Math.max(0, Math.floor((session.startsAt.getTime() - now.getTime()) / 1000));
  const startLabel = new Intl.DateTimeFormat("en-US", { timeZone: EASTERN, hour: "numeric", minute: "2-digit" }).format(session.startsAt);
  const endLabel = new Intl.DateTimeFormat("en-US", { timeZone: EASTERN, hour: "numeric", minute: "2-digit" }).format(session.endsAt);
  const sharedMeet = meetUrl(content?.googleMeetLink) || meetUrl(content?.meetLink) || DEFAULT_MEET;
  const sundaySession = sessions.find((item) => item.kind === "sunday")!;
  const sundayTime = new Intl.DateTimeFormat("en-US", { timeZone: EASTERN, hour: "numeric", minute: "2-digit" }).format(sundaySession.startsAt);
  return {
    ...session, date, isLive: now >= session.startsAt && now < session.endsAt,
    title: message?.title || legacy?.title || `${session.day} Service`,
    scripture: message?.scripture || legacy?.scripture || "",
    description: message?.description || legacy?.description || `Join us ${session.day === "Wednesday" ? "Wednesday evening" : "Sunday morning"} for worship, Scripture, and fellowship.`,
    meetLink: session.kind === "wednesday" ? meetUrl(content?.wednesdayMeetLink) || sharedMeet : sharedMeet,
    scheduleLabel: `${session.day}s — ${startLabel}–${endLabel} Eastern`,
    weeklyScheduleLabel: `Sundays at ${sundayTime} and Wednesdays at 7:30 PM Eastern`,
    countdown: { d: Math.floor(remaining / 86400), h: Math.floor(remaining % 86400 / 3600), m: Math.floor(remaining % 3600 / 60), s: remaining % 60 },
  };
}
