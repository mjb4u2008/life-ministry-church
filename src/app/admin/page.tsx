"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import FlyerTemplate from "@/components/FlyerTemplates";
import type { FlyerData } from "@/components/FlyerTemplates";

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

type Tab =
  | "this-sunday"
  | "daily-scripture"
  | "past-lessons"
  | "flyer"
  | "prayers"
  | "testimonies"
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
        className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
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
          \u00d7
        </button>
      </div>
    </div>
  );
}

// ─── Water Cross Logo (inline SVG) ─────────────────────────────────────────────

function WaterCrossLogo({ size = 60 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 260"
      className="text-water"
      fill="currentColor"
    >
      <rect x="85" y="10" width="30" height="180" rx="6" />
      <rect x="35" y="60" width="130" height="30" rx="6" />
      <path
        d="M100 200 C75 175, 45 190, 35 215 C25 240, 50 260, 100 260 C150 260, 175 240, 165 215 C155 190, 125 175, 100 200Z"
        opacity="0.6"
      />
    </svg>
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

// ─── Shared Input Styles ────────────────────────────────────────────────────────

const inputClass =
  "w-full bg-white border border-border-light rounded-lg px-4 py-3 text-deep placeholder:text-text-light focus:border-water focus:ring-2 focus:ring-water/20 focus:outline-none";
const labelClass = "block text-sm font-semibold text-deep mb-1.5";
const cardClass = "bg-white rounded-xl p-6 shadow-sm";
const sectionHeadingClass = "text-xl font-display font-semibold text-deep mb-1";
const sectionDescClass = "text-sm text-text-body mb-6";

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
        const [contentRes, prayersRes, testimoniesRes, scriptureRes] =
          await Promise.all([
            fetch("/api/content"),
            fetch("/api/prayers"),
            fetch("/api/testimonies", {
              headers: { Authorization: `Bearer ${t}` },
            }),
            fetch("/api/daily-scripture"),
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
  // TAB CONFIG
  // ═══════════════════════════════════════════════════════════════════════════

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "this-sunday", label: "This Sunday", icon: "\u2600" },
    { id: "daily-scripture", label: "Daily Scripture", icon: "\u2728" },
    { id: "past-lessons", label: "Past Lessons", icon: "\u25b6" },
    { id: "flyer", label: "Flyer Generator", icon: "\ud83d\uddbc" },
    { id: "prayers", label: "Prayers", icon: "\ud83d\ude4f" },
    { id: "testimonies", label: "Testimonies", icon: "\ud83d\udcac" },
    { id: "settings", label: "Settings", icon: "\u2699" },
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // LOADING SCREEN
  // ═══════════════════════════════════════════════════════════════════════════

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cloud flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-pulse-soft">
            <WaterCrossLogo size={48} />
          </div>
          <p className="text-text-body text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH SCREEN
  // ═══════════════════════════════════════════════════════════════════════════

  if (!token) {
    return (
      <div className="min-h-screen bg-cloud flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className={`${cardClass} text-center`}>
            <div className="flex justify-center mb-4">
              <WaterCrossLogo size={60} />
            </div>
            <h1 className="font-display text-2xl font-bold text-deep mb-1">
              Admin Dashboard
            </h1>
            <p className="text-sm text-text-body mb-6">
              L.I.F.E. Ministry Management
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
              </div>

              {loginError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoggingIn || !password}
                className="w-full bg-water text-white font-semibold py-3 rounded-lg hover:bg-water-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoggingIn ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
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
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-cloud">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ─── Top Header Bar ──────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-border-light sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <WaterCrossLogo size={32} />
              <div>
                <h1 className="font-display text-lg font-bold text-deep leading-tight">
                  L.I.F.E. Admin
                </h1>
                <p className="text-xs text-text-light -mt-0.5">Dashboard</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="text-sm text-text-body hover:text-red-600 font-medium px-4 py-2 rounded-lg hover:bg-red-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ─── Tab Navigation ──────────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-border-light sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto scrollbar-none -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-water text-water"
                    : "border-transparent text-text-body hover:text-water hover:border-water/30"
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ─── Tab Content ─────────────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="min-h-[60vh]">
          {/* ═════════════════════════════════════════════════════════════════
              TAB 1: THIS SUNDAY
              ═════════════════════════════════════════════════════════════════ */}
          {activeTab === "this-sunday" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className={sectionHeadingClass}>This Sunday</h2>
                <p className={sectionDescClass}>
                  Update the details for this week&apos;s service. This appears
                  on the home page.
                </p>
              </div>

              <div className={cardClass}>
                <div className="space-y-5">
                  {/* Date */}
                  <div>
                    <label className={labelClass}>Service Date</label>
                    <input
                      type="date"
                      value={sundayDate}
                      onChange={(e) => setSundayDate(e.target.value)}
                      className={inputClass}
                    />
                    {sundayDate && (
                      <p className="text-xs text-text-light mt-1">
                        {formatDate(sundayDate)}
                      </p>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <label className={labelClass}>Sermon Title</label>
                    <input
                      type="text"
                      value={sundayTitle}
                      onChange={(e) => setSundayTitle(e.target.value)}
                      placeholder="Walking in the Light"
                      className={inputClass}
                    />
                  </div>

                  {/* Scripture */}
                  <div>
                    <label className={labelClass}>Scripture Reference</label>
                    <input
                      type="text"
                      value={sundayScripture}
                      onChange={(e) => setSundayScripture(e.target.value)}
                      placeholder="John 8:12"
                      className={inputClass}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className={labelClass}>Description</label>
                    <textarea
                      rows={6}
                      value={sundayDescription}
                      onChange={(e) => setSundayDescription(e.target.value)}
                      placeholder="Write about this Sunday's message..."
                      className={`${inputClass} resize-y`}
                    />
                  </div>

                  {/* Google Meet Link */}
                  <div>
                    <label className={labelClass}>Google Meet Link</label>
                    <input
                      type="text"
                      value={sundayMeetLink}
                      onChange={(e) => setSundayMeetLink(e.target.value)}
                      placeholder="https://meet.google.com/xxx-xxx-xxx"
                      className={inputClass}
                    />
                    <p className="text-xs text-text-light mt-1">
                      Members will use this link to join the live service.
                    </p>
                  </div>
                </div>

                {/* Save Button */}
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleSaveThisSunday}
                    disabled={isSavingSunday}
                    className="bg-water text-white font-semibold px-8 py-3 rounded-lg hover:bg-water-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSavingSunday ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
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
                        Saving...
                      </>
                    ) : (
                      "Save This Sunday"
                    )}
                  </button>
                </div>
              </div>

              {/* Preview */}
              {(sundayTitle || sundayScripture) && (
                <div className={`${cardClass} border border-sky`}>
                  <p className="text-xs font-semibold text-water uppercase tracking-wider mb-3">
                    Preview
                  </p>
                  <h3 className="font-display text-xl font-bold text-deep">
                    {sundayTitle || "Untitled"}
                  </h3>
                  <p className="text-sm text-water font-medium mt-1">
                    {sundayScripture}
                  </p>
                  {sundayDescription && (
                    <p className="text-sm text-text-body mt-3 leading-relaxed">
                      {sundayDescription}
                    </p>
                  )}
                  {sundayDate && (
                    <p className="text-xs text-text-light mt-3">
                      {formatDate(sundayDate)}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              TAB 2: DAILY SCRIPTURE
              ═════════════════════════════════════════════════════════════════ */}
          {activeTab === "daily-scripture" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className={sectionHeadingClass}>Daily Scripture</h2>
                <p className={sectionDescClass}>
                  View today&apos;s auto-generated scripture or override it with
                  your own.
                </p>
              </div>

              {/* Current Scripture Display */}
              {dailyScripture && dailyScripture.verse && (
                <div className={cardClass}>
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-xs font-semibold text-water uppercase tracking-wider">
                      Today&apos;s Scripture
                    </p>
                    {dailyScripture.isManualOverride && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        Custom Override
                      </span>
                    )}
                  </div>
                  <blockquote className="font-display text-lg text-deep italic leading-relaxed mb-3">
                    &ldquo;{dailyScripture.verse}&rdquo;
                  </blockquote>
                  <p className="text-sm text-water font-semibold mb-2">
                    {dailyScripture.reference}
                  </p>
                  <p className="text-sm text-text-body leading-relaxed">
                    {dailyScripture.reflection}
                  </p>
                  <p className="text-xs text-text-light mt-4">
                    Generated: {formatTimestamp(dailyScripture.generatedAt)}
                  </p>
                </div>
              )}

              {/* Override Toggle */}
              <div className={cardClass}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-deep text-sm">
                      Override with custom scripture
                    </p>
                    <p className="text-xs text-text-light mt-0.5">
                      Replace the AI-generated scripture for today
                    </p>
                  </div>
                  <button
                    onClick={() => setScriptureOverride(!scriptureOverride)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      scriptureOverride ? "bg-water" : "bg-border-light"
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
                  <div className="space-y-4 pt-4 border-t border-border-light">
                    <div>
                      <label className={labelClass}>Verse Text</label>
                      <textarea
                        rows={3}
                        value={customVerse}
                        onChange={(e) => setCustomVerse(e.target.value)}
                        placeholder="For God so loved the world..."
                        className={`${inputClass} resize-y`}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Reference</label>
                      <input
                        type="text"
                        value={customReference}
                        onChange={(e) => setCustomReference(e.target.value)}
                        placeholder="John 3:16"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Reflection</label>
                      <input
                        type="text"
                        value={customReflection}
                        onChange={(e) => setCustomReflection(e.target.value)}
                        placeholder="A warm, encouraging one-line reflection..."
                        className={inputClass}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-text-light">
                        Leave empty to use AI-generated scripture tomorrow.
                      </p>
                      <button
                        onClick={handleSaveScripture}
                        disabled={
                          isSavingScripture ||
                          !customVerse.trim() ||
                          !customReference.trim() ||
                          !customReflection.trim()
                        }
                        className="bg-water text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-water-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                      >
                        {isSavingScripture ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4"
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
                            Saving...
                          </>
                        ) : (
                          "Save Custom Scripture"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              TAB 3: PAST LESSONS
              ═════════════════════════════════════════════════════════════════ */}
          {activeTab === "past-lessons" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className={sectionHeadingClass}>Past Lessons</h2>
                <p className={sectionDescClass}>
                  Manage YouTube video links for past sermons and Bible studies.
                </p>
              </div>

              {/* Add Video Form */}
              <div className={cardClass}>
                <p className="text-sm font-semibold text-deep mb-4">
                  Add New Video
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>YouTube URL</label>
                    <input
                      type="text"
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Title</label>
                    <input
                      type="text"
                      value={newVideoTitle}
                      onChange={(e) => setNewVideoTitle(e.target.value)}
                      placeholder="Walking in the Light"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Date</label>
                    <input
                      type="date"
                      value={newVideoDate}
                      onChange={(e) => setNewVideoDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>
                      Scripture Reference{" "}
                      <span className="text-text-light font-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={newVideoScripture}
                      onChange={(e) => setNewVideoScripture(e.target.value)}
                      placeholder="John 8:12"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleAddVideo}
                    className="bg-deep text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-ocean text-sm"
                  >
                    Add Video
                  </button>
                </div>
              </div>

              {/* Video List */}
              {youtubeVideos.length > 0 ? (
                <div className="space-y-3">
                  {youtubeVideos.map((video) => (
                    <div
                      key={video.id}
                      className={`${cardClass} flex items-center justify-between gap-4`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-deep text-sm truncate">
                          {video.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          {video.date && (
                            <span className="text-xs text-text-light">
                              {formatDate(video.date)}
                            </span>
                          )}
                          {video.scripture && (
                            <span className="text-xs text-water font-medium">
                              {video.scripture}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-light mt-0.5 truncate">
                          {video.url}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteVideo(video.id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg shrink-0"
                        title="Remove video"
                      >
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
                      </button>
                    </div>
                  ))}

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSaveVideos}
                      disabled={isSavingVideos}
                      className="bg-water text-white font-semibold px-8 py-3 rounded-lg hover:bg-water-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSavingVideos ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4"
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
                          Saving...
                        </>
                      ) : (
                        "Save All Videos"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`${cardClass} text-center py-12`}>
                  <p className="text-text-light text-sm">
                    No past lessons yet. Add your first video above.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              TAB 4: FLYER GENERATOR
              ═════════════════════════════════════════════════════════════════ */}
          {activeTab === "flyer" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className={sectionHeadingClass}>Flyer Generator</h2>
                <p className={sectionDescClass}>
                  Generate beautiful flyers for social media. Enter your sermon
                  details and AI will create the copy.
                </p>
              </div>

              {/* Input Form */}
              <div className={cardClass}>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Sermon Title</label>
                    <input
                      type="text"
                      value={flyerTitle}
                      onChange={(e) => setFlyerTitle(e.target.value)}
                      placeholder="Walking in the Light"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Scripture Reference</label>
                    <input
                      type="text"
                      value={flyerScripture}
                      onChange={(e) => setFlyerScripture(e.target.value)}
                      placeholder="John 8:12"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Description{" "}
                      <span className="text-text-light font-normal">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      rows={3}
                      value={flyerDescription}
                      onChange={(e) => setFlyerDescription(e.target.value)}
                      placeholder="A brief description of the sermon topic..."
                      className={`${inputClass} resize-y`}
                    />
                  </div>
                </div>
                <div className="mt-5 flex justify-end">
                  <button
                    onClick={handleGenerateFlyer}
                    disabled={
                      isGeneratingFlyer ||
                      !flyerTitle.trim() ||
                      !flyerScripture.trim()
                    }
                    className="bg-water text-white font-semibold px-8 py-3 rounded-lg hover:bg-water-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isGeneratingFlyer ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
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
                        Generating...
                      </>
                    ) : (
                      "Generate Flyer"
                    )}
                  </button>
                </div>
              </div>

              {/* Template Selector + Preview */}
              {flyerData && (
                <div className="space-y-4">
                  {/* Template Buttons */}
                  <div className={cardClass}>
                    <p className="text-sm font-semibold text-deep mb-3">
                      Choose a Template
                    </p>
                    <div className="flex gap-3">
                      {([1, 2, 3] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setFlyerTemplate(t)}
                          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border transition-colors ${
                            flyerTemplate === t
                              ? "bg-water text-white border-water"
                              : "bg-white text-text-body border-border-light hover:border-water hover:text-water"
                          }`}
                        >
                          {t === 1
                            ? "Living Water"
                            : t === 2
                              ? "Clean Light"
                              : "Bold Sky"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className={cardClass}>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-semibold text-deep">
                        Flyer Preview
                      </p>
                      <p className="text-xs text-text-light">
                        Screenshot the flyer below to share on social media
                      </p>
                    </div>
                    <div
                      ref={flyerRef}
                      className="flex justify-center overflow-x-auto"
                    >
                      <FlyerTemplate
                        data={flyerData}
                        template={flyerTemplate}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              TAB 5: PRAYERS
              ═════════════════════════════════════════════════════════════════ */}
          {activeTab === "prayers" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className={sectionHeadingClass}>Prayer Requests</h2>
                  <p className={sectionDescClass}>
                    {prayers.length} prayer request
                    {prayers.length !== 1 ? "s" : ""} from the community.
                  </p>
                </div>
              </div>

              {prayers.length > 0 ? (
                <div className="space-y-3">
                  {prayers.map((prayer) => (
                    <div key={prayer.id} className={cardClass}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold text-deep text-sm">
                              {prayer.name}
                            </p>
                            {prayer.isAnonymous && (
                              <span className="text-xs bg-sky text-water px-2 py-0.5 rounded-full">
                                Anonymous
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-text-body leading-relaxed">
                            {prayer.request}
                          </p>
                          <div className="flex items-center gap-4 mt-3">
                            <span className="text-xs text-text-light">
                              {formatTimestamp(prayer.createdAt)}
                            </span>
                            <span className="text-xs text-water font-medium">
                              {prayer.prayerCount} prayer
                              {prayer.prayerCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePrayer(prayer.id)}
                          disabled={isDeletingPrayer === prayer.id}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg shrink-0 disabled:opacity-50"
                          title="Delete prayer request"
                        >
                          {isDeletingPrayer === prayer.id ? (
                            <svg
                              className="animate-spin h-4 w-4"
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
                          ) : (
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
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`${cardClass} text-center py-12`}>
                  <p className="text-text-light text-sm">
                    No prayer requests yet.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              TAB 6: TESTIMONIES
              ═════════════════════════════════════════════════════════════════ */}
          {activeTab === "testimonies" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className={sectionHeadingClass}>Testimonies</h2>
                <p className={sectionDescClass}>
                  {testimonies.length} testimon
                  {testimonies.length !== 1 ? "ies" : "y"} total.{" "}
                  {testimonies.filter((t) => !t.approved).length} awaiting
                  approval.
                </p>
              </div>

              {testimonies.length > 0 ? (
                <div className="space-y-3">
                  {testimonies.map((testimony) => (
                    <div
                      key={testimony.id}
                      className={`${cardClass} ${
                        !testimony.approved
                          ? "border-l-4 border-l-amber-400"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <p className="font-semibold text-deep text-sm">
                              {testimony.name}
                            </p>
                            {!testimony.approved ? (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                Pending Approval
                              </span>
                            ) : (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                                Approved
                              </span>
                            )}
                            {testimony.isAnonymous && (
                              <span className="text-xs bg-sky text-water px-2 py-0.5 rounded-full">
                                Anonymous
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-text-body leading-relaxed">
                            {testimony.text}
                          </p>
                          <div className="flex items-center gap-4 mt-3">
                            <span className="text-xs text-text-light">
                              {formatTimestamp(testimony.createdAt)}
                            </span>
                            <span className="text-xs text-water font-medium">
                              {testimony.blessedCount} blessed
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {!testimony.approved && (
                            <button
                              onClick={() =>
                                handleApproveTestimony(testimony.id)
                              }
                              disabled={
                                isApprovingTestimony === testimony.id
                              }
                              className="text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 p-2 rounded-lg disabled:opacity-50"
                              title="Approve testimony"
                            >
                              {isApprovingTestimony === testimony.id ? (
                                <svg
                                  className="animate-spin h-4 w-4"
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
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleDeleteTestimony(testimony.id)
                            }
                            disabled={isDeletingTestimony === testimony.id}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg disabled:opacity-50"
                            title="Delete testimony"
                          >
                            {isDeletingTestimony === testimony.id ? (
                              <svg
                                className="animate-spin h-4 w-4"
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
                            ) : (
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
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`${cardClass} text-center py-12`}>
                  <p className="text-text-light text-sm">
                    No testimonies yet.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════
              TAB 7: SETTINGS
              ═════════════════════════════════════════════════════════════════ */}
          {activeTab === "settings" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className={sectionHeadingClass}>Settings</h2>
                <p className={sectionDescClass}>
                  Ministry contact info, social links, and service schedule.
                </p>
              </div>

              {/* Contact Info */}
              <div className={cardClass}>
                <p className="text-sm font-semibold text-deep mb-4">
                  Contact Information
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Ministry Email</label>
                    <input
                      type="email"
                      value={settingsEmail}
                      onChange={(e) => setSettingsEmail(e.target.value)}
                      placeholder="pastor@lifeministry.org"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Phone Number</label>
                    <input
                      type="tel"
                      value={settingsPhone}
                      onChange={(e) => setSettingsPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className={cardClass}>
                <p className="text-sm font-semibold text-deep mb-4">
                  Social Media Links
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>TikTok URL</label>
                    <input
                      type="url"
                      value={settingsTiktok}
                      onChange={(e) => setSettingsTiktok(e.target.value)}
                      placeholder="https://tiktok.com/@..."
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Instagram URL</label>
                    <input
                      type="url"
                      value={settingsInstagram}
                      onChange={(e) => setSettingsInstagram(e.target.value)}
                      placeholder="https://instagram.com/..."
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>YouTube URL</label>
                    <input
                      type="url"
                      value={settingsYoutube}
                      onChange={(e) => setSettingsYoutube(e.target.value)}
                      placeholder="https://youtube.com/@..."
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Facebook URL</label>
                    <input
                      type="url"
                      value={settingsFacebook}
                      onChange={(e) => setSettingsFacebook(e.target.value)}
                      placeholder="https://facebook.com/..."
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Service Schedule */}
              <div className={cardClass}>
                <p className="text-sm font-semibold text-deep mb-4">
                  Service Schedule
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className={labelClass}>Day of Week</label>
                    <select
                      value={settingsDay}
                      onChange={(e) => setSettingsDay(Number(e.target.value))}
                      className={inputClass}
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
                      className={inputClass}
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
                      className={inputClass}
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
                      className={inputClass}
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
              </div>

              {/* Save Settings */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="bg-water text-white font-semibold px-8 py-3 rounded-lg hover:bg-water-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSavingSettings ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
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
                      Saving...
                    </>
                  ) : (
                    "Save Settings"
                  )}
                </button>
              </div>

              {/* Last Updated */}
              {content?.lastUpdated && (
                <p className="text-xs text-text-light text-center">
                  Last updated: {formatTimestamp(content.lastUpdated)}
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
