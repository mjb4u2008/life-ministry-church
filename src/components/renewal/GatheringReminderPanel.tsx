"use client";

import { useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { ReminderSignup } from "@/components/ReminderSignup";

export function GatheringReminderPanel() {
  const disclosure = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const reveal = () => {
      if (window.location.hash === "#reminded" && disclosure.current) disclosure.current.open = true;
    };
    const followReminderLink = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const url = new URL(anchor.href);
      if (url.origin === window.location.origin && url.pathname === window.location.pathname && url.hash === "#reminded" && disclosure.current) disclosure.current.open = true;
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    document.addEventListener("click", followReminderLink);
    return () => {
      window.removeEventListener("hashchange", reveal);
      document.removeEventListener("click", followReminderLink);
    };
  }, []);

  return <section className="renewal-reminder-disclosure" id="reminded" aria-label="Gathering reminders">
    <details ref={disclosure}>
      <summary><span>Gathering reminders</span><Plus aria-hidden="true" size={24} strokeWidth={1.25} /></summary>
      <div className="renewal-reminder-reveal">
        <p>We’ll send you a little reminder before we gather. Choose email or text, and make room for the Word in your week.</p>
        <ReminderSignup signupContext="homepage" />
      </div>
    </details>
  </section>;
}
