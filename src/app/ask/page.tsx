"use client";

import { useState, useRef } from "react";

interface ScriptureResponse {
  scripture: {
    text: string;
    reference: string;
  };
  story: string;
  exploreMore: {
    reference: string;
    description: string;
  }[];
}

export default function AskPage() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<ScriptureResponse | null>(null);
  const [userQuestion, setUserQuestion] = useState("");
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "success" | "error">("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const question = input.trim();
    setUserQuestion(question);
    setInput("");
    setError("");
    setIsLoading(true);
    setShowSharePrompt(false);
    setShareStatus("idle");

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });

      if (res.ok) {
        const data: ScriptureResponse = await res.json();
        setResponse(data);
      } else {
        setError(
          "Unable to seek Scripture right now. Please try again, or visit our Prayer Wall where our community can support you."
        );
      }
    } catch {
      setError(
        "Unable to connect right now. Please try again in a moment."
      );
    }

    setIsLoading(false);
  };

  const handleShare = async () => {
    if (!response) return;

    try {
      await fetch("/api/ask/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: userQuestion.substring(0, 100),
          scripture: response.scripture.reference,
        }),
      });
      setShareStatus("success");
      setTimeout(() => setShowSharePrompt(false), 2000);
    } catch {
      setShareStatus("error");
    }
  };

  const handleAskAgain = () => {
    setResponse(null);
    setUserQuestion("");
    setError("");
    setShowSharePrompt(false);
    setShareStatus("idle");
    // Focus the textarea after state updates
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const hasResponse = response !== null;

  return (
    <div className="min-h-screen bg-white">
      {/* Subtle paper texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Warm gradient accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-water/[0.04] to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-deep/[0.03] to-transparent rounded-full blur-3xl" />
      </div>

      {!hasResponse && !isLoading ? (
        /* INPUT STATE */
        <div className="relative min-h-screen flex items-center justify-center px-4 pt-16 pb-8">
          <div className="max-w-xl w-full">
            {/* Header */}
            <div className="text-center mb-12">
              {/* Decorative element */}
              <div className="mb-8 flex justify-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-water/10 to-deep/5 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-water/60"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <h1 className="font-display text-4xl md:text-5xl font-semibold text-deep tracking-tight">
                Ask The Word
              </h1>

              <p className="mt-4 text-xl text-text-body font-light">
                What&apos;s weighing on you today?
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Share what's on your heart..."
                  rows={5}
                  className="w-full px-6 py-5 text-lg bg-white rounded-2xl border border-border-light/40 focus:border-water/40 focus:ring-0 outline-none transition-all resize-none shadow-sm placeholder:text-text-light/50 text-deep leading-relaxed"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
              </div>

              <div className="mt-6 text-center">
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="inline-flex items-center gap-3 bg-deep text-white px-8 py-4 rounded-full font-medium text-lg hover:bg-deep/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Seek Scripture</span>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>
              </div>
            </form>

            {/* Privacy note */}
            <p className="mt-10 text-center text-sm text-text-light/60 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Your reflection is private and not stored
            </p>

            {/* Error */}
            {error && (
              <div className="mt-6 text-center">
                <p className="text-red-600/80 text-sm bg-red-50 rounded-xl px-6 py-4 inline-block">
                  {error}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : isLoading ? (
        /* LOADING STATE */
        <div className="relative min-h-screen flex items-center justify-center px-4 pt-16">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-2 border-water/10" />
              <div
                className="absolute inset-0 rounded-full border-2 border-water/30 border-t-water animate-spin"
                style={{ animationDuration: "1.5s" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-water/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </div>
            <p className="text-text-light text-lg font-light">Seeking Scripture for you...</p>
          </div>
        </div>
      ) : response ? (
        /* RESPONSE STATE */
        <div className="relative min-h-screen pt-24 pb-16 px-4">
          <div className="max-w-2xl mx-auto">
            {/* SECTION 1: Scripture for You */}
            <section className="mb-16">
              <div className="text-center mb-6">
                <span className="text-xs uppercase tracking-[0.25em] text-water/70 font-medium">
                  Scripture for You
                </span>
              </div>

              {/* Scripture Card - Hero */}
              <div className="relative">
                {/* Card background layers for depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-water/[0.02] to-deep/[0.02] rounded-3xl transform rotate-1" />
                <div className="absolute inset-0 bg-white rounded-3xl shadow-xl shadow-deep/[0.03]" />

                {/* Card content */}
                <div className="relative px-8 py-12 md:px-12 md:py-16">
                  {/* Decorative quote */}
                  <div className="absolute top-6 left-6 text-7xl text-water/[0.08] font-serif leading-none select-none">
                    &ldquo;
                  </div>

                  {/* Scripture text */}
                  <blockquote className="relative z-10">
                    <p className="font-serif text-2xl md:text-3xl text-deep leading-relaxed text-center">
                      {response.scripture.text}
                    </p>
                  </blockquote>

                  {/* Reference */}
                  <div className="mt-8 text-center">
                    <span className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-water/10 to-water/5 text-water font-medium rounded-full">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      {response.scripture.reference}
                    </span>
                  </div>

                  {/* Decorative quote closing */}
                  <div className="absolute bottom-6 right-6 text-7xl text-water/[0.08] font-serif leading-none select-none rotate-180">
                    &ldquo;
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: The Story */}
            <section className="mb-16">
              <div className="text-center mb-6">
                <span className="text-xs uppercase tracking-[0.25em] text-deep/60 font-medium">
                  Why This Speaks
                </span>
              </div>

              <div className="bg-deep/[0.03] rounded-2xl px-8 py-8 border border-deep/[0.08]">
                <p className="text-lg text-deep/80 leading-relaxed text-center font-light">
                  {response.story}
                </p>
              </div>
            </section>

            {/* SECTION 3: Explore More */}
            <section className="mb-16">
              <div className="text-center mb-6">
                <span className="text-xs uppercase tracking-[0.25em] text-text-light/70 font-medium">
                  Explore More
                </span>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {response.exploreMore.map((item, index) => (
                  <div
                    key={index}
                    className="group bg-white rounded-xl p-5 border border-border-light/30 hover:border-water/20 hover:shadow-md transition-all cursor-pointer"
                  >
                    <p className="font-medium text-deep group-hover:text-water transition-colors">
                      {item.reference}
                    </p>
                    <p className="mt-2 text-sm text-text-light leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Share Prompt */}
            {!showSharePrompt && shareStatus !== "success" && (
              <div className="text-center mb-8">
                <button
                  onClick={() => setShowSharePrompt(true)}
                  className="text-sm text-text-light/70 hover:text-text-body transition-colors underline underline-offset-4 decoration-text-light/40 hover:decoration-text-body/40"
                >
                  Share this topic with Pastor Mike
                </button>
              </div>
            )}

            {showSharePrompt && shareStatus === "idle" && (
              <div className="bg-sky/50 rounded-2xl p-6 mb-8 text-center">
                <p className="text-sm text-text-body mb-4">
                  Anonymously share the topic of your reflection? It helps Pastor Mike understand what our community is walking through.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleShare}
                    className="bg-water/10 text-water px-5 py-2 rounded-full text-sm font-medium hover:bg-water/20 transition-colors"
                  >
                    Share Anonymously
                  </button>
                  <button
                    onClick={() => setShowSharePrompt(false)}
                    className="text-text-light/70 px-5 py-2 rounded-full text-sm hover:text-text-body transition-colors"
                  >
                    No thanks
                  </button>
                </div>
              </div>
            )}

            {shareStatus === "success" && (
              <div className="text-center mb-8">
                <p className="text-water text-sm flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Thank you for sharing
                </p>
              </div>
            )}

            {/* Ask Again Button */}
            <div className="text-center">
              <button
                onClick={handleAskAgain}
                className="inline-flex items-center gap-2 bg-deep text-white px-8 py-4 rounded-full font-medium hover:bg-deep/90 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Ask Again</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
