"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import FlyerTemplate from "@/components/FlyerTemplates";
import type { FlyerData } from "@/components/FlyerTemplates";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// ─── Interfaces ─────────────────────────────────────────────────────────────────

interface SiteContent {
  weeklyMessage: {
    title: string;
    scripture: string;
    description: string;
  };
  serviceSchedule: {
    dayOfWeek: number;
    hour: number;
    minute: number;
    timezone: string;
  };
  lobbyOpen: boolean;
  serviceLive: boolean;
  roomName: string;
  testMode: boolean;
  socialLinks: {
    tiktok: string;
    instagram: string;
    youtube?: string;
    facebook?: string;
  };
  tiktokVideos: {
    id: string;
    url: string;
    title: string;
  }[];
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
  youtubeVideos?: YouTubeVideo[];
}

interface YouTubeVideo {
  id: string;
  url: string;
  title: string;
  date: string;
  scripture: string;
}

interface Prayer {
  id: string;
  name: string;
  request: string;
  prayerCount: number;
  createdAt: string;
  isAnonymous: boolean;
}

interface Testimony {
  id: string;
  name: string;
  text: string;
  isAnonymous: boolean;
  blessedCount: number;
  createdAt: string;
  approved: boolean;
}

interface DailyScripture {
  verse: string;
  reference: string;
  reflection: string;
  date: string;
  generatedAt: string;
  isManualOverride: boolean;
}

interface Insight {
  id: string;
  topic: string;
  scripture: string;
  timestamp: string;
}

type Tab =
  | "this-sunday"
  | "daily-scripture"
  | "past-lessons"
  | "flyer"
  | "prayers"
  | "testimonies"
  | "insights"
  | "settings";

