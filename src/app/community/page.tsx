"use client";

import { useState, useEffect } from "react";
import { Heart, BookOpen, Send, User, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */
interface PrayerRequest {
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

/* ─────────────────────────────────────────────
   Time Formatter
   ───────────────────────────────────────────── */
function formatTimeAgo(dateString: string): string {
  if (!dateString) return "Recently";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Recently";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

/* ─────────────────────────────────────────────
   Community Page
   ───────────────────────────────────────────── */
export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<"prayers" | "testimonies">(
    "prayers"
  );

  // Prayer state
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [prayedIds, setPrayedIds] = useState<Set<string>>(new Set());
  const [loadingPrayers, setLoadingPrayers] = useState(true);
  const [prayerName, setPrayerName] = useState("");
  const [prayerRequest, setPrayerRequest] = useState("");
  const [prayerAnonymous, setPrayerAnonymous] = useState(false);
  const [prayerSubmitting, setPrayerSubmitting] = useState(false);
  const [prayerDialogOpen, setPrayerDialogOpen] = useState(false);
  const [prayerError, setPrayerError] = useState("");

  // Testimony state
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [blessedIds, setBlessedIds] = useState<Set<string>>(new Set());
  const [loadingTestimonies, setLoadingTestimonies] = useState(true);
  const [testimonyName, setTestimonyName] = useState("");
  const [testimonyText, setTestimonyText] = useState("");
  const [testimonyAnonymous, setTestimonyAnonymous] = useState(false);
  const [testimonySubmitting, setTestimonySubmitting] = useState(false);
  const [testimonyDialogOpen, setTestimonyDialogOpen] = useState(false);
  const [testimonyError, setTestimonyError] = useState("");

  // Success toast
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Load persisted IDs from localStorage
  useEffect(() => {
    const storedPrayed = localStorage.getItem("prayedIds");
    if (storedPrayed) {
      setPrayedIds(new Set(JSON.parse(storedPrayed)));
    }
    const storedBlessed = localStorage.getItem("blessedIds");
    if (storedBlessed) {
      setBlessedIds(new Set(JSON.parse(storedBlessed)));
    }
  }, []);

  // Fetch prayers
  useEffect(() => {
    async function fetchPrayers() {
      try {
        const res = await fetch("/api/prayers");
        if (res.ok) {
          const data = await res.json();
          setPrayers(data.prayers || []);
        }
      } catch (error) {
        console.error("Failed to fetch prayers:", error);
      }
      setLoadingPrayers(false);
    }
    fetchPrayers();
  }, []);

  // Fetch testimonies
  useEffect(() => {
    async function fetchTestimonies() {
      try {
        const res = await fetch("/api/testimonies");
        if (res.ok) {
          const data = await res.json();
          setTestimonies(data.testimonies || []);
        }
      } catch (error) {
        console.error("Failed to fetch testimonies:", error);
      }
      setLoadingTestimonies(false);
    }
    fetchTestimonies();
  }, []);

  // Submit prayer
  const handlePrayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerRequest.trim()) return;

    setPrayerSubmitting(true);
    setPrayerError("");

    try {
      const res = await fetch("/api/prayers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: prayerAnonymous ? "Anonymous" : prayerName || "Anonymous",
          request: prayerRequest.trim(),
          isAnonymous: prayerAnonymous,
        }),
      });

      if (res.ok) {
        const newPrayer = await res.json();
        setPrayers([newPrayer, ...prayers]);
        setPrayerName("");
        setPrayerRequest("");
        setPrayerAnonymous(false);
        setPrayerDialogOpen(false);
        setSuccessMessage("Prayer request submitted!");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        const data = await res.json();
        setPrayerError(data.error || "Failed to submit prayer request");
      }
    } catch {
      setPrayerError("Connection error. Please try again.");
    }

    setPrayerSubmitting(false);
  };

  // Submit testimony
  const handleTestimonySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonyText.trim()) return;

    setTestimonySubmitting(true);
    setTestimonyError("");

    try {
      const res = await fetch("/api/testimonies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: testimonyAnonymous
            ? "Anonymous"
            : testimonyName || "Anonymous",
          text: testimonyText.trim(),
          isAnonymous: testimonyAnonymous,
        }),
      });

      if (res.ok) {
        setTestimonyName("");
        setTestimonyText("");
        setTestimonyAnonymous(false);
        setTestimonyDialogOpen(false);
        setSuccessMessage("Testimony submitted! It will appear after review.");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        const data = await res.json();
        setTestimonyError(data.error || "Failed to submit testimony");
      }
    } catch {
      setTestimonyError("Connection error. Please try again.");
    }

    setTestimonySubmitting(false);
  };

  // Pray for someone
  const handlePray = async (id: string) => {
    if (prayedIds.has(id)) return;

    const newPrayedIds = new Set(prayedIds);
    newPrayedIds.add(id);
    setPrayedIds(newPrayedIds);
    localStorage.setItem("prayedIds", JSON.stringify([...newPrayedIds]));

    setPrayers(
      prayers.map((prayer) =>
        prayer.id === id
          ? { ...prayer, prayerCount: prayer.prayerCount + 1 }
          : prayer
      )
    );

    try {
      await fetch("/api/prayers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, increment: true }),
      });
    } catch (error) {
      console.error("Failed to update prayer count:", error);
    }
  };

  // Blessed by testimony
  const handleBlessed = async (id: string) => {
    if (blessedIds.has(id)) return;

    const newBlessedIds = new Set(blessedIds);
    newBlessedIds.add(id);
    setBlessedIds(newBlessedIds);
    localStorage.setItem("blessedIds", JSON.stringify([...newBlessedIds]));

    setTestimonies(
      testimonies.map((testimony) =>
        testimony.id === id
          ? { ...testimony, blessedCount: testimony.blessedCount + 1 }
          : testimony
      )
    );

    try {
      await fetch("/api/testimonies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, increment: true }),
      });
    } catch (error) {
      console.error("Failed to update blessed count:", error);
    }
  };

  const loading = activeTab === "prayers" ? loadingPrayers : loadingTestimonies;

  return (
    <div className="pt-20">
      {/* ── Hero ── */}
      <section className="bg-[#0a1a2f] text-white py-20 md:py-32">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="text-center">
            <h1
              className="font-display uppercase tracking-tight mb-6"
              style={{
                fontSize: "clamp(3rem, 10vw, 8rem)",
                fontWeight: 900,
                lineHeight: 0.95,
              }}
            >
              We Are All
              <br />
              Ministers
            </h1>
            <p className="text-white/60 text-lg md:text-xl font-body max-w-2xl mx-auto mb-10">
              Share your faith. Lift each other up. Every prayer and testimony
              strengthens our community.
            </p>

            {/* Tab Toggle */}
            <div className="inline-flex bg-white/10 rounded-xl p-1.5">
              <button
                onClick={() => setActiveTab("prayers")}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-body font-bold text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeTab === "prayers"
                    ? "bg-white text-[#0a1a2f] shadow-lg"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <Heart className="size-4" />
                Prayer Requests
              </button>
              <button
                onClick={() => setActiveTab("testimonies")}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-body font-bold text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeTab === "testimonies"
                    ? "bg-white text-[#0a1a2f] shadow-lg"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <BookOpen className="size-4" />
                Testimonies
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Success Toast ── */}
      {showSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="bg-[#0a1a2f] text-white px-6 py-4 rounded-xl shadow-[0_8px_40px_rgba(26,111,181,0.25)] flex items-center gap-3">
            <svg
              className="w-6 h-6 text-[#00d4ff]"
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
            <span className="font-body font-semibold">{successMessage}</span>
          </div>
        </div>
      )}

      {/* ── Content Section ── */}
      <section className="py-16 md:py-24 bg-[#fafcff]">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16">
          {/* ─── PRAYER REQUESTS TAB ─── */}
          {activeTab === "prayers" && (
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
                <h2
                  className="text-3xl md:text-4xl font-display uppercase tracking-wide"
                  style={{ fontWeight: 800, color: "#0a1a2f" }}
                >
                  Community Prayers
                </h2>

                <Dialog
                  open={prayerDialogOpen}
                  onOpenChange={setPrayerDialogOpen}
                >
                  <DialogTrigger
                    render={
                      <Button className="bg-[#1a6fb5] hover:bg-[#145a94] text-white font-body font-bold text-sm uppercase tracking-wider px-6 py-5 rounded-xl cursor-pointer" />
                    }
                  >
                    <Plus className="size-4 mr-2" />
                    Submit Request
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg p-6 md:p-8">
                    <DialogHeader>
                      <DialogTitle
                        className="text-2xl font-display uppercase tracking-wide"
                        style={{ fontWeight: 800, color: "#0a1a2f" }}
                      >
                        Share Your Request
                      </DialogTitle>
                    </DialogHeader>

                    <form
                      onSubmit={handlePrayerSubmit}
                      className="space-y-5 mt-4"
                    >
                      <div>
                        <label
                          htmlFor="prayer-name"
                          className="block text-xs font-body font-bold uppercase tracking-widest mb-2"
                          style={{ color: "#4a6580" }}
                        >
                          Your Name (optional)
                        </label>
                        <Input
                          id="prayer-name"
                          type="text"
                          value={prayerName}
                          onChange={(e) => setPrayerName(e.target.value)}
                          disabled={prayerAnonymous}
                          placeholder="Enter your name..."
                          className="h-12 border-[#c8dded] focus-visible:border-[#1a6fb5] focus-visible:ring-[#1a6fb5]/20 rounded-lg font-body text-[#0a1a2f] px-4"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="prayer-anonymous"
                          checked={prayerAnonymous}
                          onChange={(e) =>
                            setPrayerAnonymous(e.target.checked)
                          }
                          className="w-5 h-5 rounded border-[#c8dded] text-[#1a6fb5] focus:ring-[#1a6fb5]"
                        />
                        <label
                          htmlFor="prayer-anonymous"
                          className="font-body text-sm"
                          style={{ color: "#4a6580" }}
                        >
                          Post anonymously
                        </label>
                      </div>

                      <div>
                        <label
                          htmlFor="prayer-request"
                          className="block text-xs font-body font-bold uppercase tracking-widest mb-2"
                          style={{ color: "#4a6580" }}
                        >
                          Prayer Request
                        </label>
                        <Textarea
                          id="prayer-request"
                          value={prayerRequest}
                          onChange={(e) => setPrayerRequest(e.target.value)}
                          placeholder="Share what's on your heart..."
                          rows={4}
                          className="border-[#c8dded] focus-visible:border-[#1a6fb5] focus-visible:ring-[#1a6fb5]/20 rounded-lg font-body text-[#0a1a2f] px-4 py-3 resize-none"
                          required
                        />
                      </div>

                      {prayerError && (
                        <p className="text-red-500 text-sm text-center font-body font-medium">
                          {prayerError}
                        </p>
                      )}

                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 h-12 border-[#c8dded] text-[#4a6580] hover:border-[#1a6fb5] hover:text-[#1a6fb5] font-body font-bold text-sm uppercase tracking-wider rounded-lg cursor-pointer"
                          onClick={() => setPrayerDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={!prayerRequest.trim() || prayerSubmitting}
                          className="flex-1 h-12 bg-[#1a6fb5] hover:bg-[#145a94] text-white font-body font-bold text-sm uppercase tracking-wider rounded-lg cursor-pointer disabled:opacity-50"
                        >
                          {prayerSubmitting ? (
                            <span className="flex items-center gap-2">
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
                              Submitting...
                            </span>
                          ) : (
                            <>
                              <Send className="size-4 mr-2" />
                              Submit
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Prayer cards */}
              {loadingPrayers ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(26,111,181,0.08)] animate-pulse"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[#f0f4f8]" />
                        <div>
                          <div className="h-4 w-24 bg-[#f0f4f8] rounded" />
                          <div className="h-3 w-16 bg-[#f0f4f8] rounded mt-1" />
                        </div>
                      </div>
                      <div className="h-4 w-full bg-[#f0f4f8] rounded mb-2" />
                      <div className="h-4 w-3/4 bg-[#f0f4f8] rounded" />
                    </div>
                  ))}
                </div>
              ) : prayers.length === 0 ? (
                <div className="text-center py-16">
                  <Heart className="size-16 mx-auto text-[#c8dded] mb-6" />
                  <h3
                    className="text-2xl font-display uppercase mb-3"
                    style={{ fontWeight: 800, color: "#0a1a2f" }}
                  >
                    No prayer requests yet
                  </h3>
                  <p
                    className="font-body mb-8"
                    style={{ color: "#4a6580" }}
                  >
                    Be the first to share a prayer request with our community.
                  </p>
                  <Button
                    onClick={() => setPrayerDialogOpen(true)}
                    className="bg-[#1a6fb5] hover:bg-[#145a94] text-white font-body font-bold text-sm uppercase tracking-widest px-8 py-5 rounded-xl cursor-pointer"
                  >
                    Submit a Prayer Request
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {prayers.map((prayer) => {
                    const hasPrayed = prayedIds.has(prayer.id);
                    return (
                      <Card
                        key={prayer.id}
                        className="bg-white ring-1 ring-[#e0eaf3] rounded-2xl py-0 hover:shadow-lg transition-shadow duration-300"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-[#f0f4f8] flex items-center justify-center">
                                  <span
                                    className="font-display text-sm"
                                    style={{
                                      fontWeight: 800,
                                      color: "#1a6fb5",
                                    }}
                                  >
                                    {prayer.isAnonymous
                                      ? "?"
                                      : prayer.name.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p
                                    className="font-body font-bold"
                                    style={{ color: "#0a1a2f" }}
                                  >
                                    {prayer.isAnonymous
                                      ? "Anonymous"
                                      : prayer.name}
                                  </p>
                                  <p
                                    className="text-xs font-body"
                                    style={{ color: "#4a6580" }}
                                  >
                                    {formatTimeAgo(prayer.createdAt)}
                                  </p>
                                </div>
                              </div>
                              <p
                                className="font-body leading-relaxed"
                                style={{ color: "#4a6580" }}
                              >
                                {prayer.request}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-[#e0eaf3] flex items-center justify-between">
                            <Button
                              onClick={() => handlePray(prayer.id)}
                              disabled={hasPrayed}
                              variant="outline"
                              className={`font-body font-bold text-sm uppercase tracking-wider rounded-xl cursor-pointer ${
                                hasPrayed
                                  ? "bg-[#1a6fb5]/10 text-[#1a6fb5] border-transparent"
                                  : "border-[#1a6fb5] text-[#1a6fb5] hover:bg-[#1a6fb5] hover:text-white"
                              }`}
                            >
                              <Heart
                                className="size-4 mr-2"
                                fill={hasPrayed ? "currentColor" : "none"}
                              />
                              {hasPrayed ? "Prayed" : "I'm Praying"}
                            </Button>
                            <span
                              className="text-sm font-body"
                              style={{ color: "#4a6580" }}
                            >
                              <span
                                className="font-bold"
                                style={{ color: "#1a6fb5" }}
                              >
                                {prayer.prayerCount}
                              </span>{" "}
                              {prayer.prayerCount === 1 ? "person" : "people"}{" "}
                              praying
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── TESTIMONIES TAB ─── */}
          {activeTab === "testimonies" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12">
                <h2
                  className="text-3xl md:text-4xl font-display uppercase tracking-tight"
                  style={{ fontWeight: 800, color: "#0a1a2f" }}
                >
                  Testimony Wall
                </h2>

                <Dialog
                  open={testimonyDialogOpen}
                  onOpenChange={setTestimonyDialogOpen}
                >
                  <DialogTrigger
                    render={
                      <Button className="bg-[#1a6fb5] hover:bg-[#145a94] text-white font-body font-bold text-sm uppercase tracking-wider px-6 py-5 rounded-xl cursor-pointer" />
                    }
                  >
                    <Plus className="size-4 mr-2" />
                    Share Testimony
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg p-6 md:p-8">
                    <DialogHeader>
                      <DialogTitle
                        className="text-2xl font-display uppercase tracking-wide"
                        style={{ fontWeight: 800, color: "#0a1a2f" }}
                      >
                        Share Your Testimony
                      </DialogTitle>
                    </DialogHeader>

                    <form
                      onSubmit={handleTestimonySubmit}
                      className="space-y-5 mt-4"
                    >
                      <div>
                        <label
                          htmlFor="testimony-name"
                          className="block text-xs font-body font-bold uppercase tracking-widest mb-2"
                          style={{ color: "#4a6580" }}
                        >
                          Your Name (optional)
                        </label>
                        <Input
                          id="testimony-name"
                          type="text"
                          value={testimonyName}
                          onChange={(e) => setTestimonyName(e.target.value)}
                          disabled={testimonyAnonymous}
                          placeholder="Enter your name..."
                          className="h-12 border-[#c8dded] focus-visible:border-[#1a6fb5] focus-visible:ring-[#1a6fb5]/20 rounded-lg font-body text-[#0a1a2f] px-4"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="testimony-anonymous"
                          checked={testimonyAnonymous}
                          onChange={(e) =>
                            setTestimonyAnonymous(e.target.checked)
                          }
                          className="w-5 h-5 rounded border-[#c8dded] text-[#1a6fb5] focus:ring-[#1a6fb5]"
                        />
                        <label
                          htmlFor="testimony-anonymous"
                          className="font-body text-sm"
                          style={{ color: "#4a6580" }}
                        >
                          Post anonymously
                        </label>
                      </div>

                      <div>
                        <label
                          htmlFor="testimony-text"
                          className="block text-xs font-body font-bold uppercase tracking-widest mb-2"
                          style={{ color: "#4a6580" }}
                        >
                          Your Testimony
                        </label>
                        <Textarea
                          id="testimony-text"
                          value={testimonyText}
                          onChange={(e) => setTestimonyText(e.target.value)}
                          placeholder="Share how God has worked in your life..."
                          rows={6}
                          className="border-[#c8dded] focus-visible:border-[#1a6fb5] focus-visible:ring-[#1a6fb5]/20 rounded-lg font-body text-[#0a1a2f] px-4 py-3 resize-none"
                          required
                        />
                      </div>

                      {testimonyError && (
                        <p className="text-red-500 text-sm text-center font-body font-medium">
                          {testimonyError}
                        </p>
                      )}

                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 h-12 border-[#c8dded] text-[#4a6580] hover:border-[#1a6fb5] hover:text-[#1a6fb5] font-body font-bold text-sm uppercase tracking-wider rounded-lg cursor-pointer"
                          onClick={() => setTestimonyDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={
                            !testimonyText.trim() || testimonySubmitting
                          }
                          className="flex-1 h-12 bg-[#1a6fb5] hover:bg-[#145a94] text-white font-body font-bold text-sm uppercase tracking-wider rounded-lg cursor-pointer disabled:opacity-50"
                        >
                          {testimonySubmitting ? (
                            <span className="flex items-center gap-2">
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
                              Submitting...
                            </span>
                          ) : (
                            <>
                              <Send className="size-4 mr-2" />
                              Submit
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Testimony cards */}
              {loadingTestimonies ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl p-8 shadow-[0_2px_15px_rgba(26,111,181,0.06)] animate-pulse"
                    >
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 rounded-full bg-[#f0f4f8]" />
                        <div>
                          <div className="h-4 w-24 bg-[#f0f4f8] rounded" />
                          <div className="h-3 w-16 bg-[#f0f4f8] rounded mt-1" />
                        </div>
                      </div>
                      <div className="h-4 w-full bg-[#f0f4f8] rounded mb-2" />
                      <div className="h-4 w-3/4 bg-[#f0f4f8] rounded" />
                    </div>
                  ))}
                </div>
              ) : testimonies.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="size-16 mx-auto text-[#c8dded] mb-6" />
                  <h3
                    className="text-2xl font-display uppercase tracking-tight mb-3"
                    style={{ fontWeight: 800, color: "#0a1a2f" }}
                  >
                    No testimonies yet
                  </h3>
                  <p className="font-body mb-8" style={{ color: "#4a6580" }}>
                    Be the first to share how God has moved in your life.
                  </p>
                  <Button
                    onClick={() => setTestimonyDialogOpen(true)}
                    className="bg-[#1a6fb5] hover:bg-[#145a94] text-white font-body font-bold text-sm uppercase tracking-widest px-8 py-5 rounded-xl cursor-pointer"
                  >
                    Share Your Testimony
                  </Button>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {testimonies.map((testimony) => {
                    const hasBlessed = blessedIds.has(testimony.id);
                    return (
                      <Card
                        key={testimony.id}
                        className="bg-white ring-1 ring-[#e0eaf3] rounded-2xl py-0 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col"
                      >
                        <CardContent className="p-8 flex flex-col flex-1">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-5">
                              <div className="w-12 h-12 rounded-full bg-[#f0f4f8] flex items-center justify-center">
                                <span
                                  className="font-display text-lg"
                                  style={{ fontWeight: 800, color: "#1a6fb5" }}
                                >
                                  {testimony.isAnonymous
                                    ? "?"
                                    : testimony.name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p
                                  className="font-body font-bold"
                                  style={{ color: "#0a1a2f" }}
                                >
                                  {testimony.isAnonymous
                                    ? "Anonymous"
                                    : testimony.name}
                                </p>
                                <p
                                  className="text-xs font-body"
                                  style={{ color: "#4a6580" }}
                                >
                                  {formatTimeAgo(testimony.createdAt)}
                                </p>
                              </div>
                            </div>
                            <p
                              className="font-body leading-relaxed"
                              style={{ color: "#4a6580" }}
                            >
                              {testimony.text}
                            </p>
                          </div>

                          <div className="mt-6 pt-5 border-t border-[#e0eaf3] flex items-center justify-between">
                            <Button
                              onClick={() => handleBlessed(testimony.id)}
                              disabled={hasBlessed}
                              variant="outline"
                              className={`font-body font-bold text-sm rounded-full cursor-pointer ${
                                hasBlessed
                                  ? "bg-[#1a6fb5]/10 text-[#1a6fb5] border-transparent"
                                  : "border-[#e0eaf3] text-[#4a6580] hover:bg-[#1a6fb5] hover:text-white hover:border-[#1a6fb5]"
                              }`}
                            >
                              <Heart
                                className="size-4 mr-2"
                                fill={hasBlessed ? "currentColor" : "none"}
                              />
                              {hasBlessed ? "Blessed" : "This Blessed Me"}
                            </Button>
                            <span
                              className="text-sm font-body"
                              style={{ color: "#4a6580" }}
                            >
                              <span
                                className="font-bold"
                                style={{ color: "#1a6fb5" }}
                              >
                                {testimony.blessedCount}
                              </span>{" "}
                              blessed
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Scripture Section ── */}
      <section className="py-16 md:py-24 bg-[#f0f4f8]">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          <Card className="max-w-4xl mx-auto bg-white ring-0 rounded-2xl shadow-[0_4px_20px_rgba(26,111,181,0.08)] py-0">
            <CardContent className="p-10 md:p-16">
              <svg
                className="w-12 h-12 mx-auto mb-8 text-[#1a6fb5]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <blockquote
                className="text-2xl md:text-3xl lg:text-4xl font-display leading-snug mb-8"
                style={{ fontWeight: 800, color: "#0a1a2f" }}
              >
                {activeTab === "prayers"
                  ? '"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God."'
                  : '"So then faith comes by hearing, and hearing by the word of God."'}
              </blockquote>
              <cite
                className="text-[#1a6fb5] font-body font-bold text-sm uppercase tracking-widest not-italic"
              >
                {activeTab === "prayers"
                  ? "Philippians 4:6"
                  : "Romans 10:17 (NKJV)"}
              </cite>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
