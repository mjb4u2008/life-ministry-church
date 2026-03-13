"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/Button";

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
      <section className="bg-forest text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold mb-4">
              Prayer Wall
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
              Share your prayer requests and lift up others in prayer.
              Every request is seen, every prayer matters.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-terracotta hover:bg-terracotta-dark"
              size="lg"
            >
              Submit a Prayer Request
            </Button>
          </div>
        </div>
      </section>

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="bg-forest text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="font-medium">Prayer request submitted!</span>
          </div>
        </div>
      )}

      {/* Prayer Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-semibold text-charcoal">
                Share Your Prayer Request
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-charcoal-light hover:text-charcoal"
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
                  className="block text-sm font-medium text-charcoal mb-2"
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
                  className="w-full px-4 py-3 rounded-lg border border-warm-gray-light focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition-colors bg-cream disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-5 h-5 rounded border-warm-gray-light text-terracotta focus:ring-terracotta"
                />
                <label htmlFor="anonymous" className="text-charcoal-light">
                  Post anonymously
                </label>
              </div>

              <div>
                <label
                  htmlFor="request"
                  className="block text-sm font-medium text-charcoal mb-2"
                >
                  Prayer Request
                </label>
                <textarea
                  id="request"
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  placeholder="Share what's on your heart..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-warm-gray-light focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 outline-none transition-colors bg-cream resize-none"
                  required
                />
              </div>

              {errorMessage && (
                <p className="text-red-500 text-sm text-center">{errorMessage}</p>
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={!request.trim()}
                  className="flex-1"
                >
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prayer Wall */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-display font-semibold text-charcoal">
              Community Prayers
            </h2>
            <span className="text-charcoal-light text-sm">
              {prayers.length} {prayers.length === 1 ? "request" : "requests"}
            </span>
          </div>

          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-warm-gray-light" />
                    <div>
                      <div className="h-4 w-24 bg-warm-gray-light rounded" />
                      <div className="h-3 w-16 bg-warm-gray-light rounded mt-1" />
                    </div>
                  </div>
                  <div className="h-4 w-full bg-warm-gray-light rounded mb-2" />
                  <div className="h-4 w-3/4 bg-warm-gray-light rounded" />
                </div>
              ))}
            </div>
          ) : prayers.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto text-warm-gray-light mb-4"
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
              <h3 className="text-xl font-display font-semibold text-charcoal mb-2">
                No prayer requests yet
              </h3>
              <p className="text-charcoal-light mb-6">
                Be the first to share a prayer request with our community.
              </p>
              <Button onClick={() => setShowForm(true)}>
                Submit a Prayer Request
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {prayers.map((prayer) => {
                const hasPrayed = prayedIds.has(prayer.id);
                return (
                  <div
                    key={prayer.id}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center">
                            <span className="font-display font-semibold text-terracotta">
                              {prayer.isAnonymous ? "?" : prayer.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-charcoal">
                              {prayer.isAnonymous ? "Anonymous" : prayer.name}
                            </p>
                            <p className="text-xs text-charcoal-light">
                              {formatTimeAgo(prayer.createdAt)}
                            </p>
                          </div>
                        </div>
                        <p className="text-charcoal-light leading-relaxed">
                          {prayer.request}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-warm-gray-light/50 flex items-center justify-between">
                      <button
                        onClick={() => handlePray(prayer.id)}
                        disabled={hasPrayed}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          hasPrayed
                            ? "bg-forest/10 text-forest cursor-default"
                            : "bg-cream hover:bg-terracotta hover:text-white text-charcoal-light"
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
                      <span className="text-sm text-charcoal-light">
                        <span className="font-semibold text-forest">{prayer.prayerCount}</span>{" "}
                        {prayer.prayerCount === 1 ? "person" : "people"} praying
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Encouragement Section */}
      <section className="py-16 bg-cream-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm">
            <svg
              className="w-12 h-12 mx-auto mb-6 text-terracotta"
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
            <blockquote className="text-2xl md:text-3xl font-display text-charcoal mb-6">
              &ldquo;Do not be anxious about anything, but in every situation, by prayer
              and petition, with thanksgiving, present your requests to God.&rdquo;
            </blockquote>
            <cite className="text-terracotta font-medium">
              — Philippians 4:6
            </cite>
          </div>
        </div>
      </section>
    </div>
  );
}