// ─── Toast Component ────────────────────────────────────────────────────────────

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div
        className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-body font-medium ${
          type === "success"
            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
            : "bg-red-50 text-red-800 border border-red-200"
        }`}
      >
        <span className="text-lg">{type === "success" ? "\u2713" : "\u2717"}</span>
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-2 opacity-50 hover:opacity-100 text-lg leading-none"
        >
          {"\u00d7"}
        </button>
      </div>
    </div>
  );
}

// ─── Water Cross Logo (inline SVG) ─────────────────────────────────────────────

function WaterCrossLogo({ size = 60 }: { size?: number }) {
  return (
    <img
      src="/logo-water-cross.png"
      alt="L.I.F.E. Ministry"
      width={size}
      height={size}
      className="object-contain rounded-xl"
    />
  );
}

// ─── Spinner SVG ────────────────────────────────────────────────────────────────

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ─── Trash Icon SVG ─────────────────────────────────────────────────────────────

function TrashIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

// ─── Character Counter Component ────────────────────────────────────────────────

function CharCounter({ current, max }: { current: number; max: number }) {
  const pct = current / max;
  const colorClass =
    current >= max
      ? "text-red-500 font-semibold"
      : pct >= 0.8
        ? "text-amber-500"
        : "text-muted-foreground";
  const warningLabel =
    current >= max
      ? "At limit"
      : pct >= 0.8
        ? "Almost at limit"
        : null;
  return (
    <div className="flex justify-between items-center mt-1">
      <span className={`text-xs font-body ${colorClass}`}>
        {current}/{max} characters
      </span>
      {warningLabel && (
        <span className={`text-xs font-body ${current >= max ? "text-red-500 font-semibold" : "text-amber-500"}`}>
          {warningLabel}
        </span>
      )}
    </div>
  );
}

// ─── Helper: next Sunday date ───────────────────────────────────────────────────

function getNextSunday(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + daysUntilSunday);
  return nextSunday.toISOString().split("T")[0];
}

// ─── Helper: format date nicely ─────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatTimestamp(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Shared label class ─────────────────────────────────────────────────────────

const labelClass = "block text-sm font-semibold font-body text-[#0a1a2f] mb-1.5";

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function AdminPage() {
  // ─── Auth State ─────────────────────────────────────────────────────────────
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // ─── Dashboard State ───────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>("this-sunday");
  const [content, setContent] = useState<SiteContent | null>(null);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [dailyScripture, setDailyScripture] = useState<DailyScripture | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // ─── This Sunday Form ──────────────────────────────────────────────────────
  const [sundayDate, setSundayDate] = useState(getNextSunday());
  const [sundayTitle, setSundayTitle] = useState("");
  const [sundayScripture, setSundayScripture] = useState("");
  const [sundayDescription, setSundayDescription] = useState("");
  const [sundayMeetLink, setSundayMeetLink] = useState("");
  const [isSavingSunday, setIsSavingSunday] = useState(false);

  // ─── Daily Scripture Form ──────────────────────────────────────────────────
  const [scriptureOverride, setScriptureOverride] = useState(false);
  const [customVerse, setCustomVerse] = useState("");
  const [customReference, setCustomReference] = useState("");
  const [customReflection, setCustomReflection] = useState("");
  const [isSavingScripture, setIsSavingScripture] = useState(false);

  // ─── Past Lessons Form ─────────────────────────────────────────────────────
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoDate, setNewVideoDate] = useState("");
  const [newVideoScripture, setNewVideoScripture] = useState("");
  const [isSavingVideos, setIsSavingVideos] = useState(false);

  // ─── Flyer Generator ──────────────────────────────────────────────────────
  const [flyerTitle, setFlyerTitle] = useState("");
  const [flyerScripture, setFlyerScripture] = useState("");
  const [flyerDescription, setFlyerDescription] = useState("");
  const [flyerData, setFlyerData] = useState<FlyerData | null>(null);
  const [flyerTemplate, setFlyerTemplate] = useState<1 | 2 | 3>(1);
  const [isGeneratingFlyer, setIsGeneratingFlyer] = useState(false);

  // ─── Settings Form ────────────────────────────────────────────────────────
  const [settingsEmail, setSettingsEmail] = useState("");
  const [settingsPhone, setSettingsPhone] = useState("");
  const [settingsTiktok, setSettingsTiktok] = useState("");
  const [settingsInstagram, setSettingsInstagram] = useState("");
  const [settingsYoutube, setSettingsYoutube] = useState("");
  const [settingsFacebook, setSettingsFacebook] = useState("");
  const [settingsDay, setSettingsDay] = useState(0);
  const [settingsHour, setSettingsHour] = useState(10);
  const [settingsMinute, setSettingsMinute] = useState(0);
  const [settingsTimezone, setSettingsTimezone] = useState("America/New_York");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // ─── Prayers/Testimonies loading ──────────────────────────────────────────
  const [isDeletingPrayer, setIsDeletingPrayer] = useState<string | null>(null);
  const [isDeletingTestimony, setIsDeletingTestimony] = useState<string | null>(null);
  const [isApprovingTestimony, setIsApprovingTestimony] = useState<string | null>(null);

  // ─── Insights State ────────────────────────────────────────────────────────
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isDeletingInsight, setIsDeletingInsight] = useState<string | null>(null);

  // ─── Prayer Edit Dialog ────────────────────────────────────────────────────
  const [editingPrayer, setEditingPrayer] = useState<Prayer | null>(null);
  const [editPrayerName, setEditPrayerName] = useState("");
  const [editPrayerRequest, setEditPrayerRequest] = useState("");
  const [editPrayerAnonymous, setEditPrayerAnonymous] = useState(false);
  const [isSavingPrayer, setIsSavingPrayer] = useState(false);

  // ─── Testimony Edit Dialog ─────────────────────────────────────────────────
  const [editingTestimony, setEditingTestimony] = useState<Testimony | null>(null);
  const [editTestimonyName, setEditTestimonyName] = useState("");
  const [editTestimonyText, setEditTestimonyText] = useState("");
  const [editTestimonyAnonymous, setEditTestimonyAnonymous] = useState(false);
  const [editTestimonyApproved, setEditTestimonyApproved] = useState(false);
  const [isSavingTestimony, setIsSavingTestimony] = useState(false);

  // ─── Refs ─────────────────────────────────────────────────────────────────
  const flyerRef = useRef<HTMLDivElement>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH LOGIC
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const savedToken = localStorage.getItem("admin_token");
    if (savedToken) {
      verifyExistingToken(savedToken);
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyExistingToken = async (t: string) => {
    try {
      const res = await fetch("/api/auth", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        setToken(t);
      } else {
        localStorage.removeItem("admin_token");
      }
    } catch {
      localStorage.removeItem("admin_token");
    }
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("admin_token", data.token);
        setToken(data.token);
        setPassword("");
      } else {
        setLoginError(data.error || "Invalid password");
      }
    } catch {
      setLoginError("Connection error. Please try again.");
    }
    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
    setContent(null);
    setPrayers([]);
    setTestimonies([]);
    setDailyScripture(null);
    setActiveTab("this-sunday");
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  const loadAllData = useCallback(
    async (t: string) => {
      try {
        const [contentRes, prayersRes, testimoniesRes, scriptureRes, insightsRes] =
          await Promise.all([
            fetch("/api/content"),
            fetch("/api/prayers"),
            fetch("/api/testimonies", {
              headers: { Authorization: `Bearer ${t}` },
            }),
            fetch("/api/daily-scripture"),
            fetch("/api/insights", {
              headers: { Authorization: `Bearer ${t}` },
            }),
          ]);

        if (contentRes.ok) {
          const c = await contentRes.json();
          setContent(c);
          // Populate This Sunday form
          setSundayDate(c.thisSunday?.date || getNextSunday());
          setSundayTitle(c.thisSunday?.title || "");
          setSundayScripture(c.thisSunday?.scripture || "");
          setSundayDescription(c.thisSunday?.description || "");
          setSundayMeetLink(c.googleMeetLink || "");
          // Populate YouTube videos
          setYoutubeVideos(c.youtubeVideos || []);
          // Populate Settings
          setSettingsEmail(c.contactEmail || "");
          setSettingsPhone(c.contactPhone || "");
          setSettingsTiktok(c.socialLinks?.tiktok || "");
          setSettingsInstagram(c.socialLinks?.instagram || "");
          setSettingsYoutube(c.socialLinks?.youtube || "");
          setSettingsFacebook(c.socialLinks?.facebook || "");
          setSettingsDay(c.serviceSchedule?.dayOfWeek ?? 0);
          setSettingsHour(c.serviceSchedule?.hour ?? 10);
          setSettingsMinute(c.serviceSchedule?.minute ?? 0);
          setSettingsTimezone(
            c.serviceSchedule?.timezone || "America/New_York"
          );
        }

        if (prayersRes.ok) {
          const p = await prayersRes.json();
          setPrayers(p.prayers || []);
        }

        if (testimoniesRes.ok) {
          const t2 = await testimoniesRes.json();
          setTestimonies(t2.testimonies || []);
        }

        if (scriptureRes.ok) {
          const s = await scriptureRes.json();
          setDailyScripture(s);
        }

        if (insightsRes.ok) {
          const i = await insightsRes.json();
          setInsights(i.insights || []);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        showToast("Failed to load data", "error");
      }
    },
    []
  );

  useEffect(() => {
    if (token) {
      loadAllData(token);
    }
  }, [token, loadAllData]);

  // ═══════════════════════════════════════════════════════════════════════════
  // TOAST HELPER
  // ═══════════════════════════════════════════════════════════════════════════

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 1: THIS SUNDAY — SAVE
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSaveThisSunday = async () => {
    if (!token) return;
    setIsSavingSunday(true);
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          thisSunday: {
            date: sundayDate,
            title: sundayTitle,
            scripture: sundayScripture,
            description: sundayDescription,
          },
          weeklyMessage: {
            title: sundayTitle,
            scripture: sundayScripture,
            description: sundayDescription,
          },
          googleMeetLink: sundayMeetLink,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setContent(updated);
        showToast("This Sunday updated successfully!", "success");
      } else {
        showToast("Failed to save. Please try again.", "error");
      }
    } catch {
      showToast("Connection error. Please try again.", "error");
    }
    setIsSavingSunday(false);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 2: DAILY SCRIPTURE — SAVE
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSaveScripture = async () => {
    if (!token) return;
    setIsSavingScripture(true);
    try {
      const res = await fetch("/api/daily-scripture", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          verse: customVerse,
          reference: customReference,
          reflection: customReflection,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setDailyScripture(updated);
        showToast("Custom scripture saved!", "success");
      } else {
        showToast("Failed to save scripture.", "error");
      }
    } catch {
      showToast("Connection error.", "error");
    }
    setIsSavingScripture(false);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 3: PAST LESSONS — ADD / DELETE / SAVE
  // ═══════════════════════════════════════════════════════════════════════════

  const handleAddVideo = () => {
    if (!newVideoUrl.trim() || !newVideoTitle.trim()) {
      showToast("Please fill in the URL and Title.", "error");
      return;
    }
    const video: YouTubeVideo = {
      id: Date.now().toString(),
      url: newVideoUrl.trim(),
      title: newVideoTitle.trim(),
      date: newVideoDate || new Date().toISOString().split("T")[0],
      scripture: newVideoScripture.trim(),
    };
    setYoutubeVideos((prev) => [video, ...prev]);
    setNewVideoUrl("");
    setNewVideoTitle("");
    setNewVideoDate("");
    setNewVideoScripture("");
  };

  const handleDeleteVideo = (id: string) => {
    setYoutubeVideos((prev) => prev.filter((v) => v.id !== id));
  };

  const handleSaveVideos = async () => {
    if (!token) return;
    setIsSavingVideos(true);
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ youtubeVideos: youtubeVideos }),
      });

      if (res.ok) {
        const updated = await res.json();
        setContent(updated);
        showToast("Past lessons saved!", "success");
      } else {
        showToast("Failed to save lessons.", "error");
      }
    } catch {
      showToast("Connection error.", "error");
    }
    setIsSavingVideos(false);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 4: FLYER GENERATOR
  // ═══════════════════════════════════════════════════════════════════════════

  const handleGenerateFlyer = async () => {
    if (!token) return;
    if (!flyerTitle.trim() || !flyerScripture.trim()) {
      showToast("Title and Scripture are required.", "error");
      return;
    }
    setIsGeneratingFlyer(true);
    try {
      const res = await fetch("/api/flyer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: flyerTitle,
          scripture: flyerScripture,
          description: flyerDescription || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFlyerData(data);
        showToast("Flyer generated!", "success");
      } else {
        showToast("Failed to generate flyer.", "error");
      }
    } catch {
      showToast("Connection error.", "error");
    }
    setIsGeneratingFlyer(false);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 5: PRAYERS — DELETE
  // ═══════════════════════════════════════════════════════════════════════════

  const handleDeletePrayer = async (id: string) => {
    if (!token) return;
    setIsDeletingPrayer(id);
    try {
      const res = await fetch(`/api/prayers?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setPrayers((prev) => prev.filter((p) => p.id !== id));
        showToast("Prayer removed.", "success");
      } else {
        showToast("Failed to delete prayer.", "error");
      }
    } catch {
      showToast("Connection error.", "error");
    }
    setIsDeletingPrayer(null);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 6: TESTIMONIES — APPROVE / DELETE
  // ═══════════════════════════════════════════════════════════════════════════

  const handleApproveTestimony = async (id: string) => {
    if (!token) return;
    setIsApprovingTestimony(id);
    try {
      const res = await fetch("/api/testimonies", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, approved: true }),
      });

      if (res.ok) {
        setTestimonies((prev) =>
          prev.map((t) => (t.id === id ? { ...t, approved: true } : t))
        );
        showToast("Testimony approved!", "success");
      } else {
        showToast("Failed to approve testimony.", "error");
      }
    } catch {
      showToast("Connection error.", "error");
    }
    setIsApprovingTestimony(null);
  };

  const handleDeleteTestimony = async (id: string) => {
    if (!token) return;
    setIsDeletingTestimony(id);
    try {
      const res = await fetch(`/api/testimonies?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setTestimonies((prev) => prev.filter((t) => t.id !== id));
        showToast("Testimony removed.", "success");
      } else {
        showToast("Failed to delete testimony.", "error");
      }
    } catch {
      showToast("Connection error.", "error");
    }
    setIsDeletingTestimony(null);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 7: SETTINGS — SAVE
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSaveSettings = async () => {
    if (!token) return;
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contactEmail: settingsEmail,
          contactPhone: settingsPhone,
          socialLinks: {
            tiktok: settingsTiktok,
            instagram: settingsInstagram,
            youtube: settingsYoutube,
            facebook: settingsFacebook,
          },
          serviceSchedule: {
            dayOfWeek: settingsDay,
            hour: settingsHour,
            minute: settingsMinute,
            timezone: settingsTimezone,
          },
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setContent(updated);
        showToast("Settings saved!", "success");
      } else {
        showToast("Failed to save settings.", "error");
      }
    } catch {
      showToast("Connection error.", "error");
    }
    setIsSavingSettings(false);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 8: INSIGHTS — DELETE
  // ═══════════════════════════════════════════════════════════════════════════

  const handleDeleteInsight = async (id: string) => {
    if (!token) return;
    setIsDeletingInsight(id);
    try {
      const res = await fetch(`/api/insights?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setInsights((prev) => prev.filter((i) => i.id !== id));
        showToast("Insight removed.", "success");
      } else {
        showToast("Failed to delete insight.", "error");
      }
    } catch {
      showToast("Connection error.", "error");
    }
    setIsDeletingInsight(null);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // PRAYER EDIT — SAVE
  // ═══════════════════════════════════════════════════════════════════════════

  const openEditPrayer = (prayer: Prayer) => {
    setEditingPrayer(prayer);
    setEditPrayerName(prayer.name);
    setEditPrayerRequest(prayer.request);
    setEditPrayerAnonymous(prayer.isAnonymous);
  };

  const handleSavePrayerEdit = async () => {
    if (!token || !editingPrayer) return;
    setIsSavingPrayer(true);
    try {
      const res = await fetch("/api/prayers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingPrayer.id,
          name: editPrayerAnonymous ? "Anonymous" : editPrayerName,
          request: editPrayerRequest,
          isAnonymous: editPrayerAnonymous,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setPrayers((prev) =>
          prev.map((p) => (p.id === editingPrayer.id ? { ...p, ...updated } : p))
        );
        setEditingPrayer(null);
        showToast("Prayer updated successfully!", "success");
      } else {
        showToast("Failed to update prayer.", "error");
      }
    } catch {
      showToast("Connection error.", "error");
    }
    setIsSavingPrayer(false);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TESTIMONY EDIT — SAVE
  // ═══════════════════════════════════════════════════════════════════════════

  const openEditTestimony = (testimony: Testimony) => {
    setEditingTestimony(testimony);
    setEditTestimonyName(testimony.name);
    setEditTestimonyText(testimony.text);
    setEditTestimonyAnonymous(testimony.isAnonymous);
    setEditTestimonyApproved(testimony.approved);
  };

  const handleSaveTestimonyEdit = async () => {
    if (!token || !editingTestimony) return;
    setIsSavingTestimony(true);
    try {
      const res = await fetch("/api/testimonies", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingTestimony.id,
          name: editTestimonyAnonymous ? "Anonymous" : editTestimonyName,
          text: editTestimonyText,
          isAnonymous: editTestimonyAnonymous,
          approved: editTestimonyApproved,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setTestimonies((prev) =>
          prev.map((t) =>
            t.id === editingTestimony.id ? { ...t, ...updated } : t
          )
        );
        setEditingTestimony(null);
        showToast("Testimony updated successfully!", "success");
      } else {
        showToast("Failed to update testimony.", "error");
      }
    } catch {
      showToast("Connection error.", "error");
    }
    setIsSavingTestimony(false);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB CONFIG
  // ═══════════════════════════════════════════════════════════════════════════

  const tabs: { id: Tab; label: string }[] = [
    { id: "this-sunday", label: "This Sunday" },
    { id: "daily-scripture", label: "Daily Scripture" },
    { id: "past-lessons", label: "Past Lessons" },
    { id: "flyer", label: "Flyer Generator" },
    { id: "prayers", label: "Prayers" },
    { id: "testimonies", label: "Testimonies" },
    { id: "insights", label: "Insights" },
    { id: "settings", label: "Settings" },
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // LOADING SCREEN
  // ═══════════════════════════════════════════════════════════════════════════

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center pt-20">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-pulse-soft">
            <WaterCrossLogo size={48} />
          </div>
          <p className="text-[#4a6580] text-sm font-body">Loading...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH SCREEN
  // ═══════════════════════════════════════════════════════════════════════════

  if (!token) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <Card className="shadow-md border-0">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="flex justify-center mb-4">
                <WaterCrossLogo size={60} />
              </div>
              <h1 className="font-display text-2xl font-bold text-[#0a1a2f] mb-1">
                Admin Dashboard
              </h1>
              <p className="text-sm font-body text-[#4a6580] mb-6">
                L.I.F.E. Ministry Management
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 px-4 font-body"
                    autoFocus
                  />
                </div>

                {loginError && (
                  <p className="text-sm font-body text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    {loginError}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={isLoggingIn || !password}
                  className="w-full h-11 bg-[#1a6fb5] hover:bg-[#155d99] text-white font-semibold font-body"
                  size="lg"
                >
                  {isLoggingIn ? (
                    <>
                      <Spinner />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#f0f4f8] pt-16">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ─── Top Header Bar ──────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-border sticky top-[64px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-lg font-bold text-[#0a1a2f] leading-tight">
                Admin Dashboard
              </h1>
            </div>

            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-sm font-body text-[#4a6580] hover:text-red-600 hover:bg-red-50"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Tab Navigation + Content ─────────────────────────────────────────── */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as Tab)}
        className="w-full"
      >
        <nav className="bg-white border-b border-border sticky top-[120px] z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <TabsList variant="line" className="w-full justify-start h-auto py-0 overflow-x-auto">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="px-4 py-3 text-sm font-body font-medium whitespace-nowrap data-active:text-[#1a6fb5]"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </nav>

        {/* ─── Tab Content ─────────────────────────────────────────────────────── */}
        <main className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
          <div className="min-h-[60vh]">
            {/* ═════════════════════════════════════════════════════════════════
                TAB 1: THIS SUNDAY
                ═════════════════════════════════════════════════════════════════ */}
            <TabsContent value="this-sunday">
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-display font-semibold text-[#0a1a2f] mb-1">
                    This Sunday
                  </h2>
                  <p className="text-sm font-body text-[#4a6580] mb-2">
                    Update the details for this week&apos;s service.
                  </p>
                  <Badge variant="secondary" className="font-body text-xs">
                    This content appears on your homepage and Watch page.
                  </Badge>
                </div>

                <Card className="shadow-sm border-0">
                  <CardContent className="pt-6">
                    <div className="space-y-5">
                      {/* Date */}
                      <div>
                        <label className={labelClass}>Service Date</label>
                        <Input
                          type="date"
                          value={sundayDate}
                          onChange={(e) => setSundayDate(e.target.value)}
                          className="h-11 px-4 font-body"
                        />
                        {sundayDate && (
                          <p className="text-xs font-body text-[#4a6580] mt-1">
                            {formatDate(sundayDate)}
                          </p>
                        )}
                      </div>

                      <Separator />

                      {/* Title */}
                      <div>
                        <label className={labelClass}>Sermon Title</label>
                        <Input
                          type="text"
                          value={sundayTitle}
                          onChange={(e) =>
                            setSundayTitle(e.target.value.slice(0, 60))
                          }
                          maxLength={60}
                          placeholder="Walking in the Light"
                          className="h-11 px-4 font-body"
                        />
                        <CharCounter current={sundayTitle.length} max={60} />
                      </div>

                      {/* Scripture */}
                      <div>
                        <label className={labelClass}>Scripture Reference</label>
                        <Input
                          type="text"
                          value={sundayScripture}
                          onChange={(e) =>
                            setSundayScripture(e.target.value.slice(0, 40))
                          }
                          maxLength={40}
                          placeholder="John 8:12"
                          className="h-11 px-4 font-body"
                        />
                        <CharCounter current={sundayScripture.length} max={40} />
                      </div>

                      {/* Description */}
                      <div>
                        <label className={labelClass}>Description</label>
                        <Textarea
                          rows={6}
                          value={sundayDescription}
                          onChange={(e) =>
                            setSundayDescription(e.target.value.slice(0, 300))
                          }
                          maxLength={300}
                          placeholder="Write about this Sunday's message..."
                          className="px-4 py-3 font-body resize-y"
                        />
                        <CharCounter current={sundayDescription.length} max={300} />
                      </div>

                      <Separator />

                      {/* Google Meet Link */}
                      <div>
                        <label className={labelClass}>Google Meet Link</label>
                        <Input
                          type="text"
                          value={sundayMeetLink}
                          onChange={(e) => setSundayMeetLink(e.target.value)}
                          placeholder="https://meet.google.com/xxx-xxx-xxx"
                          className="h-11 px-4 font-body"
                        />
                        <p className="text-xs font-body text-[#4a6580] mt-1">
                          Members will use this link to join the live service.
                        </p>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="mt-8 flex justify-end">
                      <Button
                        onClick={handleSaveThisSunday}
                        disabled={isSavingSunday}
                        className="h-11 px-8 bg-[#1a6fb5] hover:bg-[#155d99] text-white font-semibold font-body"
                        size="lg"
                      >
                        {isSavingSunday ? (
                          <>
                            <Spinner />
                            Saving...
                          </>
                        ) : (
                          "Save This Sunday"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Preview */}
                {(sundayTitle || sundayScripture) && (
                  <Card className="shadow-sm border border-[#1a6fb5]/20">
                    <CardHeader>
                      <Badge variant="outline" className="w-fit font-body text-xs text-[#1a6fb5] border-[#1a6fb5]/30">
                        Preview
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-display text-xl font-bold text-[#0a1a2f]">
                        {sundayTitle || "Untitled"}
                      </h3>
                      <p className="text-sm font-body text-[#1a6fb5] font-medium mt-1">
                        {sundayScripture}
                      </p>
                      {sundayDescription && (
                        <p className="text-sm font-body text-[#4a6580] mt-3 leading-relaxed">
                          {sundayDescription}
                        </p>
                      )}
                      {sundayDate && (
                        <p className="text-xs font-body text-[#4a6580] mt-3">
                          {formatDate(sundayDate)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ═════════════════════════════════════════════════════════════════
                TAB 2: DAILY SCRIPTURE
                ═════════════════════════════════════════════════════════════════ */}
            <TabsContent value="daily-scripture">
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-display font-semibold text-[#0a1a2f] mb-1">
                    Daily Scripture
                  </h2>
                  <p className="text-sm font-body text-[#4a6580] mb-6">
                    View today&apos;s auto-generated scripture or override it with
                    your own.
                  </p>
                </div>

                {/* Current Scripture Display */}
                {dailyScripture && dailyScripture.verse && (
                  <Card className="shadow-sm border-0">
                    <CardHeader>
                      <div className="flex items-start justify-between w-full">
                        <Badge variant="secondary" className="font-body text-xs">
                          Today&apos;s Scripture
                        </Badge>
                        {dailyScripture.isManualOverride && (
                          <Badge variant="outline" className="font-body text-xs text-amber-700 bg-amber-50 border-amber-200">
                            Custom Override
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <blockquote className="font-display text-lg text-[#0a1a2f] italic leading-relaxed mb-3">
                        &ldquo;{dailyScripture.verse}&rdquo;
                      </blockquote>
                      <p className="text-sm font-body text-[#1a6fb5] font-semibold mb-2">
                        {dailyScripture.reference}
                      </p>
                      <p className="text-sm font-body text-[#4a6580] leading-relaxed">
                        {dailyScripture.reflection}
                      </p>
                      <Separator className="my-4" />
                      <p className="text-xs font-body text-[#4a6580]">
                        Generated: {formatTimestamp(dailyScripture.generatedAt)}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Override Toggle */}
                <Card className="shadow-sm border-0">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-semibold font-body text-[#0a1a2f] text-sm">
                          Override with custom scripture
                        </p>
                        <p className="text-xs font-body text-[#4a6580] mt-0.5">
                          Replace the AI-generated scripture for today
                        </p>
                      </div>
                      <button
                        onClick={() => setScriptureOverride(!scriptureOverride)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          scriptureOverride ? "bg-[#1a6fb5]" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            scriptureOverride ? "translate-x-6" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {scriptureOverride && (
                      <div className="space-y-4 pt-4 border-t border-border">
                        <div>
                          <label className={labelClass}>Verse Text</label>
                          <Textarea
                            rows={3}
                            value={customVerse}
                            onChange={(e) => setCustomVerse(e.target.value)}
                            placeholder="For God so loved the world..."
                            className="px-4 py-3 font-body resize-y"
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Reference</label>
                          <Input
                            type="text"
                            value={customReference}
                            onChange={(e) => setCustomReference(e.target.value)}
                            placeholder="John 3:16"
                            className="h-11 px-4 font-body"
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Reflection</label>
                          <Input
                            type="text"
                            value={customReflection}
                            onChange={(e) => setCustomReflection(e.target.value)}
                            placeholder="A warm, encouraging one-line reflection..."
                            className="h-11 px-4 font-body"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <p className="text-xs font-body text-[#4a6580]">
                            Leave empty to use AI-generated scripture tomorrow.
                          </p>
                          <Button
                            onClick={handleSaveScripture}
                            disabled={
                              isSavingScripture ||
                              !customVerse.trim() ||
                              !customReference.trim() ||
                              !customReflection.trim()
                            }
                            className="bg-[#1a6fb5] hover:bg-[#155d99] text-white font-semibold font-body"
                            size="lg"
                          >
                            {isSavingScripture ? (
                              <>
                                <Spinner />
                                Saving...
                              </>
                            ) : (
                              "Save Custom Scripture"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ═════════════════════════════════════════════════════════════════
                TAB 3: PAST LESSONS
                ═════════════════════════════════════════════════════════════════ */}
            <TabsContent value="past-lessons">
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-display font-semibold text-[#0a1a2f] mb-1">
                    Past Lessons
                  </h2>
                  <p className="text-sm font-body text-[#4a6580] mb-6">
                    Manage YouTube video links for past sermons and Bible studies.
                  </p>
                </div>

                {/* Add Video Form */}
                <Card className="shadow-sm border-0">
                  <CardHeader>
                    <CardTitle className="font-display text-[#0a1a2f]">Add New Video</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className={labelClass}>YouTube URL</label>
                        <Input
                          type="text"
                          value={newVideoUrl}
                          onChange={(e) => setNewVideoUrl(e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          className="h-11 px-4 font-body"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Title</label>
                        <Input
                          type="text"
                          value={newVideoTitle}
                          onChange={(e) => setNewVideoTitle(e.target.value)}
                          placeholder="Walking in the Light"
                          className="h-11 px-4 font-body"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Date</label>
                        <Input
                          type="date"
                          value={newVideoDate}
                          onChange={(e) => setNewVideoDate(e.target.value)}
                          className="h-11 px-4 font-body"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>
                          Scripture Reference{" "}
                          <span className="text-[#4a6580] font-normal">
                            (optional)
                          </span>
                        </label>
                        <Input
                          type="text"
                          value={newVideoScripture}
                          onChange={(e) => setNewVideoScripture(e.target.value)}
                          placeholder="John 8:12"
                          className="h-11 px-4 font-body"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={handleAddVideo}
                        className="bg-[#0a1a2f] hover:bg-[#0a1a2f]/80 text-white font-semibold font-body"
                      >
                        Add Video
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Video List */}
                {youtubeVideos.length > 0 ? (
                  <div className="space-y-3">
                    {youtubeVideos.map((video) => (
                      <Card key={video.id} className="shadow-sm border-0">
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold font-body text-[#0a1a2f] text-sm truncate">
                                {video.title}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                {video.date && (
                                  <span className="text-xs font-body text-[#4a6580]">
                                    {formatDate(video.date)}
                                  </span>
                                )}
                                {video.scripture && (
                                  <Badge variant="secondary" className="font-body text-xs">
                                    {video.scripture}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs font-body text-[#4a6580] mt-0.5 truncate">
                                {video.url}
                              </p>
                            </div>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteVideo(video.id)}
                              title="Remove video"
                            >
                              <TrashIcon />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={handleSaveVideos}
                        disabled={isSavingVideos}
                        className="h-11 px-8 bg-[#1a6fb5] hover:bg-[#155d99] text-white font-semibold font-body"
                        size="lg"
                      >
                        {isSavingVideos ? (
                          <>
                            <Spinner />
                            Saving...
                          </>
                        ) : (
                          "Save All Videos"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Card className="shadow-sm border-0">
                    <CardContent className="text-center py-12">
                      <p className="text-[#4a6580] text-sm font-body">
                        No past lessons yet. Add your first video above.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ═════════════════════════════════════════════════════════════════
                TAB 4: FLYER GENERATOR
                ═════════════════════════════════════════════════════════════════ */}
            <TabsContent value="flyer">
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-display font-semibold text-[#0a1a2f] mb-1">
                    Flyer Generator
                  </h2>
                  <p className="text-sm font-body text-[#4a6580] mb-6">
                    Generate beautiful flyers for social media. Enter your sermon
                    details and AI will create the copy.
                  </p>
                </div>

                {/* Input Form */}
                <Card className="shadow-sm border-0">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>Sermon Title</label>
                        <Input
                          type="text"
                          value={flyerTitle}
                          onChange={(e) => setFlyerTitle(e.target.value)}
                          placeholder="Walking in the Light"
                          className="h-11 px-4 font-body"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Scripture Reference</label>
                        <Input
                          type="text"
                          value={flyerScripture}
                          onChange={(e) => setFlyerScripture(e.target.value)}
                          placeholder="John 8:12"
                          className="h-11 px-4 font-body"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          Description{" "}
                          <span className="text-[#4a6580] font-normal">
                            (optional)
                          </span>
                        </label>
                        <Textarea
                          rows={3}
                          value={flyerDescription}
                          onChange={(e) => setFlyerDescription(e.target.value)}
                          placeholder="A brief description of the sermon topic..."
                          className="px-4 py-3 font-body resize-y"
                        />
                      </div>
                    </div>
                    <div className="mt-5 flex justify-end">
                      <Button
                        onClick={handleGenerateFlyer}
                        disabled={
                          isGeneratingFlyer ||
                          !flyerTitle.trim() ||
                          !flyerScripture.trim()
                        }
                        className="h-11 px-8 bg-[#1a6fb5] hover:bg-[#155d99] text-white font-semibold font-body"
                        size="lg"
                      >
                        {isGeneratingFlyer ? (
                          <>
                            <Spinner />
                            Generating...
                          </>
                        ) : (
                          "Generate Flyer"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Template Selector + Preview */}
                {flyerData && (
                  <div className="space-y-4">
                    {/* Template Buttons */}
                    <Card className="shadow-sm border-0">
                      <CardHeader>
                        <CardTitle className="font-display text-[#0a1a2f]">Choose a Template</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-3">
                          {([1, 2, 3] as const).map((t) => (
                            <Button
                              key={t}
                              onClick={() => setFlyerTemplate(t)}
                              variant={flyerTemplate === t ? "default" : "outline"}
                              className={`flex-1 font-body ${
                                flyerTemplate === t
                                  ? "bg-[#1a6fb5] text-white hover:bg-[#155d99]"
                                  : ""
                              }`}
                            >
                              {t === 1
                                ? "Living Water"
                                : t === 2
                                  ? "Clean Light"
                                  : "Bold Sky"}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Preview */}
                    <Card className="shadow-sm border-0">
                      <CardHeader>
                        <div className="flex items-center justify-between w-full">
                          <CardTitle className="font-display text-[#0a1a2f]">Flyer Preview</CardTitle>
                          <p className="text-xs font-body text-[#4a6580]">
                            Screenshot the flyer below to share on social media
                          </p>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div
                          ref={flyerRef}
                          className="flex justify-center overflow-x-auto"
                        >
                          <FlyerTemplate
                            data={flyerData}
                            template={flyerTemplate}
                          />
                        </div>
                        <div className="mt-4 flex items-center justify-center gap-4">
                          <Button
                            variant="outline"
                            className="font-body text-sm"
                            onClick={() => window.print()}
                          >
                            Print / Save as PDF
                          </Button>
                          <p className="text-xs font-body text-[#4a6580]">
                            Tip: Use your browser&apos;s print dialog to save as PDF, or take a screenshot to share directly.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ═════════════════════════════════════════════════════════════════
                TAB 5: PRAYERS
                ═════════════════════════════════════════════════════════════════ */}
            <TabsContent value="prayers">
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-display font-semibold text-[#0a1a2f] mb-1">
                      Prayer Requests
                    </h2>
                    <p className="text-sm font-body text-[#4a6580]">
                      {prayers.length} prayer request
                      {prayers.length !== 1 ? "s" : ""} from the community.
                    </p>
                  </div>
                </div>

                {prayers.length > 0 ? (
                  <div className="space-y-3">
                    {prayers.map((prayer) => (
                      <Card key={prayer.id} className="shadow-sm border-0">
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-semibold font-body text-[#0a1a2f] text-sm">
                                  {prayer.name}
                                </p>
                                {prayer.isAnonymous && (
                                  <Badge variant="secondary" className="font-body text-xs">
                                    Anonymous
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm font-body text-[#4a6580] leading-relaxed">
                                {prayer.request}
                              </p>
                              <div className="flex items-center gap-4 mt-3">
                                <span className="text-xs font-body text-[#4a6580]">
                                  {formatTimestamp(prayer.createdAt)}
                                </span>
                                <Badge variant="outline" className="font-body text-xs text-[#1a6fb5]">
                                  {prayer.prayerCount} prayer
                                  {prayer.prayerCount !== 1 ? "s" : ""}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditPrayer(prayer)}
                                className="text-[#1a6fb5] hover:text-[#155d99] hover:bg-blue-50"
                                title="Edit prayer request"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => handleDeletePrayer(prayer.id)}
                                disabled={isDeletingPrayer === prayer.id}
                                title="Delete prayer request"
                              >
                                {isDeletingPrayer === prayer.id ? (
                                  <Spinner />
                                ) : (
                                  <TrashIcon />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="shadow-sm border-0">
                    <CardContent className="text-center py-12">
                      <p className="text-[#4a6580] text-sm font-body">
                        No prayer requests yet.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Prayer Edit Dialog */}
                <Dialog open={!!editingPrayer} onOpenChange={(open) => { if (!open) setEditingPrayer(null); }}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-display text-[#0a1a2f]">Edit Prayer Request</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div>
                        <label className={labelClass}>Name</label>
                        <Input
                          type="text"
                          value={editPrayerName}
                          onChange={(e) => setEditPrayerName(e.target.value)}
                          placeholder="Name"
                          className="h-11 px-4 font-body"
                          disabled={editPrayerAnonymous}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Prayer Request</label>
                        <Textarea
                          rows={4}
                          value={editPrayerRequest}
                          onChange={(e) => setEditPrayerRequest(e.target.value)}
                          placeholder="Prayer request..."
                          className="px-4 py-3 font-body resize-y"
                        />
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editPrayerAnonymous}
                          onChange={(e) => {
                            setEditPrayerAnonymous(e.target.checked);
                            if (e.target.checked) setEditPrayerName("Anonymous");
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-[#1a6fb5] focus:ring-[#1a6fb5]"
                        />
                        <span className="text-sm font-body text-[#0a1a2f]">Anonymous</span>
                      </label>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleSavePrayerEdit}
                        disabled={isSavingPrayer || !editPrayerRequest.trim()}
                        className="bg-[#1a6fb5] hover:bg-[#155d99] text-white font-semibold font-body"
                      >
                        {isSavingPrayer ? (
                          <>
                            <Spinner />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>

            {/* ═════════════════════════════════════════════════════════════════
                TAB 6: TESTIMONIES
                ═════════════════════════════════════════════════════════════════ */}
            <TabsContent value="testimonies">
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-display font-semibold text-[#0a1a2f] mb-1">
                    Testimonies
                  </h2>
                  <p className="text-sm font-body text-[#4a6580]">
                    {testimonies.length} testimon
                    {testimonies.length !== 1 ? "ies" : "y"} total.{" "}
                    {testimonies.filter((t) => !t.approved).length} awaiting
                    approval.
                  </p>
                </div>

                {testimonies.length > 0 ? (
                  <div className="space-y-3">
                    {testimonies.map((testimony) => (
                      <Card
                        key={testimony.id}
                        className={`shadow-sm border-0 ${
                          !testimony.approved
                            ? "border-l-4 border-l-amber-400"
                            : ""
                        }`}
                      >
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <p className="font-semibold font-body text-[#0a1a2f] text-sm">
                                  {testimony.name}
                                </p>
                                {!testimony.approved ? (
                                  <Badge variant="outline" className="font-body text-xs text-amber-700 bg-amber-50 border-amber-200">
                                    Pending Approval
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="font-body text-xs text-emerald-700 bg-emerald-50 border-emerald-200">
                                    Approved
                                  </Badge>
                                )}
                                {testimony.isAnonymous && (
                                  <Badge variant="secondary" className="font-body text-xs">
                                    Anonymous
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm font-body text-[#4a6580] leading-relaxed">
                                {testimony.text}
                              </p>
                              <div className="flex items-center gap-4 mt-3">
                                <span className="text-xs font-body text-[#4a6580]">
                                  {formatTimestamp(testimony.createdAt)}
                                </span>
                                <Badge variant="outline" className="font-body text-xs text-[#1a6fb5]">
                                  {testimony.blessedCount} blessed
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {!testimony.approved && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleApproveTestimony(testimony.id)
                                  }
                                  disabled={
                                    isApprovingTestimony === testimony.id
                                  }
                                  className="text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                                  title="Approve testimony"
                                >
                                  {isApprovingTestimony === testimony.id ? (
                                    <Spinner />
                                  ) : (
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditTestimony(testimony)}
                                className="text-[#1a6fb5] hover:text-[#155d99] hover:bg-blue-50"
                                title="Edit testimony"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() =>
                                  handleDeleteTestimony(testimony.id)
                                }
                                disabled={isDeletingTestimony === testimony.id}
                                title="Delete testimony"
                              >
                                {isDeletingTestimony === testimony.id ? (
                                  <Spinner />
                                ) : (
                                  <TrashIcon />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="shadow-sm border-0">
                    <CardContent className="text-center py-12">
                      <p className="text-[#4a6580] text-sm font-body">
                        No testimonies yet.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Testimony Edit Dialog */}
                <Dialog open={!!editingTestimony} onOpenChange={(open) => { if (!open) setEditingTestimony(null); }}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-display text-[#0a1a2f]">Edit Testimony</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div>
                        <label className={labelClass}>Name</label>
                        <Input
                          type="text"
                          value={editTestimonyName}
                          onChange={(e) => setEditTestimonyName(e.target.value)}
                          placeholder="Name"
                          className="h-11 px-4 font-body"
                          disabled={editTestimonyAnonymous}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Testimony</label>
                        <Textarea
                          rows={5}
                          value={editTestimonyText}
                          onChange={(e) => setEditTestimonyText(e.target.value)}
                          placeholder="Testimony text..."
                          className="px-4 py-3 font-body resize-y"
                        />
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editTestimonyAnonymous}
                          onChange={(e) => {
                            setEditTestimonyAnonymous(e.target.checked);
                            if (e.target.checked) setEditTestimonyName("Anonymous");
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-[#1a6fb5] focus:ring-[#1a6fb5]"
                        />
                        <span className="text-sm font-body text-[#0a1a2f]">Anonymous</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editTestimonyApproved}
                          onChange={(e) => setEditTestimonyApproved(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                        />
                        <span className="text-sm font-body text-[#0a1a2f]">Approved</span>
                      </label>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleSaveTestimonyEdit}
                        disabled={isSavingTestimony || !editTestimonyText.trim()}
                        className="bg-[#1a6fb5] hover:bg-[#155d99] text-white font-semibold font-body"
                      >
                        {isSavingTestimony ? (
                          <>
                            <Spinner />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>

            {/* ═════════════════════════════════════════════════════════════════
                TAB 8: INSIGHTS
                ═════════════════════════════════════════════════════════════════ */}
            <TabsContent value="insights">
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-display font-semibold text-[#0a1a2f] mb-1">
                      Ask The Word Insights
                    </h2>
                    <p className="text-sm font-body text-[#4a6580]">
                      {insights.length} shared topic
                      {insights.length !== 1 ? "s" : ""} from the community.
                    </p>
                  </div>
                </div>

                {insights.length > 0 ? (
                  <div className="space-y-3">
                    {insights.map((insight) => (
                      <Card key={insight.id} className="shadow-sm border-0">
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold font-body text-[#0a1a2f] text-sm">
                                {insight.topic}
                              </p>
                              <div className="flex items-center gap-4 mt-3">
                                <span className="text-xs font-body text-[#4a6580]">
                                  {formatTimestamp(insight.timestamp)}
                                </span>
                                {insight.scripture && (
                                  <Badge variant="secondary" className="font-body text-xs">
                                    {insight.scripture}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteInsight(insight.id)}
                              disabled={isDeletingInsight === insight.id}
                              title="Delete insight"
                            >
                              {isDeletingInsight === insight.id ? (
                                <Spinner />
                              ) : (
                                <TrashIcon />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="shadow-sm border-0">
                    <CardContent className="text-center py-12">
                      <p className="text-[#4a6580] text-sm font-body">
                        No insights yet. When visitors share their topics from Ask The Word, they&apos;ll appear here.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ═════════════════════════════════════════════════════════════════
                TAB 7: SETTINGS
                ═════════════════════════════════════════════════════════════════ */}
            <TabsContent value="settings">
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-display font-semibold text-[#0a1a2f] mb-1">
                    Settings
                  </h2>
                  <p className="text-sm font-body text-[#4a6580] mb-6">
                    Ministry contact info, social links, and service schedule.
                  </p>
                </div>

                {/* Contact Info */}
                <Card className="shadow-sm border-0">
                  <CardHeader>
                    <CardTitle className="font-display text-[#0a1a2f]">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Ministry Email</label>
                        <Input
                          type="email"
                          value={settingsEmail}
                          onChange={(e) => setSettingsEmail(e.target.value)}
                          placeholder="pastor@lifeministry.org"
                          className="h-11 px-4 font-body"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Phone Number</label>
                        <Input
                          type="tel"
                          value={settingsPhone}
                          onChange={(e) => setSettingsPhone(e.target.value)}
                          placeholder="(555) 123-4567"
                          className="h-11 px-4 font-body"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Social Links */}
                <Card className="shadow-sm border-0">
                  <CardHeader>
                    <CardTitle className="font-display text-[#0a1a2f]">Social Media Links</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>TikTok URL</label>
                        <Input
                          type="url"
                          value={settingsTiktok}
                          onChange={(e) => setSettingsTiktok(e.target.value)}
                          placeholder="https://tiktok.com/@..."
                          className="h-11 px-4 font-body"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Instagram URL</label>
                        <Input
                          type="url"
                          value={settingsInstagram}
                          onChange={(e) => setSettingsInstagram(e.target.value)}
                          placeholder="https://instagram.com/..."
                          className="h-11 px-4 font-body"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>YouTube URL</label>
                        <Input
                          type="url"
                          value={settingsYoutube}
                          onChange={(e) => setSettingsYoutube(e.target.value)}
                          placeholder="https://youtube.com/@..."
                          className="h-11 px-4 font-body"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Facebook URL</label>
                        <Input
                          type="url"
                          value={settingsFacebook}
                          onChange={(e) => setSettingsFacebook(e.target.value)}
                          placeholder="https://facebook.com/..."
                          className="h-11 px-4 font-body"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Service Schedule */}
                <Card className="shadow-sm border-0">
                  <CardHeader>
                    <CardTitle className="font-display text-[#0a1a2f]">Service Schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <label className={labelClass}>Day of Week</label>
                        <select
                          value={settingsDay}
                          onChange={(e) => setSettingsDay(Number(e.target.value))}
                          className="h-11 w-full rounded-lg border border-input bg-transparent px-4 py-2 text-sm font-body transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          <option value={0}>Sunday</option>
                          <option value={1}>Monday</option>
                          <option value={2}>Tuesday</option>
                          <option value={3}>Wednesday</option>
                          <option value={4}>Thursday</option>
                          <option value={5}>Friday</option>
                          <option value={6}>Saturday</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Hour</label>
                        <select
                          value={settingsHour}
                          onChange={(e) =>
                            setSettingsHour(Number(e.target.value))
                          }
                          className="h-11 w-full rounded-lg border border-input bg-transparent px-4 py-2 text-sm font-body transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>
                              {i === 0
                                ? "12 AM"
                                : i < 12
                                  ? `${i} AM`
                                  : i === 12
                                    ? "12 PM"
                                    : `${i - 12} PM`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Minute</label>
                        <select
                          value={settingsMinute}
                          onChange={(e) =>
                            setSettingsMinute(Number(e.target.value))
                          }
                          className="h-11 w-full rounded-lg border border-input bg-transparent px-4 py-2 text-sm font-body transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          {[0, 15, 30, 45].map((m) => (
                            <option key={m} value={m}>
                              :{m.toString().padStart(2, "0")}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Timezone</label>
                        <select
                          value={settingsTimezone}
                          onChange={(e) => setSettingsTimezone(e.target.value)}
                          className="h-11 w-full rounded-lg border border-input bg-transparent px-4 py-2 text-sm font-body transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          <option value="America/New_York">Eastern</option>
                          <option value="America/Chicago">Central</option>
                          <option value="America/Denver">Mountain</option>
                          <option value="America/Los_Angeles">Pacific</option>
                          <option value="America/Anchorage">Alaska</option>
                          <option value="Pacific/Honolulu">Hawaii</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Save Settings */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings}
                    className="h-11 px-8 bg-[#1a6fb5] hover:bg-[#155d99] text-white font-semibold font-body"
                    size="lg"
                  >
                    {isSavingSettings ? (
                      <>
                        <Spinner />
                        Saving...
                      </>
                    ) : (
                      "Save Settings"
                    )}
                  </Button>
                </div>

                {/* Last Updated */}
                {content?.lastUpdated && (
                  <p className="text-xs font-body text-[#4a6580] text-center">
                    Last updated: {formatTimestamp(content.lastUpdated)}
                  </p>
                )}
              </div>
            </TabsContent>
          </div>
        </main>
      </Tabs>
    </div>
  );
}
