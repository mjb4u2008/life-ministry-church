"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/Button";

interface Testimony {
  id: string;
  name: string;
  text: string;
  isAnonymous: boolean;
  blessedCount: number;
  createdAt: string;
  approved: boolean;
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

export default function TestimoniesPage() {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [blessedIds, setBlessedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load blessed IDs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("blessedIds");
    if (stored) {
      setBlessedIds(new Set(JSON.parse(stored)));
    }
  }, []);

  // Fetch testimonies from API
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
      setLoading(false);
    }
    fetchTestimonies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/testimonies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: isAnonymous ? "Anonymous" : name || "Anonymous",
          text: text.trim(),
          isAnonymous,
        }),
      });

      if (res.ok) {
        setName("");
        setText("");
        setIsAnonymous(false);
        setShowForm(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to submit testimony");
      }
    } catch {
      setErrorMessage("Connection error. Please try again.");
    }

    setIsSubmitting(false);
  };

  const handleBlessed = async (id: string) => {
    if (blessedIds.has(id)) return;

    // Optimistically update UI
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

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="bg-deep text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold mb-4">
              We Are All Ministers
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto mb-8">
              Share how God has moved in your life. Your testimony of faith
              can inspire and encourage others on their journey.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-water hover:bg-water-dark"
              size="lg"
            >
              Share Your Testimony
            </Button>
          </div>
        </div>
      </section>

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="bg-deep text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
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
            <span className="font-medium">
              Testimony submitted! It will appear after review.
            </span>
          </div>
        </div>
      )}

      {/* Testimony Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-semibold text-deep">
                Share Your Testimony
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-text-body hover:text-deep"
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
                  htmlFor="testimony-name"
                  className="block text-sm font-medium text-deep mb-2"
                >
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  id="testimony-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isAnonymous}
                  placeholder="Enter your name..."
                  className="w-full px-4 py-3 rounded-lg border border-border-light focus:border-water focus:ring-2 focus:ring-water/20 outline-none transition-colors bg-cloud disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="testimony-anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-5 h-5 rounded border-border-light text-water focus:ring-water"
                />
                <label htmlFor="testimony-anonymous" className="text-text-body">
                  Post anonymously
                </label>
              </div>

              <div>
                <label
                  htmlFor="testimony-text"
                  className="block text-sm font-medium text-deep mb-2"
                >
                  Your Testimony
                </label>
                <textarea
                  id="testimony-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Share how God has worked in your life..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-border-light focus:border-water focus:ring-2 focus:ring-water/20 outline-none transition-colors bg-cloud resize-none"
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
                  disabled={!text.trim()}
                  className="flex-1"
                >
                  Submit Testimony
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Testimony Wall */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-display font-semibold text-deep">
              Testimony Wall
            </h2>
            <span className="text-text-body text-sm">
              {testimonies.length} {testimonies.length === 1 ? "testimony" : "testimonies"}
            </span>
          </div>

          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-border-light" />
                    <div>
                      <div className="h-4 w-24 bg-border-light rounded" />
                      <div className="h-3 w-16 bg-border-light rounded mt-1" />
                    </div>
                  </div>
                  <div className="h-4 w-full bg-border-light rounded mb-2" />
                  <div className="h-4 w-3/4 bg-border-light rounded" />
                </div>
              ))}
            </div>
          ) : testimonies.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto text-text-light mb-4"
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
              <h3 className="text-xl font-display font-semibold text-deep mb-2">
                No testimonies yet
              </h3>
              <p className="text-text-body mb-6">
                Be the first to share how God has moved in your life.
              </p>
              <Button onClick={() => setShowForm(true)}>
                Share Your Testimony
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {testimonies.map((testimony) => {
                const hasBlessed = blessedIds.has(testimony.id);
                return (
                  <div
                    key={testimony.id}
                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow card-glow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-cloud flex items-center justify-center">
                            <span className="font-display font-semibold text-water">
                              {testimony.isAnonymous ? "?" : testimony.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-deep">
                              {testimony.isAnonymous ? "Anonymous" : testimony.name}
                            </p>
                            <p className="text-xs text-text-body">
                              {formatTimeAgo(testimony.createdAt)}
                            </p>
                          </div>
                        </div>
                        <p className="text-text-body leading-relaxed">
                          {testimony.text}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border-light/50 flex items-center justify-between">
                      <button
                        onClick={() => handleBlessed(testimony.id)}
                        disabled={hasBlessed}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          hasBlessed
                            ? "bg-water/10 text-water cursor-default"
                            : "bg-cloud hover:bg-water hover:text-white text-text-body"
                        }`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill={hasBlessed ? "currentColor" : "none"}
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
                        {hasBlessed ? "Blessed" : "This Blessed Me"}
                      </button>
                      <span className="text-sm text-text-body">
                        <span className="font-semibold text-water">{testimony.blessedCount}</span>{" "}
                        {testimony.blessedCount === 1 ? "person" : "people"} blessed
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Scripture Section */}
      <section className="py-16 bg-sky">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm">
            <svg
              className="w-12 h-12 mx-auto mb-6 text-water"
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
            <blockquote className="text-2xl md:text-3xl font-display text-deep mb-6">
              &ldquo;So then faith comes by hearing, and hearing by the word of God.&rdquo;
            </blockquote>
            <cite className="text-water font-medium">
              — Romans 10:17 (NKJV)
            </cite>
          </div>
        </div>
      </section>
    </div>
  );
}
