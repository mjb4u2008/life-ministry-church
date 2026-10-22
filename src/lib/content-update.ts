import type { SiteContent } from "./data";

export class ContentUpdateValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(issues.join(". "));
    this.name = "ContentUpdateValidationError";
  }
}

type ObjectValue = Record<string, unknown>;

function object(value: unknown, label: string): ObjectValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ContentUpdateValidationError([`${label} must be an object`]);
  return value as ObjectValue;
}

function exact(input: ObjectValue, allowed: string[], label: string) {
  const unknown = Object.keys(input).filter((key) => !allowed.includes(key));
  if (unknown.length) throw new ContentUpdateValidationError([`${label} contains unsupported fields: ${unknown.join(", ")}`]);
}

function string(value: unknown, label: string, max = 2_000) {
  if (typeof value !== "string" || value.length > max || /[\u0000\u007f]/.test(value)) throw new ContentUpdateValidationError([`${label} must be valid text`]);
  return value.trim();
}

function boolean(value: unknown, label: string) {
  if (typeof value !== "boolean") throw new ContentUpdateValidationError([`${label} must be true or false`]);
  return value;
}

function integer(value: unknown, label: string, min: number, max: number) {
  if (!Number.isInteger(value) || Number(value) < min || Number(value) > max) throw new ContentUpdateValidationError([`${label} is invalid`]);
  return Number(value);
}

function url(value: unknown, label: string, hosts?: string[]) {
  const raw = string(value, label, 2_048);
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.port || parsed.hash) throw new Error("unsafe");
    if (hosts && !hosts.includes(parsed.hostname.toLowerCase())) throw new Error("host");
    return parsed.toString();
  } catch { throw new ContentUpdateValidationError([`${label} must be an allowed HTTPS URL`]); }
}

