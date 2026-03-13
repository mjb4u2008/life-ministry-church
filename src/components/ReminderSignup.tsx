"use client";

import { useState } from "react";

export function ReminderSignup() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [contactType, setContactType] = useState<"email" | "phone">("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim()) return;

    setIsSubmitting(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contactType,
          contact: contact.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setName("");
        setContact("");
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Something went wrong");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Connection error. Please try again.");
    }

    setIsSubmitting(false);
  };

  if (status === "success") {
    return (
      <div className="bg-sky rounded-2xl p-6 text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-water flex items-center justify-center">
          <svg
            className="w-8 h-8 text-white"
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
        </div>
        <h3 className="font-display text-xl font-semibold text-deep mb-2">
          You&apos;re All Set!
        </h3>
        <p className="text-text-body">
          We&apos;ll remind you before the next service.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-cloud rounded-2xl p-6 shadow-lg shadow-water/10">
      <div className="text-center mb-6">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-water/10 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-water"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>
        <h3 className="font-display text-xl font-semibold text-deep">
          Get Reminded
        </h3>
        <p className="text-text-body text-sm mt-1">
          We&apos;ll send you a reminder before we go live
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 rounded-xl border border-border-light focus:border-water focus:ring-2 focus:ring-water/20 outline-none transition-colors bg-white"
            required
          />
        </div>

        {/* Contact Type Toggle */}
        <div className="flex gap-2 p-1 bg-white rounded-xl">
          <button
            type="button"
            onClick={() => setContactType("email")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              contactType === "email"
                ? "bg-water text-white"
                : "text-text-body hover:text-deep"
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setContactType("phone")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              contactType === "phone"
                ? "bg-water text-white"
                : "text-text-body hover:text-deep"
            }`}
          >
            Text Me
          </button>
        </div>

        <div>
          <input
            type={contactType === "email" ? "email" : "tel"}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder={contactType === "email" ? "your@email.com" : "Your phone number"}
            className="w-full px-4 py-3 rounded-xl border border-border-light focus:border-water focus:ring-2 focus:ring-water/20 outline-none transition-colors bg-white"
            required
          />
        </div>

        {status === "error" && (
          <p className="text-red-500 text-sm text-center">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !name.trim() || !contact.trim()}
          className="w-full bg-water text-white font-semibold py-3 rounded-xl hover:bg-water-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Signing up..." : "Remind Me"}
        </button>
      </form>
    </div>
  );
}
