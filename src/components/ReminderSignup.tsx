"use client";

import { useState } from "react";

export function ReminderSignup() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [contactType, setContactType] = useState<"email" | "phone">("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [consent, setConsent] = useState(false);

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
          consent,
          signupContext: "reminder-form",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setName("");
        setContact("");
        setConsent(false);
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
      <div className="animate-fade-in border-2 life-modernist-rule bg-[var(--modernist-paper)] p-7 text-center text-[var(--modernist-ink)] sm:p-9" role="status">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center bg-[var(--modernist-blue)]">
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
        <h3 className="mb-2 text-2xl font-extrabold">
          You&apos;re all set.
        </h3>
        <p className="text-[var(--modernist-ink)]/70">
          We&apos;ll remind you before the next service.
        </p>
      </div>
    );
  }

  return (
    <div className="border-2 life-modernist-rule bg-[var(--modernist-paper)] p-6 text-[var(--modernist-ink)] sm:p-8">
      <div className="mb-7">
        <div className="mb-4 flex size-12 items-center justify-center border-2 border-[var(--modernist-blue)]">
          <svg
            className="size-6 text-[var(--modernist-blue)]"
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
        <h3 className="text-3xl font-extrabold tracking-[-0.035em]">
          Get a reminder
        </h3>
        <p className="mt-2 text-base text-[var(--modernist-ink)]/70">
          We&apos;ll send one before the next gathering begins.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block text-sm font-bold" htmlFor="reminder-name">
          Name
          <input
            id="reminder-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="mt-2 min-h-12 w-full border-2 life-modernist-rule bg-white px-4 py-3 text-base outline-none transition-colors focus:border-[var(--modernist-blue)]"
            required
          />
        </label>

        {/* Contact Type Toggle */}
        <div className="flex border-2 life-modernist-rule bg-[var(--modernist-panel)] p-1" aria-label="Reminder type" role="group">
          <button
            type="button"
            onClick={() => setContactType("email")}
            aria-pressed={contactType === "email"}
            className={`min-h-11 flex-1 px-3 py-2 text-sm font-bold transition-colors ${
              contactType === "email"
                ? "bg-[var(--modernist-ink)] text-white"
                : "text-[var(--modernist-ink)]/65 hover:text-[var(--modernist-ink)]"
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setContactType("phone")}
            aria-pressed={contactType === "phone"}
            className={`min-h-11 flex-1 px-3 py-2 text-sm font-bold transition-colors ${
              contactType === "phone"
                ? "bg-[var(--modernist-ink)] text-white"
                : "text-[var(--modernist-ink)]/65 hover:text-[var(--modernist-ink)]"
            }`}
          >
            Text Me
          </button>
        </div>

        <label className="block text-sm font-bold" htmlFor="reminder-contact">
          {contactType === "email" ? "Email" : "Phone number"}
          <input
            id="reminder-contact"
            type={contactType === "email" ? "email" : "tel"}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            autoComplete={contactType === "email" ? "email" : "tel"}
            className="mt-2 min-h-12 w-full border-2 life-modernist-rule bg-white px-4 py-3 text-base outline-none transition-colors focus:border-[var(--modernist-blue)]"
            required
          />
        </label>

        {status === "error" && (
          <p aria-live="polite" className="border-2 border-red-700 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>
        )}

        <label className="flex items-start gap-3 text-sm leading-relaxed text-[var(--modernist-ink)]/72">
          <input
            checked={consent}
            className="mt-0.5 size-5 shrink-0 accent-[var(--modernist-blue)]"
            onChange={(event) => setConsent(event.target.checked)}
            required
            type="checkbox"
          />
          <span>
            I agree to receive {contactType === "email" ? "email" : "text"} reminders from L.I.F.E. Ministry. I can opt out anytime.
          </span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting || !name.trim() || !contact.trim() || !consent}
          className="min-h-13 w-full bg-[var(--modernist-blue)] px-6 py-3 font-extrabold text-white transition-colors hover:bg-[var(--modernist-deep-blue)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Signing up..." : "Remind Me"}
        </button>
      </form>
    </div>
  );
}
