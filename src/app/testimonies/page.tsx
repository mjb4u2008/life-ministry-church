"use client";

import { useState, useEffect } from "react";

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
              Share how God has moved in your life. Your testimony of faith
              can inspire and encourage others on their journey.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-block px-10 py-5 bg-[#1a6fb5] text-white font-body font-bold text-sm uppercase tracking-[0.08em] rounded-xl hover:bg-[#145a94] transition-colors"
            >
              Share Your Testimony
            </button>
          </div>
        </div>
      </section>

      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="bg-[#0a1a2f] text-white px-6 py-4 rounded-xl shadow-[0_8px_40px_rgba(26,111,181,0.25)] flex items-center gap-3">
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
            <span className="font-body font-semibold">
              Testimony submitted! It will appear after review.
            </span>
          </div>
        </div>
      )}

      {/* Testimony Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 md:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between mb-8">
              <h2
                className="text-2xl md:text-3xl font-display uppercase tracking-tight"
                style={{ fontWeight: 800, color: "#0a1a2f" }}
              >
                Share Your Testimony
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
                  htmlFor="testimony-name"
                  className="block text-xs font-body font-bold uppercase tracking-[0.1em] mb-2"
                  style={{ color: "#4a6580" }}
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#c8dded] focus:border-[#1a6fb5] focus:ring-2 focus:ring-[#1a6fb5]/20 outline-none transition-colors bg-white font-body disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: "#0a1a2f" }}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="testimony-anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
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
                  className="block text-xs font-body font-bold uppercase tracking-[0.1em] mb-2"
                  style={{ color: "#4a6580" }}
                >
                  Your Testimony
                </label>
                <textarea
                  id="testimony-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Share how God has worked in your life..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#c8dded] focus:border-[#1a6fb5] focus:ring-2 focus:ring-[#1a6fb5]/20 outline-none transition-colors bg-white font-body resize-none"
                  style={{ color: "#0a1a2f" }}
                  required
                />
              </div>

              {errorMessage && (
                <p className="text-red-500 text-sm text-center font-body">{errorMessage}</p>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-body font-bold text-sm uppercase tracking-[0.08em] transition-colors hover:bg-[#f0f4f8]"
                  style={{ color: "#4a6580" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!text.trim() || isSubmitting}
                  className="flex-1 px-6 py-3 bg-[#1a6fb5] text-white rounded-xl font-body font-bold text-sm uppercase tracking-[0.08em] hover:bg-[#145a94] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    "Submit Testimony"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Testimony Wall */}
      <section className="py-20 md:py-32" style={{ background: "#fafcff" }}>
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16">
          <div className="flex items-center justify-between mb-12">
            <h2
              className="text-3xl md:text-4xl font-display uppercase tracking-tight"
              style={{ fontWeight: 800, color: "#0a1a2f" }}
            >
              Testimony Wall
            </h2>
            <span className="font-body text-sm font-semibold" style={{ color: "#4a6580" }}>
              {testimonies.length} {testimonies.length === 1 ? "testimony" : "testimonies"}
            </span>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-8 shadow-[0_2px_15px_rgba(26,111,181,0.06)] animate-pulse">
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
              <svg
                className="w-16 h-16 mx-auto mb-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: "#c8dded" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <h3
                className="text-2xl font-display uppercase tracking-tight mb-3"
                style={{ fontWeight: 800, color: "#0a1a2f" }}
              >
                No testimonies yet
              </h3>
              <p className="font-body mb-8" style={{ color: "#4a6580" }}>
                Be the first to share how God has moved in your life.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-block px-8 py-4 bg-[#1a6fb5] text-white font-body font-bold text-sm uppercase tracking-[0.08em] rounded-xl hover:bg-[#145a94] transition-colors"
              >
                Share Your Testimony
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonies.map((testimony) => {
                const hasBlessed = blessedIds.has(testimony.id);
                return (
                  <div
                    key={testimony.id}
                    className="bg-white rounded-2xl p-8 shadow-[0_2px_15px_rgba(26,111,181,0.06)] hover:shadow-[0_12px_40px_rgba(26,111,181,0.14)] transition-all duration-300 hover:-translate-y-1 flex flex-col"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-5">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ background: "#f0f4f8" }}
                        >
                          <span
                            className="font-display text-lg"
                            style={{ fontWeight: 800, color: "#1a6fb5" }}
                          >
                            {testimony.isAnonymous ? "?" : testimony.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p
                            className="font-body font-bold"
                            style={{ color: "#0a1a2f" }}
                          >
                            {testimony.isAnonymous ? "Anonymous" : testimony.name}
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

                    <div className="mt-6 pt-5 border-t border-[#f0f4f8] flex items-center justify-between">
                      <button
                        onClick={() => handleBlessed(testimony.id)}
                        disabled={hasBlessed}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-bold transition-colors ${
                          hasBlessed
                            ? "bg-[#1a6fb5]/10 text-[#1a6fb5] cursor-default"
                            : "bg-[#f0f4f8] hover:bg-[#1a6fb5] hover:text-white text-[#4a6580]"
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
                      <span className="text-sm font-body" style={{ color: "#4a6580" }}>
                        <span className="font-bold" style={{ color: "#1a6fb5" }}>
                          {testimony.blessedCount}
                        </span>{" "}
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
      <section className="py-20 md:py-32" style={{ background: "#f0f4f8" }}>
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 lg:px-16 text-center">
          <div className="bg-white rounded-2xl p-10 md:p-16 shadow-[0_2px_15px_rgba(26,111,181,0.06)]">
            <svg
              className="w-12 h-12 mx-auto mb-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: "#1a6fb5" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <blockquote
              className="text-3xl md:text-4xl lg:text-5xl font-display leading-[1.15] mb-8"
              style={{ fontWeight: 800, color: "#0a1a2f" }}
            >
              &ldquo;So then faith comes by hearing, and hearing by the word of God.&rdquo;
            </blockquote>
            <cite
              className="font-body font-bold text-base not-italic"
              style={{ color: "#1a6fb5" }}
            >
              &mdash; Romans 10:17 (NKJV)
            </cite>
          </div>
        </div>
      </section>
    </div>
  );
}
