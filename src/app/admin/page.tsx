"use client";

import { useState, useEffect, useCallback } from "react";

interface WeeklyMessage {
  title: string;
  scripture: string;
  description: string;
}

interface SocialLinks {
  tiktok: string;
  instagram: string;
}

interface TikTokVideo {
  id: string;
  url: string;
  title: string;
}

interface SiteContent {
  weeklyMessage: WeeklyMessage;
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
  socialLinks: SocialLinks;
  tiktokVideos: TikTokVideo[];
  lastUpdated: string;
}

interface Prayer {
  id: string;
  name: string;
  request: string;
  prayerCount: number;
  createdAt: string;
  isAnonymous: boolean;
}

interface Subscriber {
  id: string;
  name: string;
  contactType: "email" | "phone";
  contact: string;
  timestamp: string;
}

interface Insight {
  id: string;
  topic: string;
  scripture: string;
  timestamp: string;
}

type Tab = "message" | "live" | "social" | "prayers" | "subscribers" | "insights";

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<Tab>("message");
  const [content, setContent] = useState<SiteContent | null>(null);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Form states
  const [messageTitle, setMessageTitle] = useState("");
  const [messageScripture, setMessageScripture] = useState("");
  const [messageDescription, setMessageDescription] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

  // TikTok video management
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [videoUrlError, setVideoUrlError] = useState("");

  // Prayer management
  const [showPrayerModal, setShowPrayerModal] = useState(false);
  const [editingPrayer, setEditingPrayer] = useState<Prayer | null>(null);
  const [prayerName, setPrayerName] = useState("");
  const [prayerRequest, setPrayerRequest] = useState("");
  const [prayerCount, setPrayerCount] = useState(0);
  const [prayerIsAnonymous, setPrayerIsAnonymous] = useState(false);
  const [prayerDate, setPrayerDate] = useState("");

  // Settings states
  const [roomNameInput, setRoomNameInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("admin_token");
    if (savedToken) {
      verifyToken(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (t: string) => {
    try {
      const res = await fetch("/api/auth", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        setToken(t);
        loadData(t);
      } else {
        localStorage.removeItem("admin_token");
      }
    } catch {
      localStorage.removeItem("admin_token");
    }
    setIsLoading(false);
  };

  const loadData = useCallback(async (t: string) => {
    try {
      // Load content
      const contentRes = await fetch("/api/content");
      if (contentRes.ok) {
        const contentData = await contentRes.json();
        setContent(contentData);
        setMessageTitle(contentData.weeklyMessage.title);
        setMessageScripture(contentData.weeklyMessage.scripture);
        setMessageDescription(contentData.weeklyMessage.description);
        setTiktokUrl(contentData.socialLinks.tiktok);
        setInstagramUrl(contentData.socialLinks.instagram);
        setRoomNameInput(contentData.roomName || "LIFEMinistryService");
      }

      // Load prayers
      const prayersRes = await fetch("/api/prayers");
      if (prayersRes.ok) {
        const prayersData = await prayersRes.json();
        setPrayers(prayersData.prayers);
      }

      // Load subscribers
      const subscribersRes = await fetch("/api/subscribers", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (subscribersRes.ok) {
        const subscribersData = await subscribersRes.json();
        setSubscribers(subscribersData.subscribers);
      }

      // Load insights
      const insightsRes = await fetch("/api/insights", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        setInsights(insightsData.insights);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadData(token);
    }
  }, [token, loadData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

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
        setLoginError(data.error || "Login failed");
      }
    } catch {
      setLoginError("Connection error. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
    setContent(null);
  };

  const saveContent = async (updates: Partial<SiteContent>) => {
    if (!token) return;

    setSaveStatus("saving");
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const updated = await res.json();
        setContent(updated);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  };

  // Service control functions
  const toggleLobby = async () => {
    if (!content) return;
    await saveContent({ lobbyOpen: !content.lobbyOpen });
  };

  const startService = async () => {
    if (!content) return;
    // Log notification (MVP)
    console.log(`Service starting! Would notify ${subscribers.length} subscribers`);
    subscribers.forEach(sub => {
      console.log(`  - Would notify ${sub.contact} (${sub.contactType})`);
    });
    await saveContent({ serviceLive: true });
  };

  const endService = async () => {
    if (!content) return;
    await saveContent({ lobbyOpen: false, serviceLive: false });
  };

  const toggleTestMode = async () => {
    if (!content) return;
    await saveContent({ testMode: !content.testMode });
  };

  const saveRoomName = async () => {
    if (!roomNameInput.trim()) return;
    await saveContent({ roomName: roomNameInput.trim() });
  };

  const saveMessage = async () => {
    await saveContent({
      weeklyMessage: {
        title: messageTitle,
        scripture: messageScripture,
        description: messageDescription,
      },
    });
  };

  const saveSocialLinks = async () => {
    await saveContent({
      socialLinks: {
        tiktok: tiktokUrl,
        instagram: instagramUrl,
      },
    });
  };

  const validateTikTokUrl = (url: string): string | null => {
    if (!url.includes("tiktok.com") || !url.includes("/video/")) {
      return "Please enter a valid TikTok video URL (e.g., https://www.tiktok.com/@user/video/123456789)";
    }
    const match = url.match(/\/video\/(\d+)/);
    if (!match) {
      return "Could not extract video ID from URL";
    }
    return null;
  };

  const addTikTokVideo = async () => {
    const error = validateTikTokUrl(newVideoUrl);
    if (error) {
      setVideoUrlError(error);
      return;
    }

    setVideoUrlError("");
    const newVideo: TikTokVideo = {
      id: Date.now().toString(),
      url: newVideoUrl.trim(),
      title: newVideoTitle.trim(),
    };

    const updatedVideos = [...(content?.tiktokVideos || []), newVideo];
    await saveContent({ tiktokVideos: updatedVideos });
    setNewVideoUrl("");
    setNewVideoTitle("");
  };

  const deleteTikTokVideo = async (id: string) => {
    if (!confirm("Remove this video?")) return;
    const updatedVideos = (content?.tiktokVideos || []).filter((v) => v.id !== id);
    await saveContent({ tiktokVideos: updatedVideos });
  };

  const moveTikTokVideo = async (id: string, direction: "up" | "down") => {
    const videos = [...(content?.tiktokVideos || [])];
    const index = videos.findIndex((v) => v.id === id);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= videos.length) return;

    [videos[index], videos[newIndex]] = [videos[newIndex], videos[index]];
    await saveContent({ tiktokVideos: videos });
  };

  const deletePrayer = async (id: string) => {
    if (!token) return;
    if (!confirm("Delete this prayer request?")) return;

    try {
      const res = await fetch(`/api/prayers?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setPrayers(prayers.filter((p) => p.id !== id));
      }
    } catch (error) {
      console.error("Error deleting prayer:", error);
    }
  };

  const openPrayerModal = (prayer?: Prayer) => {
    if (prayer) {
      setEditingPrayer(prayer);
      setPrayerName(prayer.isAnonymous ? "" : prayer.name);
      setPrayerRequest(prayer.request);
      setPrayerCount(prayer.prayerCount);
      setPrayerIsAnonymous(prayer.isAnonymous);
      setPrayerDate(prayer.createdAt.split("T")[0]);
    } else {
      setEditingPrayer(null);
      setPrayerName("");
      setPrayerRequest("");
      setPrayerCount(0);
      setPrayerIsAnonymous(false);
      setPrayerDate(new Date().toISOString().split("T")[0]);
    }
    setShowPrayerModal(true);
  };

  const closePrayerModal = () => {
    setShowPrayerModal(false);
    setEditingPrayer(null);
  };

  const savePrayer = async () => {
    if (!token || !prayerRequest.trim()) return;

    setSaveStatus("saving");
    try {
      if (editingPrayer) {
        // Update existing prayer
        const res = await fetch("/api/prayers", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: editingPrayer.id,
            name: prayerIsAnonymous ? "Anonymous" : (prayerName || "Anonymous"),
            request: prayerRequest.trim(),
            prayerCount,
            isAnonymous: prayerIsAnonymous,
            createdAt: new Date(prayerDate).toISOString(),
          }),
        });

        if (res.ok) {
          const updated = await res.json();
          setPrayers(prayers.map((p) => (p.id === updated.id ? updated : p)));
          setSaveStatus("saved");
          closePrayerModal();
        } else {
          setSaveStatus("error");
        }
      } else {
        // Create new prayer
        const res = await fetch("/api/prayers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: prayerIsAnonymous ? "Anonymous" : (prayerName || "Anonymous"),
            request: prayerRequest.trim(),
            isAnonymous: prayerIsAnonymous,
          }),
        });

        if (res.ok) {
          const newPrayer = await res.json();
          // If a custom prayer count was set, update it
          if (prayerCount > 0) {
            const updateRes = await fetch("/api/prayers", {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                id: newPrayer.id,
                prayerCount,
                createdAt: new Date(prayerDate).toISOString(),
              }),
            });
            if (updateRes.ok) {
              const updated = await updateRes.json();
              setPrayers([updated, ...prayers]);
            } else {
              setPrayers([newPrayer, ...prayers]);
            }
          } else {
            setPrayers([newPrayer, ...prayers]);
          }
          setSaveStatus("saved");
          closePrayerModal();
        } else {
          setSaveStatus("error");
        }
      }
    } catch (error) {
      console.error("Error saving prayer:", error);
      setSaveStatus("error");
    }
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const deleteSubscriber = async (id: string) => {
    if (!token) return;
    if (!confirm("Remove this subscriber?")) return;

    try {
      const res = await fetch(`/api/subscribers?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setSubscribers(subscribers.filter((s) => s.id !== id));
      }
    } catch (error) {
      console.error("Error deleting subscriber:", error);
    }
  };

  const deleteInsightItem = async (id: string) => {
    if (!token) return;
    if (!confirm("Delete this insight?")) return;

    try {
      const res = await fetch(`/api/insights?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setInsights(insights.filter((i) => i.id !== id));
      }
    } catch (error) {
      console.error("Error deleting insight:", error);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Get status string for the header
  const getStatusString = () => {
    if (!content) return "Loading...";
    if (content.serviceLive) return "Service Live";
    if (content.lobbyOpen || content.testMode) return "Lobby Open";
    return "Off Air";
  };

  const getStatusColor = () => {
    if (!content) return "bg-charcoal/50";
    if (content.serviceLive) return "bg-red-500";
    if (content.lobbyOpen || content.testMode) return "bg-amber-500";
    return "bg-charcoal/30";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-terracotta/20 border-t-terracotta rounded-full animate-spin mx-auto mb-4" />
          <p className="text-charcoal-light">Loading...</p>
        </div>
      </div>
    );
  }

  // Login Screen
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-terracotta flex items-center justify-center">
                <span className="text-white font-display text-3xl font-bold">L</span>
              </div>
              <h1 className="text-3xl font-display font-semibold text-charcoal">
                Admin Login
              </h1>
              <p className="text-charcoal-light mt-2">
                L.I.F.E. Ministry Dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label
                  htmlFor="password"
                  className="block text-lg font-medium text-charcoal mb-3"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 text-xl rounded-xl border-2 border-warm-gray-light focus:border-terracotta focus:ring-4 focus:ring-terracotta/20 outline-none transition-colors bg-cream"
                  placeholder="Enter password..."
                  autoFocus
                />
              </div>

              {loginError && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-center font-medium">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-terracotta text-white text-xl font-semibold py-5 rounded-xl hover:bg-terracotta-dark transition-colors shadow-lg"
              >
                Log In
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-forest text-white py-4 px-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-terracotta flex items-center justify-center">
              <span className="text-white font-display font-bold">L</span>
            </div>
            <span className="font-display text-xl font-semibold">Admin</span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Save Status */}
      {saveStatus !== "idle" && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium ${
          saveStatus === "saving" ? "bg-yellow-100 text-yellow-800" :
          saveStatus === "saved" ? "bg-green-100 text-green-800" :
          "bg-red-100 text-red-800"
        }`}>
          {saveStatus === "saving" && "Saving..."}
          {saveStatus === "saved" && "Saved!"}
          {saveStatus === "error" && "Error saving"}
        </div>
      )}

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-warm-gray-light/30 sticky top-[72px] z-40">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 -mx-4 px-4">
            {[
              { id: "message" as Tab, label: "Message", icon: "📖" },
              { id: "live" as Tab, label: "Service", icon: "🎬" },
              { id: "social" as Tab, label: "Social", icon: "📱" },
              { id: "prayers" as Tab, label: "Prayers", icon: "🙏" },
              { id: "subscribers" as Tab, label: "Reminders", icon: "📧" },
              { id: "insights" as Tab, label: "Insights", icon: "💭" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-5 py-3 rounded-xl text-base font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-terracotta text-white"
                    : "bg-cream text-charcoal hover:bg-cream-dark"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Message Tab */}
        {activeTab === "message" && (
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
            <h2 className="text-2xl font-display font-semibold text-charcoal mb-6">
              This Week&apos;s Message
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-lg font-medium text-charcoal mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  className="w-full px-4 py-4 text-lg rounded-xl border-2 border-warm-gray-light focus:border-terracotta focus:ring-4 focus:ring-terracotta/20 outline-none"
                  placeholder="Enter message title..."
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-charcoal mb-2">
                  Scripture Reference
                </label>
                <input
                  type="text"
                  value={messageScripture}
                  onChange={(e) => setMessageScripture(e.target.value)}
                  className="w-full px-4 py-4 text-lg rounded-xl border-2 border-warm-gray-light focus:border-terracotta focus:ring-4 focus:ring-terracotta/20 outline-none"
                  placeholder="e.g., Matthew 11:28-30"
                />
              </div>

              <div>
                <label className="block text-lg font-medium text-charcoal mb-2">
                  Description
                </label>
                <textarea
                  value={messageDescription}
                  onChange={(e) => setMessageDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-4 text-lg rounded-xl border-2 border-warm-gray-light focus:border-terracotta focus:ring-4 focus:ring-terracotta/20 outline-none resize-none"
                  placeholder="Write a brief description..."
                />
              </div>

              <button
                onClick={saveMessage}
                className="w-full bg-terracotta text-white text-xl font-semibold py-5 rounded-xl hover:bg-terracotta-dark transition-colors"
              >
                Save Message
              </button>
            </div>

            {/* Preview */}
            <div className="mt-8 pt-8 border-t border-warm-gray-light/50">
              <h3 className="text-lg font-medium text-charcoal-light mb-4">Preview:</h3>
              <div className="bg-cream-dark rounded-xl p-6">
                <p className="text-terracotta text-sm font-medium uppercase tracking-wider mb-2">
                  This Week&apos;s Message
                </p>
                <h4 className="font-display text-2xl font-semibold text-charcoal mb-3">
                  {messageTitle || "Message Title"}
                </h4>
                <p className="text-charcoal-light mb-2">
                  {messageDescription || "Message description will appear here..."}
                </p>
                <span className="inline-block bg-white px-3 py-1 rounded-full text-sm text-charcoal-light">
                  {messageScripture || "Scripture Reference"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Service Control Center Tab */}
        {activeTab === "live" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-display font-semibold text-charcoal mb-2">
                Service Control Center
              </h2>
              <p className="text-charcoal-light">
                Manage your Sunday service in 4 steps
              </p>
            </div>

            {/* Status Summary Box */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-4 h-4 rounded-full ${getStatusColor()} ${content?.serviceLive ? "animate-pulse" : ""}`} />
                  <div>
                    <p className="font-semibold text-charcoal text-lg">{getStatusString()}</p>
                    <p className="text-charcoal-light text-sm">
                      Lobby: {content?.lobbyOpen ? "Open" : "Closed"} ·
                      Service: {content?.serviceLive ? "Live" : "Off"}
                      {content?.testMode && " · Test Mode ON"}
                    </p>
                  </div>
                </div>
                {content?.serviceLive && (
                  <span className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-medium">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                    LIVE NOW
                  </span>
                )}
              </div>
            </div>

            {/* Step 1: Open Lobby */}
            <div className={`bg-white rounded-2xl shadow-sm p-6 md:p-8 ${content?.lobbyOpen ? "ring-2 ring-forest/20" : ""}`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 ${
                  content?.lobbyOpen ? "bg-forest text-white" : "bg-charcoal/10 text-charcoal/60"
                }`}>
                  {content?.lobbyOpen ? "✓" : "1"}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-display font-semibold text-charcoal mb-1">
                    Open the Lobby
                  </h3>
                  <p className="text-charcoal-light text-sm mb-6">
                    Let people enter the waiting room while you prepare
                  </p>

                  <div className="flex items-center justify-between p-4 bg-cream rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${content?.lobbyOpen ? "bg-forest" : "bg-charcoal/30"}`} />
                      <span className="font-medium text-charcoal">
                        {content?.lobbyOpen ? "✓ People can now enter the waiting room" : "Lobby is closed"}
                      </span>
                    </div>
                    <button
                      onClick={toggleLobby}
                      disabled={content?.serviceLive}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        content?.lobbyOpen ? "bg-forest" : "bg-charcoal/20"
                      } ${content?.serviceLive ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${
                          content?.lobbyOpen ? "translate-x-7" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Join as Host */}
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-charcoal/10 rounded-full flex items-center justify-center text-xl font-bold text-charcoal/60 flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-display font-semibold text-charcoal mb-1">
                    You Join First
                  </h3>
                  <p className="text-charcoal-light text-sm mb-6">
                    Enter the Jitsi room before your congregation
                  </p>

                  <a
                    href={`https://meet.jit.si/${content?.roomName || "LIFEMinistryService"}#userInfo.displayName="Pastor Mike"`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-forest text-white text-lg font-semibold py-4 rounded-xl hover:bg-forest-dark transition-colors"
                  >
                    Enter as Pastor Mike →
                  </a>
                  <p className="text-charcoal-light text-sm mt-3 text-center">
                    Opens in a new tab. Get your camera and mic ready.
                  </p>

                  {!content?.lobbyOpen && !content?.testMode && (
                    <p className="text-amber-600 text-sm mt-4 text-center bg-amber-50 p-3 rounded-lg">
                      💡 Tip: Open the lobby (Step 1) before joining so people can wait for you
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: Start Service */}
            <div className={`bg-white rounded-2xl shadow-sm p-6 md:p-8 ${content?.serviceLive ? "ring-2 ring-red-200" : ""}`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 ${
                  content?.serviceLive ? "bg-red-500 text-white" : "bg-charcoal/10 text-charcoal/60"
                }`}>
                  {content?.serviceLive ? "✓" : "3"}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-display font-semibold text-charcoal mb-1">
                    Start the Service
                  </h3>
                  <p className="text-charcoal-light text-sm mb-6">
                    Everyone in the waiting room will automatically join
                  </p>

                  {content?.serviceLive ? (
                    <div className="text-center py-4">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <span className="relative flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500" />
                        </span>
                        <span className="text-2xl font-bold text-red-600">Service is Live</span>
                      </div>
                      <p className="text-charcoal-light text-sm">
                        Visitors are now in the Jitsi room with you
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={startService}
                      disabled={!content?.lobbyOpen && !content?.testMode}
                      className={`w-full text-xl font-bold py-5 rounded-xl transition-colors ${
                        content?.lobbyOpen || content?.testMode
                          ? "bg-forest text-white hover:bg-forest-dark"
                          : "bg-charcoal/10 text-charcoal/40 cursor-not-allowed"
                      }`}
                    >
                      Start Service
                    </button>
                  )}

                  {!content?.lobbyOpen && !content?.testMode && !content?.serviceLive && (
                    <p className="text-charcoal-light text-sm mt-4 text-center">
                      Open the lobby first before starting the service
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Step 4: End Service */}
            {content?.serviceLive && (
              <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-charcoal/10 rounded-full flex items-center justify-center text-xl font-bold text-charcoal/60 flex-shrink-0">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-display font-semibold text-charcoal mb-1">
                      End the Service
                    </h3>
                    <p className="text-charcoal-light text-sm mb-6">
                      Close the room and reset for next week
                    </p>

                    <button
                      onClick={endService}
                      className="w-full bg-charcoal/10 text-charcoal text-lg font-semibold py-4 rounded-xl hover:bg-charcoal/20 transition-colors"
                    >
                      End Service
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Section */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-cream/50 transition-colors"
              >
                <span className="font-medium text-charcoal flex items-center gap-2">
                  ⚙️ Settings
                </span>
                <svg
                  className={`w-5 h-5 text-charcoal/50 transition-transform ${showSettings ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showSettings && (
                <div className="px-6 pb-6 space-y-6 border-t border-charcoal/5 pt-6">
                  {/* Room Name */}
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      Jitsi Room Name
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={roomNameInput}
                        onChange={(e) => setRoomNameInput(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl border-2 border-warm-gray-light focus:border-terracotta focus:ring-4 focus:ring-terracotta/20 outline-none"
                        placeholder="LIFEMinistryService"
                      />
                      <button
                        onClick={saveRoomName}
                        className="px-6 py-3 bg-terracotta text-white font-medium rounded-xl hover:bg-terracotta-dark transition-colors"
                      >
                        Save
                      </button>
                    </div>
                    <p className="text-charcoal-light text-xs mt-2">
                      The room URL will be: https://meet.jit.si/{roomNameInput || "LIFEMinistryService"}
                    </p>
                  </div>

                  {/* Test Mode */}
                  <div className="flex items-center justify-between p-4 bg-cream rounded-xl">
                    <div>
                      <p className="font-medium text-charcoal">Test Mode</p>
                      <p className="text-charcoal-light text-sm">
                        Lets you test the waiting room without opening the real lobby
                      </p>
                    </div>
                    <button
                      onClick={toggleTestMode}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        content?.testMode ? "bg-amber-500" : "bg-charcoal/20"
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform ${
                          content?.testMode ? "translate-x-7" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {content?.testMode && (
                    <p className="text-amber-600 text-sm bg-amber-50 p-3 rounded-lg">
                      ⚠️ Test Mode is ON - The Watch page will show the waiting room UI even though the lobby is closed
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Social Tab */}
        {activeTab === "social" && (
          <div className="space-y-6">
            {/* TikTok Content Section */}
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-display font-semibold text-charcoal">
                  TikTok Content
                </h2>
                <p className="text-charcoal-light mt-1">
                  Add links to feature on the homepage
                </p>
              </div>

              {/* Current Videos List */}
              {(content?.tiktokVideos?.length || 0) > 0 ? (
                <div className="space-y-3 mb-8">
                  {content?.tiktokVideos.map((video, index) => (
                    <div
                      key={video.id}
                      className="bg-cream rounded-xl p-4 flex items-center gap-4"
                    >
                      {/* Reorder buttons */}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveTikTokVideo(video.id, "up")}
                          disabled={index === 0}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            index === 0
                              ? "text-charcoal/20 cursor-not-allowed"
                              : "text-charcoal/50 hover:bg-white hover:text-charcoal"
                          }`}
                          title="Move up"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveTikTokVideo(video.id, "down")}
                          disabled={index === (content?.tiktokVideos?.length || 0) - 1}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            index === (content?.tiktokVideos?.length || 0) - 1
                              ? "text-charcoal/20 cursor-not-allowed"
                              : "text-charcoal/50 hover:bg-white hover:text-charcoal"
                          }`}
                          title="Move down"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Video info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-charcoal truncate">
                          {video.title || "Untitled video"}
                        </p>
                        <p className="text-sm text-charcoal-light truncate">
                          {video.url}
                        </p>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => deleteTikTokVideo(video.id)}
                        className="flex-shrink-0 w-10 h-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition-colors"
                        title="Remove"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-cream rounded-xl p-8 text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-charcoal/5 flex items-center justify-center">
                    <svg className="w-8 h-8 text-charcoal/30" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                    </svg>
                  </div>
                  <p className="text-charcoal-light">No videos added yet</p>
                  <p className="text-sm text-charcoal-light/70 mt-1">
                    Add TikTok videos to display on the homepage
                  </p>
                </div>
              )}

              {/* Add New Video Form */}
              <div className="border-t border-charcoal/10 pt-6">
                <h3 className="font-medium text-charcoal mb-4">Add New Video</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      TikTok Video URL
                    </label>
                    <input
                      type="url"
                      value={newVideoUrl}
                      onChange={(e) => {
                        setNewVideoUrl(e.target.value);
                        setVideoUrlError("");
                      }}
                      className={`w-full px-4 py-3 rounded-xl border-2 ${
                        videoUrlError
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-warm-gray-light focus:border-terracotta focus:ring-terracotta/20"
                      } focus:ring-4 outline-none`}
                      placeholder="https://www.tiktok.com/@pastormike/video/123456789"
                    />
                    {videoUrlError && (
                      <p className="text-red-500 text-sm mt-2">{videoUrlError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      Caption (optional)
                    </label>
                    <input
                      type="text"
                      value={newVideoTitle}
                      onChange={(e) => setNewVideoTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-warm-gray-light focus:border-terracotta focus:ring-4 focus:ring-terracotta/20 outline-none"
                      placeholder="e.g., Finding peace in chaos"
                    />
                  </div>

                  <button
                    onClick={addTikTokVideo}
                    disabled={!newVideoUrl.trim()}
                    className={`w-full py-4 rounded-xl font-semibold transition-colors ${
                      newVideoUrl.trim()
                        ? "bg-terracotta text-white hover:bg-terracotta-dark"
                        : "bg-charcoal/10 text-charcoal/40 cursor-not-allowed"
                    }`}
                  >
                    Add Video
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Links Section */}
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-display font-semibold text-charcoal">
                  Profile Links
                </h2>
                <p className="text-charcoal-light mt-1">
                  Links to your social media profiles
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    TikTok Profile URL
                  </label>
                  <input
                    type="url"
                    value={tiktokUrl}
                    onChange={(e) => setTiktokUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-warm-gray-light focus:border-terracotta focus:ring-4 focus:ring-terracotta/20 outline-none"
                    placeholder="https://tiktok.com/@yourusername"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Instagram Profile URL
                  </label>
                  <input
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-warm-gray-light focus:border-terracotta focus:ring-4 focus:ring-terracotta/20 outline-none"
                    placeholder="https://instagram.com/yourusername"
                  />
                </div>

                <button
                  onClick={saveSocialLinks}
                  className="w-full bg-terracotta text-white font-semibold py-4 rounded-xl hover:bg-terracotta-dark transition-colors"
                >
                  Save Profile Links
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Prayers Tab */}
        {activeTab === "prayers" && (
          <>
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-display font-semibold text-charcoal">
                    Manage Prayer Requests
                  </h2>
                  <p className="text-charcoal-light mt-1">
                    {prayers.length} {prayers.length === 1 ? "request" : "requests"} total
                  </p>
                </div>
                <button
                  onClick={() => openPrayerModal()}
                  className="bg-terracotta text-white px-5 py-3 rounded-xl font-medium hover:bg-terracotta-dark transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Prayer
                </button>
              </div>

              {prayers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cream flex items-center justify-center">
                    <svg className="w-8 h-8 text-charcoal/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <p className="text-charcoal-light text-lg">No prayer requests yet.</p>
                  <p className="text-sm text-charcoal-light/70 mt-1">
                    Add sample prayers or wait for congregation submissions.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {prayers.map((prayer) => (
                    <div
                      key={prayer.id}
                      className="bg-cream rounded-xl p-5"
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-terracotta/10 flex items-center justify-center flex-shrink-0">
                          <span className="font-display font-semibold text-terracotta text-lg">
                            {prayer.isAnonymous ? "?" : prayer.name.charAt(0)}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="font-semibold text-charcoal">
                              {prayer.isAnonymous ? "Anonymous" : prayer.name}
                            </span>
                            <span className="text-sm text-charcoal-light">
                              {formatDate(prayer.createdAt)}
                            </span>
                            <span className="bg-forest/10 text-forest text-sm font-medium px-2 py-0.5 rounded-full">
                              {prayer.prayerCount} praying
                            </span>
                          </div>
                          <p className="text-charcoal-light line-clamp-2">{prayer.request}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => openPrayerModal(prayer)}
                            className="w-11 h-11 bg-white hover:bg-terracotta/10 text-charcoal-light hover:text-terracotta rounded-lg flex items-center justify-center transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deletePrayer(prayer.id)}
                            className="w-11 h-11 bg-white hover:bg-red-100 text-charcoal-light hover:text-red-600 rounded-lg flex items-center justify-center transition-colors"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prayer Modal */}
            {showPrayerModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-display font-semibold text-charcoal">
                      {editingPrayer ? "Edit Prayer Request" : "Add Prayer Request"}
                    </h3>
                    <button
                      onClick={closePrayerModal}
                      className="text-charcoal-light hover:text-charcoal"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-5">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={prayerName}
                        onChange={(e) => setPrayerName(e.target.value)}
                        disabled={prayerIsAnonymous}
                        className="w-full px-4 py-3 rounded-xl border-2 border-warm-gray-light focus:border-terracotta focus:ring-4 focus:ring-terracotta/20 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter name..."
                      />
                    </div>

                    {/* Anonymous checkbox */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="prayerAnonymous"
                        checked={prayerIsAnonymous}
                        onChange={(e) => setPrayerIsAnonymous(e.target.checked)}
                        className="w-5 h-5 rounded border-warm-gray-light text-terracotta focus:ring-terracotta"
                      />
                      <label htmlFor="prayerAnonymous" className="text-charcoal-light">
                        Post anonymously
                      </label>
                    </div>

                    {/* Prayer request */}
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">
                        Prayer Request
                      </label>
                      <textarea
                        value={prayerRequest}
                        onChange={(e) => setPrayerRequest(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border-2 border-warm-gray-light focus:border-terracotta focus:ring-4 focus:ring-terracotta/20 outline-none resize-none"
                        placeholder="Enter prayer request..."
                        required
                      />
                    </div>

                    {/* Prayer count */}
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">
                        Prayer Count
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={prayerCount}
                        onChange={(e) => setPrayerCount(parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-warm-gray-light focus:border-terracotta focus:ring-4 focus:ring-terracotta/20 outline-none"
                      />
                    </div>

                    {/* Date */}
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        value={prayerDate}
                        onChange={(e) => setPrayerDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-warm-gray-light focus:border-terracotta focus:ring-4 focus:ring-terracotta/20 outline-none"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-2">
                      <button
                        onClick={closePrayerModal}
                        className="flex-1 px-4 py-4 rounded-xl font-medium text-charcoal bg-cream hover:bg-cream-dark transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={savePrayer}
                        disabled={!prayerRequest.trim()}
                        className={`flex-1 px-4 py-4 rounded-xl font-medium transition-colors ${
                          prayerRequest.trim()
                            ? "bg-terracotta text-white hover:bg-terracotta-dark"
                            : "bg-charcoal/10 text-charcoal/40 cursor-not-allowed"
                        }`}
                      >
                        {editingPrayer ? "Save Changes" : "Add Prayer"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Subscribers Tab */}
        {activeTab === "subscribers" && (
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-semibold text-charcoal">
                Reminder Subscribers
              </h2>
              <span className="bg-cream px-4 py-2 rounded-full text-charcoal-light font-medium">
                {subscribers.length} total
              </span>
            </div>

            {subscribers.length === 0 ? (
              <p className="text-center text-charcoal-light py-12 text-lg">
                No subscribers yet.
              </p>
            ) : (
              <div className="space-y-4">
                {subscribers.map((subscriber) => (
                  <div
                    key={subscriber.id}
                    className="bg-cream rounded-xl p-5 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-terracotta/10 rounded-full flex items-center justify-center text-xl">
                      {subscriber.contactType === "email" ? "📧" : "📱"}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-charcoal">
                        {subscriber.name}
                      </p>
                      <p className="text-charcoal-light">
                        {subscriber.contact}
                      </p>
                    </div>
                    <span className="text-sm text-charcoal-light">
                      {formatDate(subscriber.timestamp)}
                    </span>
                    <button
                      onClick={() => deleteSubscriber(subscriber.id)}
                      className="flex-shrink-0 w-12 h-12 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl flex items-center justify-center text-xl transition-colors"
                      title="Remove"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Congregation Insights Tab */}
        {activeTab === "insights" && (
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-display font-semibold text-charcoal">
                  Congregation Insights
                </h2>
                <p className="text-charcoal-light mt-1">
                  Anonymous topics shared from &quot;Ask The Word&quot; conversations
                </p>
              </div>
              <span className="bg-cream px-4 py-2 rounded-full text-charcoal-light font-medium">
                {insights.length} shared
              </span>
            </div>

            {/* Trending Topics */}
            {insights.length > 0 && (
              <div className="mb-8 p-4 bg-forest/5 rounded-xl border border-forest/10">
                <h3 className="text-sm font-semibold text-forest mb-3 uppercase tracking-wider">
                  Trending Themes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const words: Record<string, number> = {};
                    const commonWords = ["i", "the", "a", "an", "is", "are", "was", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "must", "shall", "can", "need", "dare", "ought", "used", "to", "of", "in", "for", "on", "with", "at", "by", "from", "about", "as", "into", "through", "during", "before", "after", "above", "below", "between", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "just", "and", "but", "if", "or", "because", "until", "while", "my", "me", "ve", "m", "it", "that", "this", "what", "which", "who", "whom", "these", "those", "am", "be", "feeling", "feel", "been", "really", "lot", "like", "going", "get", "much", "even", "also", "still"];

                    insights.forEach(insight => {
                      const topicWords = insight.topic.toLowerCase().split(/\W+/);
                      topicWords.forEach(word => {
                        if (word.length > 3 && !commonWords.includes(word)) {
                          words[word] = (words[word] || 0) + 1;
                        }
                      });
                    });

                    const trending = Object.entries(words)
                      .filter(([, count]) => count >= 2)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5);

                    if (trending.length === 0) {
                      return <span className="text-charcoal-light text-sm">Not enough data for trends yet</span>;
                    }

                    return trending.map(([word, count]) => (
                      <span key={word} className="bg-white px-3 py-1 rounded-full text-sm text-charcoal">
                        {word} <span className="text-forest font-medium">({count})</span>
                      </span>
                    ));
                  })()}
                </div>
              </div>
            )}

            {insights.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cream flex items-center justify-center text-3xl">
                  💭
                </div>
                <p className="text-charcoal-light text-lg mb-2">
                  No insights shared yet.
                </p>
                <p className="text-sm text-charcoal-light/70">
                  When people use &quot;Ask The Word&quot; and choose to share anonymously,
                  their conversation topics will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {insights.map((insight) => (
                  <div
                    key={insight.id}
                    className="bg-cream rounded-xl p-4 flex items-start gap-4"
                  >
                    <div className="w-10 h-10 bg-forest/10 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                      💬
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-charcoal leading-relaxed">
                        {insight.topic}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        {insight.scripture && (
                          <span className="text-sm text-forest font-medium">
                            📖 {insight.scripture}
                          </span>
                        )}
                        <span className="text-sm text-charcoal-light">
                          {formatDate(insight.timestamp)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteInsightItem(insight.id)}
                      className="flex-shrink-0 w-10 h-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center text-lg transition-colors"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
