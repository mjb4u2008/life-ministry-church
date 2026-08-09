"use client";

import { useState, useEffect, useCallback } from "react";
import { Heart, BookOpen, Send, Plus } from "lucide-react";

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
  const [prayerSharePublic, setPrayerSharePublic] = useState(false);
  const [prayerContactPermission, setPrayerContactPermission] = useState(false);
  const [prayerEmail, setPrayerEmail] = useState("");
  const [prayerWebsite, setPrayerWebsite] = useState("");
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

  // Celebration overlays
  const [showPrayerCelebration, setShowPrayerCelebration] = useState(false);
  const [showTestimonyCelebration, setShowTestimonyCelebration] = useState(false);

  // Button pop animation tracking
  const [poppingPrayId, setPoppingPrayId] = useState<string | null>(null);
  const [poppingBlessedId, setPoppingBlessedId] = useState<string | null>(null);
  const [floatingPrayId, setFloatingPrayId] = useState<string | null>(null);
  const [floatingBlessedId, setFloatingBlessedId] = useState<string | null>(null);

  // Stable random positions for celebration hearts (avoids hydration mismatch)
  const [heartPositions, setHeartPositions] = useState<number[]>([]);
  const [heartDelays, setHeartDelays] = useState<number[]>([]);
  const [burstParticles, setBurstParticles] = useState<
    { tx: number; ty: number; tx2: number; ty2: number; color: string; size: number }[]
  >([]);

  const generateHeartPositions = useCallback(() => {
    setHeartPositions(
      Array.from({ length: 10 }, () => 20 + Math.random() * 60)
    );
    setHeartDelays(Array.from({ length: 10 }, (_, i) => i * 0.15));
  }, []);

  const generateBurstParticles = useCallback(() => {
    const colors = ["#1a6fb5", "#00d4ff", "#145a94", "#4a9fd4", "#0a1a2f"];
    setBurstParticles(Array.from({ length: 18 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 80 + Math.random() * 120;
      const distance2 = distance + 40 + Math.random() * 60;
      return {
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance,
        tx2: Math.cos(angle) * distance2,
        ty2: Math.sin(angle) * distance2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 8,
      };
    }));
  }, []);

  // Load persisted IDs from localStorage
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedPrayed = localStorage.getItem("prayedIds");
      if (storedPrayed) {
        setPrayedIds(new Set(JSON.parse(storedPrayed)));
      }
      const storedBlessed = localStorage.getItem("blessedIds");
      if (storedBlessed) {
        setBlessedIds(new Set(JSON.parse(storedBlessed)));
      }
    }, 0);

    return () => window.clearTimeout(timer);
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
          sharePublic: prayerSharePublic,
          contactPermission: prayerContactPermission,
          email: prayerContactPermission && prayerEmail ? prayerEmail : undefined,
          preferredContact: prayerContactPermission && prayerEmail ? "email" : undefined,
          website: prayerWebsite,
        }),
      });

      if (res.ok) {
        setPrayerName("");
        setPrayerRequest("");
        setPrayerAnonymous(false);
        setPrayerSharePublic(false);
        setPrayerContactPermission(false);
        setPrayerEmail("");
        setPrayerWebsite("");
        setPrayerDialogOpen(false);
        // Trigger celebration
        generateHeartPositions();
        setShowPrayerCelebration(true);
        setTimeout(() => setShowPrayerCelebration(false), 3000);
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
        const newTestimony = await res.json();
        // Optimistic update — show immediately with pending badge
        setTestimonies([newTestimony, ...testimonies]);
        setTestimonyName("");
        setTestimonyText("");
        setTestimonyAnonymous(false);
        setTestimonyDialogOpen(false);
        // Trigger celebration
        generateBurstParticles();
        setShowTestimonyCelebration(true);
        setTimeout(() => setShowTestimonyCelebration(false), 3500);
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

    // Trigger pop + float animation
    setPoppingPrayId(id);
    setFloatingPrayId(id);
    setTimeout(() => setPoppingPrayId(null), 400);
    setTimeout(() => setFloatingPrayId(null), 700);

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

    // Trigger pop + float animation
    setPoppingBlessedId(id);
    setFloatingBlessedId(id);
    setTimeout(() => setPoppingBlessedId(null), 400);
    setTimeout(() => setFloatingBlessedId(null), 700);

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
            <div className="flex w-full max-w-sm flex-col gap-1.5 rounded-xl bg-white/10 p-1.5 sm:inline-flex sm:w-auto sm:flex-row sm:gap-0">
              <button
                onClick={() => setActiveTab("prayers")}
                className={`flex w-full items-center justify-center gap-2 px-4 py-3 rounded-lg font-body font-bold text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer sm:w-auto sm:px-6 ${
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
                className={`flex w-full items-center justify-center gap-2 px-4 py-3 rounded-lg font-body font-bold text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer sm:w-auto sm:px-6 ${
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
                          Show me as Anonymous if this is approved for the public wall
                        </label>
                      </div>

                      <fieldset className="rounded-xl border border-[#c8dded] p-4">
                        <legend className="px-1 text-xs font-body font-bold uppercase tracking-widest text-[#4a6580]">Who may see this?</legend>
                        <label className="mt-2 flex min-h-11 items-start gap-3 font-body text-sm text-[#0a1a2f]">
                          <input checked={!prayerSharePublic} className="mt-0.5 size-5 shrink-0" name="prayer-visibility" onChange={() => setPrayerSharePublic(false)} type="radio" />
                          <span><strong className="block">Pastor only</strong><span className="text-[#4a6580]">Private in the pastoral care inbox.</span></span>
                        </label>
                        <label className="mt-3 flex min-h-11 items-start gap-3 font-body text-sm text-[#0a1a2f]">
                          <input checked={prayerSharePublic} className="mt-0.5 size-5 shrink-0" name="prayer-visibility" onChange={() => setPrayerSharePublic(true)} type="radio" />
                          <span><strong className="block">Request public sharing</strong><span className="text-[#4a6580]">Pastor Mike must review and approve it first.</span></span>
                        </label>
                      </fieldset>

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

                      <label className="flex min-h-11 items-start gap-3 rounded-xl bg-[#f0f4f8] p-4 font-body text-sm text-[#0a1a2f]">
                        <input checked={prayerContactPermission} className="mt-0.5 size-5 shrink-0" onChange={(event) => setPrayerContactPermission(event.target.checked)} type="checkbox" />
                        Pastor Mike may follow up with me by email.
                      </label>
                      {prayerContactPermission && (
                        <label className="block text-xs font-body font-bold uppercase tracking-widest text-[#4a6580]">Email for private follow-up
                          <Input className="mt-2 h-12 px-4 text-base normal-case tracking-normal" onChange={(event) => setPrayerEmail(event.target.value)} required type="email" value={prayerEmail} />
                        </label>
                      )}
                      <label className="hidden" aria-hidden="true">Website
                        <Input autoComplete="off" onChange={(event) => setPrayerWebsite(event.target.value)} tabIndex={-1} value={prayerWebsite} />
                      </label>

                      <p className="font-body text-xs leading-relaxed text-[#4a6580]">This form is not monitored as an emergency or crisis service. If anyone is in immediate danger, contact local emergency services.</p>

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
                    Public prayer requests appear here only after the person asks to share and Pastor Mike approves them.
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
                            <div className="relative">
                              <Button
                                onClick={() => handlePray(prayer.id)}
                                disabled={hasPrayed}
                                variant="outline"
                                className={`font-body font-bold text-sm uppercase tracking-wider rounded-xl cursor-pointer ${
                                  poppingPrayId === prayer.id ? "animate-pop-scale" : ""
                                } ${
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
                              {floatingPrayId === prayer.id && (
                                <span
                                  className="absolute -top-2 left-1/2 -translate-x-1/2 text-sm font-bold animate-float-up-plus pointer-events-none"
                                  style={{ color: "#1a6fb5" }}
                                >
                                  +1
                                </span>
                              )}
                            </div>
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

                          {!testimony.approved && (
                            <div className="mt-4">
                              <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-body text-xs font-semibold">
                                Pending Review
                              </Badge>
                            </div>
                          )}

                          <div className="mt-6 pt-5 border-t border-[#e0eaf3] flex items-center justify-between">
                            <div className="relative">
                              <Button
                                onClick={() => handleBlessed(testimony.id)}
                                disabled={hasBlessed}
                                variant="outline"
                                className={`font-body font-bold text-sm rounded-full cursor-pointer ${
                                  poppingBlessedId === testimony.id ? "animate-pop-scale" : ""
                                } ${
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
                              {floatingBlessedId === testimony.id && (
                                <span
                                  className="absolute -top-2 left-1/2 -translate-x-1/2 text-sm font-bold animate-float-up-plus pointer-events-none"
                                  style={{ color: "#1a6fb5" }}
                                >
                                  +1
                                </span>
                              )}
                            </div>
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

      {/* ── Prayer Celebration Overlay ── */}
      {showPrayerCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          {/* Celebration message */}
          <div
            className="bg-white rounded-2xl shadow-2xl px-8 py-6 text-center animate-celebration-card-in"
            style={{ boxShadow: "0 8px 60px rgba(26, 111, 181, 0.25)" }}
          >
            <p className="text-3xl mb-2">🙏</p>
            <p className="font-display text-xl" style={{ fontWeight: 800, color: "#0a1a2f" }}>
              Prayer Received
            </p>
            <p className="font-body text-sm mt-1" style={{ color: "#4a6580" }}>
              We&apos;re lifting you up in prayer
            </p>
          </div>
          {/* Floating hearts */}
          {heartPositions.map((left, i) => (
            <div
              key={i}
              className="absolute text-2xl md:text-3xl"
              style={{
                left: `${left}%`,
                bottom: "40%",
                animation: `float-up-heart 2.5s ease-out ${heartDelays[i]}s forwards`,
                opacity: 0,
              }}
            >
              💙
            </div>
          ))}
        </div>
      )}

      {/* ── Testimony Celebration Overlay ── */}
      {showTestimonyCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          {/* Celebration message */}
          <div
            className="bg-white rounded-2xl shadow-2xl px-8 py-6 text-center animate-celebration-card-in relative z-10"
            style={{ boxShadow: "0 8px 60px rgba(26, 111, 181, 0.25)" }}
          >
            <p className="text-3xl mb-2">✨</p>
            <p className="font-display text-xl" style={{ fontWeight: 800, color: "#0a1a2f" }}>
              Thank You For Sharing
            </p>
            <p className="font-body text-sm mt-1" style={{ color: "#4a6580" }}>
              Your testimony will move and inspire others
            </p>
          </div>
          {/* Burst particles */}
          {burstParticles.map((particle, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                left: "50%",
                top: "50%",
                ["--tx" as string]: `${particle.tx}px`,
                ["--ty" as string]: `${particle.ty}px`,
                ["--tx2" as string]: `${particle.tx2}px`,
                ["--ty2" as string]: `${particle.ty2}px`,
                animation: `burst-out 1.8s ease-out ${i * 0.05}s forwards`,
                opacity: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
