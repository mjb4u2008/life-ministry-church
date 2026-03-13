import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

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

// Content functions
export async function getContent(): Promise<SiteContent> {
  try {
    const filePath = path.join(DATA_DIR, "content.json");
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading content:", error);
    // Return default content if file doesn't exist
    return {
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
    };
  }
}

export async function updateContent(content: Partial<SiteContent>): Promise<SiteContent> {
  const currentContent = await getContent();
  const updatedContent = {
    ...currentContent,
    ...content,
    lastUpdated: new Date().toISOString(),
  };

  const filePath = path.join(DATA_DIR, "content.json");
  await fs.writeFile(filePath, JSON.stringify(updatedContent, null, 2));
  return updatedContent;
}

// Prayer functions
export async function getPrayers(): Promise<Prayer[]> {
  try {
    const filePath = path.join(DATA_DIR, "prayers.json");
    const data = await fs.readFile(filePath, "utf-8");
    const parsed: PrayersData = JSON.parse(data);
    return parsed.prayers;
  } catch (error) {
    console.error("Error reading prayers:", error);
    return [];
  }
}

export async function addPrayer(prayer: Omit<Prayer, "id" | "createdAt" | "prayerCount">): Promise<Prayer> {
  const prayers = await getPrayers();
  const newPrayer: Prayer = {
    ...prayer,
    id: Date.now().toString(),
    prayerCount: 0,
    createdAt: new Date().toISOString(),
  };

  prayers.unshift(newPrayer);

  const filePath = path.join(DATA_DIR, "prayers.json");
  await fs.writeFile(filePath, JSON.stringify({ prayers }, null, 2));
  return newPrayer;
}

export async function updatePrayer(id: string, updates: Partial<Omit<Prayer, "id">>): Promise<Prayer | null> {
  const prayers = await getPrayers();
  const prayerIndex = prayers.findIndex((p) => p.id === id);

  if (prayerIndex === -1) {
    return null;
  }

  prayers[prayerIndex] = { ...prayers[prayerIndex], ...updates };

  const filePath = path.join(DATA_DIR, "prayers.json");
  await fs.writeFile(filePath, JSON.stringify({ prayers }, null, 2));
  return prayers[prayerIndex];
}

export async function deletePrayer(id: string): Promise<boolean> {
  const prayers = await getPrayers();
  const filteredPrayers = prayers.filter((p) => p.id !== id);

  if (filteredPrayers.length === prayers.length) {
    return false; // Prayer not found
  }

  const filePath = path.join(DATA_DIR, "prayers.json");
  await fs.writeFile(filePath, JSON.stringify({ prayers: filteredPrayers }, null, 2));
  return true;
}

export async function incrementPrayerCount(id: string): Promise<Prayer | null> {
  const prayers = await getPrayers();
  const prayerIndex = prayers.findIndex((p) => p.id === id);

  if (prayerIndex === -1) {
    return null;
  }

  prayers[prayerIndex].prayerCount += 1;

  const filePath = path.join(DATA_DIR, "prayers.json");
  await fs.writeFile(filePath, JSON.stringify({ prayers }, null, 2));
  return prayers[prayerIndex];
}

// Subscriber functions
export async function getSubscribers(): Promise<Subscriber[]> {
  try {
    const filePath = path.join(DATA_DIR, "subscribers.json");
    const data = await fs.readFile(filePath, "utf-8");
    const parsed: SubscribersData = JSON.parse(data);
    return parsed.subscribers;
  } catch (error) {
    console.error("Error reading subscribers:", error);
    return [];
  }
}

export async function addSubscriber(subscriber: Omit<Subscriber, "id" | "timestamp">): Promise<Subscriber> {
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

  const filePath = path.join(DATA_DIR, "subscribers.json");
  await fs.writeFile(filePath, JSON.stringify({ subscribers }, null, 2));
  return newSubscriber;
}

export async function deleteSubscriber(id: string): Promise<boolean> {
  const subscribers = await getSubscribers();
  const filteredSubscribers = subscribers.filter((s) => s.id !== id);

  if (filteredSubscribers.length === subscribers.length) {
    return false;
  }

  const filePath = path.join(DATA_DIR, "subscribers.json");
  await fs.writeFile(filePath, JSON.stringify({ subscribers: filteredSubscribers }, null, 2));
  return true;
}

// Insight types and functions
export interface Insight {
  id: string;
  topic: string;
  scripture: string;
  timestamp: string;
}

export interface InsightsData {
  insights: Insight[];
}

export async function getInsights(): Promise<Insight[]> {
  try {
    const filePath = path.join(DATA_DIR, "insights.json");
    const data = await fs.readFile(filePath, "utf-8");
    const parsed: InsightsData = JSON.parse(data);
    return parsed.insights;
  } catch (error) {
    console.error("Error reading insights:", error);
    return [];
  }
}

export async function addInsight(insight: Omit<Insight, "id" | "timestamp">): Promise<Insight> {
  const insights = await getInsights();
  const newInsight: Insight = {
    ...insight,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  };

  insights.unshift(newInsight);

  const filePath = path.join(DATA_DIR, "insights.json");
  await fs.writeFile(filePath, JSON.stringify({ insights }, null, 2));
  return newInsight;
}

export async function deleteInsight(id: string): Promise<boolean> {
  const insights = await getInsights();
  const filteredInsights = insights.filter((i) => i.id !== id);

  if (filteredInsights.length === insights.length) {
    return false;
  }

  const filePath = path.join(DATA_DIR, "insights.json");
  await fs.writeFile(filePath, JSON.stringify({ insights: filteredInsights }, null, 2));
  return true;
}
