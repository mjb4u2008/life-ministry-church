import { kv } from "@vercel/kv";

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface WeeklyMessage {
  title: string;
  scripture: string;
  description: string;
}

export interface ServiceSchedule {
  dayOfWeek: number; // 0 = Sunday
  hour: number;
  minute: number;
  timezone: string;
}

export interface SocialLinks {
  tiktok: string;
  instagram: string;
}

export interface TikTokVideo {
  id: string;
  url: string;
  title: string;
}

export interface SiteContent {
  weeklyMessage: WeeklyMessage;
  serviceSchedule: ServiceSchedule;
  lobbyOpen: boolean;
  serviceLive: boolean;
  roomName: string;
  testMode: boolean;
  socialLinks: SocialLinks;
  tiktokVideos: TikTokVideo[];
  lastUpdated: string;
  googleMeetLink: string;
  youtubeLatestUrl: string;
  thisSunday: {
    date: string;
    title: string;
    scripture: string;
    description: string;
  };
  upcomingEvents: {
    id: string;
    title: string;
    date: string;
    time: string;
    description: string;
  }[];
  contactEmail: string;
  contactPhone: string;
}

export interface Prayer {
  id: string;
  name: string;
  request: string;
  prayerCount: number;
  createdAt: string;
  isAnonymous: boolean;
}

export interface PrayersData {
  prayers: Prayer[];
}

export interface Subscriber {
  id: string;
  name: string;
  contactType: "email" | "phone";
  contact: string;
  timestamp: string;
}

export interface SubscribersData {
  subscribers: Subscriber[];
}

export interface Insight {
  id: string;
  topic: string;
  scripture: string;
  timestamp: string;
}

export interface InsightsData {
  insights: Insight[];
}

export interface Testimony {
  id: string;
  name: string;
  text: string;
  isAnonymous: boolean;
  blessedCount: number;
  createdAt: string;
  approved: boolean;
}

export interface DailyScripture {
  verse: string;
  reference: string;
  reflection: string;
  date: string;
  generatedAt: string;
  isManualOverride: boolean;
}

// ─── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_CONTENT: SiteContent = {
  weeklyMessage: {
    title: "Welcome to L.I.F.E. Ministry",
    scripture: "Matthew 28:20",
    description: "Join us this Sunday for worship and fellowship.",
  },
  serviceSchedule: {
    dayOfWeek: 0,
    hour: 10,
    minute: 0,
    timezone: "America/New_York",
  },
  lobbyOpen: false,
  serviceLive: false,
  roomName: "LIFEMinistryService",
  testMode: false,
  socialLinks: {
    tiktok: "",
    instagram: "",
  },
  tiktokVideos: [],
  lastUpdated: new Date().toISOString(),
  googleMeetLink: "",
  youtubeLatestUrl: "",
  thisSunday: {
    date: "",
    title: "",
    scripture: "",
    description: "",
  },
  upcomingEvents: [],
  contactEmail: "",
  contactPhone: "",
};

const DEFAULT_DAILY_SCRIPTURE: DailyScripture = {
  verse: "",
  reference: "",
  reflection: "",
  date: "",
  generatedAt: "",
  isManualOverride: false,
};

// ─── Content functions ─────────────────────────────────────────────────────────

export async function getContent(): Promise<SiteContent> {
  try {
    const data = await kv.get<SiteContent>("site-content");
    return data || DEFAULT_CONTENT;
  } catch (error) {
    console.error("KV error:", error);
    return DEFAULT_CONTENT;
  }
}

export async function updateContent(
  content: Partial<SiteContent>
): Promise<SiteContent> {
  try {
    const currentContent = await getContent();
    const updatedContent: SiteContent = {
      ...currentContent,
      ...content,
      lastUpdated: new Date().toISOString(),
    };
    await kv.set("site-content", updatedContent);
    return updatedContent;
  } catch (error) {
    console.error("KV error:", error);
    const currentContent = await getContent();
    return { ...currentContent, ...content, lastUpdated: new Date().toISOString() };
  }
}

// ─── Prayer functions ──────────────────────────────────────────────────────────

export async function getPrayers(): Promise<Prayer[]> {
  try {
    const data = await kv.get<Prayer[]>("prayers");
    return data || [];
  } catch (error) {
    console.error("KV error:", error);
    return [];
  }
}

export async function addPrayer(
  prayer: Omit<Prayer, "id" | "createdAt" | "prayerCount">
): Promise<Prayer> {
  const prayers = await getPrayers();
  const newPrayer: Prayer = {
    ...prayer,
    id: Date.now().toString(),
    prayerCount: 0,
    createdAt: new Date().toISOString(),
  };

  prayers.unshift(newPrayer);

  try {
    await kv.set("prayers", prayers);
  } catch (error) {
    console.error("KV error:", error);
  }

  return newPrayer;
}

export async function updatePrayer(
  id: string,
  updates: Partial<Omit<Prayer, "id">>
): Promise<Prayer | null> {
  const prayers = await getPrayers();
  const prayerIndex = prayers.findIndex((p) => p.id === id);

  if (prayerIndex === -1) {
    return null;
  }

  prayers[prayerIndex] = { ...prayers[prayerIndex], ...updates };

  try {
    await kv.set("prayers", prayers);
  } catch (error) {
    console.error("KV error:", error);
  }

  return prayers[prayerIndex];
}

export async function deletePrayer(id: string): Promise<boolean> {
  const prayers = await getPrayers();
  const filteredPrayers = prayers.filter((p) => p.id !== id);

  if (filteredPrayers.length === prayers.length) {
    return false;
  }

  try {
    await kv.set("prayers", filteredPrayers);
  } catch (error) {
    console.error("KV error:", error);
  }

  return true;
}