function date(value: unknown, label: string) {
  const raw = string(value, label, 10);
  if (raw && !/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new ContentUpdateValidationError([`${label} must use YYYY-MM-DD`]);
  return raw;
}

function message(value: unknown, label: string) {
  const input = object(value, label);
  exact(input, ["title", "scripture", "description"], label);
  return {
    title: string(input.title, `${label} title`, 200),
    scripture: string(input.scripture, `${label} scripture`, 200),
    description: string(input.description, `${label} description`, 4_000),
  };
}

export function parseContentUpdate(value: unknown): Partial<SiteContent> {
  const input = object(value, "Content update");
  const allowed = [
    "weeklyMessage", "serviceSchedule", "lobbyOpen", "serviceLive", "roomName", "testMode",
    "socialLinks", "tiktokVideos", "googleMeetLink", "youtubeLatestUrl", "thisSunday",
    "upcomingEvents", "contactEmail", "contactPhone", "youtubeVideos",
  ];
  exact(input, allowed, "Content update");
  if (Object.keys(input).length === 0) throw new ContentUpdateValidationError(["Content update cannot be empty"]);
  const output: Partial<SiteContent> = {};

  if ("weeklyMessage" in input) output.weeklyMessage = message(input.weeklyMessage, "Weekly message");
  if ("lobbyOpen" in input) output.lobbyOpen = boolean(input.lobbyOpen, "Lobby open");
  if ("serviceLive" in input) output.serviceLive = boolean(input.serviceLive, "Service live");
  if ("testMode" in input) output.testMode = boolean(input.testMode, "Test mode");
  if ("roomName" in input) output.roomName = string(input.roomName, "Room name", 100);
  if ("googleMeetLink" in input) output.googleMeetLink = url(input.googleMeetLink, "Google Meet link", ["meet.google.com"]);
  if ("youtubeLatestUrl" in input) output.youtubeLatestUrl = url(input.youtubeLatestUrl, "YouTube URL", ["youtube.com", "www.youtube.com", "youtu.be"]);
  if ("contactEmail" in input) {
    const email = string(input.contactEmail, "Contact email", 254).toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ContentUpdateValidationError(["Contact email is invalid"]);
    output.contactEmail = email;
  }
  if ("contactPhone" in input) output.contactPhone = string(input.contactPhone, "Contact phone", 30);

  if ("serviceSchedule" in input) {
    const schedule = object(input.serviceSchedule, "Service schedule");
    exact(schedule, ["dayOfWeek", "hour", "minute", "timezone"], "Service schedule");
    const timezone = string(schedule.timezone, "Timezone", 100);
    try { new Intl.DateTimeFormat("en-US", { timeZone: timezone }); }
    catch { throw new ContentUpdateValidationError(["Timezone is invalid"]); }
    output.serviceSchedule = {
      dayOfWeek: integer(schedule.dayOfWeek, "Day of week", 0, 6),
      hour: integer(schedule.hour, "Hour", 0, 23),
      minute: integer(schedule.minute, "Minute", 0, 59),
      timezone,
    };
  }

  if ("socialLinks" in input) {
    const links = object(input.socialLinks, "Social links");
    exact(links, ["tiktok", "instagram", "youtube", "facebook"], "Social links");
    output.socialLinks = {
      tiktok: url(links.tiktok ?? "", "TikTok URL", ["tiktok.com", "www.tiktok.com"]),
      instagram: url(links.instagram ?? "", "Instagram URL", ["instagram.com", "www.instagram.com"]),
      youtube: url(links.youtube ?? "", "YouTube URL", ["youtube.com", "www.youtube.com", "youtu.be"]),
      facebook: url(links.facebook ?? "", "Facebook URL", ["facebook.com", "www.facebook.com"]),
    };
  }

  if ("thisSunday" in input) {
    const sunday = object(input.thisSunday, "This Sunday");
    exact(sunday, ["date", "title", "scripture", "description"], "This Sunday");
    output.thisSunday = {
      date: date(sunday.date, "Sunday date"),
      title: string(sunday.title, "Sunday title", 200),
      scripture: string(sunday.scripture, "Sunday scripture", 200),
      description: string(sunday.description, "Sunday description", 4_000),
    };
  }

  if ("tiktokVideos" in input) {
    if (!Array.isArray(input.tiktokVideos) || input.tiktokVideos.length > 100) throw new ContentUpdateValidationError(["TikTok videos must be a list of at most 100 items"]);
    output.tiktokVideos = input.tiktokVideos.map((item, index) => {
      const video = object(item, `TikTok video ${index + 1}`);
      exact(video, ["id", "url", "title"], `TikTok video ${index + 1}`);
      return { id: string(video.id, "Video ID", 100), url: url(video.url, "TikTok URL", ["tiktok.com", "www.tiktok.com"]), title: string(video.title, "Video title", 200) };
    });
  }

  if ("youtubeVideos" in input) {
    if (!Array.isArray(input.youtubeVideos) || input.youtubeVideos.length > 100) throw new ContentUpdateValidationError(["YouTube videos must be a list of at most 100 items"]);
    output.youtubeVideos = input.youtubeVideos.map((item, index) => {
      const video = object(item, `YouTube video ${index + 1}`);
      exact(video, ["id", "url", "title", "date", "scripture"], `YouTube video ${index + 1}`);
      return { id: string(video.id, "Video ID", 100), url: url(video.url, "YouTube URL", ["youtube.com", "www.youtube.com", "youtu.be"]), title: string(video.title, "Video title", 200), date: date(video.date, "Video date"), scripture: string(video.scripture, "Video scripture", 200) };
    });
  }

  if ("upcomingEvents" in input) {
    if (!Array.isArray(input.upcomingEvents) || input.upcomingEvents.length > 100) throw new ContentUpdateValidationError(["Upcoming events must be a list of at most 100 items"]);
    output.upcomingEvents = input.upcomingEvents.map((item, index) => {
      const event = object(item, `Upcoming event ${index + 1}`);
      exact(event, ["id", "title", "date", "time", "description"], `Upcoming event ${index + 1}`);
      return { id: string(event.id, "Event ID", 100), title: string(event.title, "Event title", 200), date: date(event.date, "Event date"), time: string(event.time, "Event time", 30), description: string(event.description, "Event description", 2_000) };
    });
  }
  return output;
}
