"use client";

import { useState, useEffect } from "react";

interface PrayerRequest {
  id: string;
  name: string;
  request: string;
  prayerCount: number;
  createdAt: string;
  isAnonymous: boolean;
  hasPrayed?: boolean;
}

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
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

export default function ConnectPage() {
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [prayedIds, setPrayedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [request, setRequest] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load prayed IDs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("prayedIds");
    if (stored) {
      setPrayedIds(new Set(JSON.parse(stored)));
    }
  }, []);

  // Fetch prayers from API
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
      setLoading(false);
    }
    fetchPrayers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.trim()) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/prayers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: isAnonymous ? "Anonymous" : name || "Anonymous",
          request: request.trim(),
          isAnonymous,
        }),
      });

      if (res.ok) {
        const newPrayer = await res.json();
        setPrayers([newPrayer, ...prayers]);
        setName("");
        setRequest("");
        setIsAnonymous(false);
        setShowForm(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to submit prayer request");
      }
    } catch {
      setErrorMessage("Connection error. Please try again.");
    }

    setIsSubmitting(false);
  };

  const handlePray = async (id: string) => {
    if (prayedIds.has(id)) return;

    // Optimistically update UI
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

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="bg-[#0a1a2f] text-white py-20 md:py-32">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="text-center">
            <p className="font-body text-[#00d4ff] uppercase tracking-[0.2em] text-sm font-semibold mb-4">
              Lift Up One Another
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-[900] mb-6 uppercase tracking-wide">
              PRAYER WALL
            </h1>
            <p className="text-white/60 font-body text-lg max-w-2xl mx-auto mb-10">
              Share your prayer requests and lift up others in prayer.
              Every request is seen, every prayer matters.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-[#1a6fb5] hover:bg-[#145a94] text-white font-body font-bold text-sm uppercase tracking-widest px-10 py-4 rounded-xl transition-colors duration-200 shadow-lg shadow-[#1a6fb5]/20"
            >
              Submit a Prayer Request
            </button>
          </div>
        </div>
      </section>

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="bg-[#0a1a2f] text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
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
            <span className="font-body font-semibold">Prayer request submitted!</span>
          </div>
        </div>
      )}

      {/* Prayer Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 animate-fade-in-up shadow-[0_8px_40px_rgba(10,26,47,0.15)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-[800] text-[#0a1a2f] uppercase tracking-wide">
                Share Your Request
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-[#4a6580] hover:text-[#0a1a2f] transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-body font-bold text-[#0a1a2f] mb-2 uppercase tracking-wide"
                >
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isAnonymous}
                  placeholder="Enter your name..."
                  className="w-full px-4 py-3 rounded-xl border border-[#c8dded] focus:border-[#1a6fb5] focus:ring-2 focus:ring-[#1a6fb5]/20 outline-none transition-colors bg-[#fafcff] font-body text-[#0a1a2f] placeholder:text-[#4a6580]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-5 h-5 rounded border-[#c8dded] text-[#1a6fb5] focus:ring-[#1a6fb5]"
                />
                <label htmlFor="anonymous" className="font-body text-[#4a6580]">
                  Post anonymously
                </label>
              </div>

              <div>
                <label
                  htmlFor="request"
                  className="block text-sm font-body font-bold text-[#0a1a2f] mb-2 uppercase tracking-wide"
                >
                  Prayer Request
                </label>
                <textarea
                  id="request"
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  placeholder="Share what's on your heart..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-[#c8dded] focus:border-[#1a6fb5] focus:ring-2 focus:ring-[#1a6fb5]/20 outline-none transition-colors bg-[#fafcff] font-body text-[#0a1a2f] placeholder:text-[#4a6580]/50 resize-none"
                  required
                />
              </div>

              {errorMessage && (
                <p className="text-red-500 text-sm text-center font-body font-medium">{errorMessage}</p>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-[#c8dded] text-[#4a6580] font-body font-bold text-sm uppercase tracking-wide hover:border-[#1a6fb5] hover:text-[#1a6fb5] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!request.trim() || isSubmitting}
                  className="flex-1 px-6 py-3 rounded-xl bg-[#1a6fb5] text-white font-body font-bold text-sm uppercase tracking-wide hover:bg-[#145a94] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#1a6fb5]/20"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    "Submit Request"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prayer Wall */}
      <section className="py-16 md:py-24 bg-[#fafcff]">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl md:text-4xl font-display font-[800] text-[#0a1a2f] uppercase tracking-wide">
                Community Prayers
              </h2>
              <span className="text-[#4a6580] font-body text-sm font-semibold uppercase tracking-wide">
                {prayers.length} {prayers.length === 1 ? "request" : "requests"}
              </span>
            </div>

            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(26,111,181,0.08)] animate-pulse">
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
                <svg
                  className="w-16 h-16 mx-auto text-[#c8dded] mb-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <h3 className="text-2xl font-display font-[800] text-[#0a1a2f] mb-3 uppercase">
                  No prayer requests yet
                </h3>
                <p className="text-[#4a6580] font-body mb-8">
                  Be the first to share a prayer request with our community.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-[#1a6fb5] hover:bg-[#145a94] text-white font-body font-bold text-sm uppercase tracking-widest px-8 py-3 rounded-xl transition-colors duration-200 shadow-lg shadow-[#1a6fb5]/20"
                >
                  Submit a Prayer Request
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {prayers.map((prayer) => {
                  const hasPrayed = prayedIds.has(prayer.id);
                  return (
                    <div
                      key={prayer.id}
                      className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(26,111,181,0.08)] hover:shadow-[0_8px_30px_rgba(26,111,181,0.15)] transition-shadow duration-300"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-[#f0f4f8] flex items-center justify-center">
                              <span className="font-display font-[800] text-[#1a6fb5]">
                                {prayer.isAnonymous ? "?" : prayer.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-body font-bold text-[#0a1a2f]">
                                {prayer.isAnonymous ? "Anonymous" : prayer.name}
                              </p>
                              <p className="text-xs font-body text-[#4a6580]">
                                {formatTimeAgo(prayer.createdAt)}
                              </p>
                            </div>
                          </div>
                          <p className="text-[#4a6580] font-body leading-relaxed">
                            {prayer.request}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-[#c8dded]/40 flex items-center justify-between">
                        <button
                          onClick={() => handlePray(prayer.id)}
                          disabled={hasPrayed}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-body font-bold uppercase tracking-wide transition-colors duration-200 ${
                            hasPrayed
                              ? "bg-[#1a6fb5]/10 text-[#1a6fb5] cursor-default"
                              : "border border-[#1a6fb5] text-[#1a6fb5] hover:bg-[#1a6fb5] hover:text-white"
                          }`}
                        >
                          <svg
                            className="w-4 h-4"
                            fill={hasPrayed ? "currentColor" : "none"}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                          {hasPrayed ? "Prayed" : "I'm Praying"}
                        </button>
                        <span className="text-sm font-body text-[#4a6580]">
                          <span className="font-bold text-[#1a6fb5]">{prayer.prayerCount}</span>{" "}
                          {prayer.prayerCount === 1 ? "person" : "people"} praying
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Scripture / Encouragement Section */}
      <section className="py-16 md:py-24 bg-[#f0f4f8]">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl p-10 md:p-16 shadow-[0_4px_20px_rgba(26,111,181,0.08)]">
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
            <blockquote className="text-2xl md:text-3xl lg:text-4xl font-display font-[800] text-[#0a1a2f] mb-8 leading-snug">
              &ldquo;Do not be anxious about anything, but in every situation, by prayer
              and petition, with thanksgiving, present your requests to God.&rdquo;
            </blockquote>
            <cite className="text-[#1a6fb5] font-body font-bold text-sm uppercase tracking-widest not-italic">
              Philippians 4:6
            </cite>
          </div>
        </div>
      </section>
    </div>
  );
}