export async function incrementPrayerCount(id: string): Promise<Prayer | null> {
  const prayers = await getPrayers();
  const prayerIndex = prayers.findIndex((p) => p.id === id);

  if (prayerIndex === -1) {
    return null;
  }

  prayers[prayerIndex].prayerCount += 1;

  try {
    await kv.set("prayers", prayers);
  } catch (error) {
    console.error("KV error:", error);
  }

  return prayers[prayerIndex];
}

// ─── Subscriber functions ──────────────────────────────────────────────────────

export async function getSubscribers(): Promise<Subscriber[]> {
  try {
    const data = await kv.get<Subscriber[]>("subscribers");
    return data || [];
  } catch (error) {
    console.error("KV error:", error);
    return [];
  }
}

export async function addSubscriber(
  subscriber: Omit<Subscriber, "id" | "timestamp">
): Promise<Subscriber> {
  const subscribers = await getSubscribers();

  // Check if already subscribed
  const exists = subscribers.some(
    (s) => s.contact.toLowerCase() === subscriber.contact.toLowerCase()
  );

  if (exists) {
    throw new Error("Already subscribed");
  }

  const newSubscriber: Subscriber = {
    ...subscriber,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  };

  subscribers.push(newSubscriber);

  try {
    await kv.set("subscribers", subscribers);
  } catch (error) {
    console.error("KV error:", error);
  }

  return newSubscriber;
}

export async function deleteSubscriber(id: string): Promise<boolean> {
  const subscribers = await getSubscribers();
  const filteredSubscribers = subscribers.filter((s) => s.id !== id);

  if (filteredSubscribers.length === subscribers.length) {
    return false;
  }

  try {
    await kv.set("subscribers", filteredSubscribers);
  } catch (error) {
    console.error("KV error:", error);
  }

  return true;
}

// ─── Insight functions ─────────────────────────────────────────────────────────

export async function getInsights(): Promise<Insight[]> {
  try {
    const data = await kv.get<Insight[]>("insights");
    return data || [];
  } catch (error) {
    console.error("KV error:", error);
    return [];
  }
}

export async function addInsight(
  insight: Omit<Insight, "id" | "timestamp">
): Promise<Insight> {
  const insights = await getInsights();
  const newInsight: Insight = {
    ...insight,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  };

  insights.unshift(newInsight);

  try {
    await kv.set("insights", insights);
  } catch (error) {
    console.error("KV error:", error);
  }

  return newInsight;
}

export async function deleteInsight(id: string): Promise<boolean> {
  const insights = await getInsights();
  const filteredInsights = insights.filter((i) => i.id !== id);

  if (filteredInsights.length === insights.length) {
    return false;
  }

  try {
    await kv.set("insights", filteredInsights);
  } catch (error) {
    console.error("KV error:", error);
  }

  return true;
}

// ─── Testimony functions ───────────────────────────────────────────────────────

export async function getTestimonies(): Promise<Testimony[]> {
  try {
    const data = await kv.get<Testimony[]>("testimonies");
    return data || [];
  } catch (error) {
    console.error("KV error:", error);
    return [];
  }
}

export async function addTestimony(
  testimony: Omit<Testimony, "id" | "createdAt" | "blessedCount" | "approved">
): Promise<Testimony> {
  const testimonies = await getTestimonies();
  const newTestimony: Testimony = {
    ...testimony,
    id: Date.now().toString(),
    blessedCount: 0,
    createdAt: new Date().toISOString(),
    approved: false,
  };

  testimonies.unshift(newTestimony);

  try {
    await kv.set("testimonies", testimonies);
  } catch (error) {
    console.error("KV error:", error);
  }

  return newTestimony;
}

export async function updateTestimony(
  id: string,
  updates: Partial<Omit<Testimony, "id">>
): Promise<Testimony | null> {
  const testimonies = await getTestimonies();
  const index = testimonies.findIndex((t) => t.id === id);

  if (index === -1) {
    return null;
  }

  testimonies[index] = { ...testimonies[index], ...updates };

  try {
    await kv.set("testimonies", testimonies);
  } catch (error) {
    console.error("KV error:", error);
  }

  return testimonies[index];
}

export async function deleteTestimony(id: string): Promise<boolean> {
  const testimonies = await getTestimonies();
  const filtered = testimonies.filter((t) => t.id !== id);

  if (filtered.length === testimonies.length) {
    return false;
  }

  try {
    await kv.set("testimonies", filtered);
  } catch (error) {
    console.error("KV error:", error);
  }

  return true;
}

export async function incrementBlessedCount(
  id: string
): Promise<Testimony | null> {
  const testimonies = await getTestimonies();
  const index = testimonies.findIndex((t) => t.id === id);

  if (index === -1) {
    return null;
  }

  testimonies[index].blessedCount += 1;

  try {
    await kv.set("testimonies", testimonies);
  } catch (error) {
    console.error("KV error:", error);
  }

  return testimonies[index];
}

// ─── Daily Scripture functions ─────────────────────────────────────────────────

export async function getDailyScripture(): Promise<DailyScripture> {
  try {
    const data = await kv.get<DailyScripture>("daily-scripture");
    return data || DEFAULT_DAILY_SCRIPTURE;
  } catch (error) {
    console.error("KV error:", error);
    return DEFAULT_DAILY_SCRIPTURE;
  }
}

export async function setDailyScripture(
  scripture: DailyScripture
): Promise<DailyScripture> {
  try {
    await kv.set("daily-scripture", scripture);
    return scripture;
  } catch (error) {
    console.error("KV error:", error);
    return scripture;
  }
}
