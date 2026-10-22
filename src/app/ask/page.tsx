"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, BookOpen, LoaderCircle } from "lucide-react";
import styles from "./page.module.css";

interface ScriptureResponse {
  scripture: { text: string; reference: string };
  story: string;
  exploreMore: { reference: string; description: string }[];
}

const REQUEST_TIMEOUT_MS = 30_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isScriptureResponse(value: unknown): value is ScriptureResponse {
  return isRecord(value) && isRecord(value.scripture) &&
    isText(value.scripture.text) && isText(value.scripture.reference) &&
    isText(value.story) && Array.isArray(value.exploreMore) &&
    value.exploreMore.length > 0 && value.exploreMore.every((item) =>
      isRecord(item) && isText(item.reference) && isText(item.description));
}

export default function AskPage() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<ScriptureResponse | null>(null);
  const [userQuestion, setUserQuestion] = useState("");
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const answerHeadingRef = useRef<HTMLHeadingElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const shareRequestRef = useRef<AbortController | null>(null);

  useEffect(() => () => {
    requestRef.current?.abort();
    shareRequestRef.current?.abort();
  }, []);

  useEffect(() => {
    if (response) answerHeadingRef.current?.focus();
  }, [response]);

  const seekScripture = async () => {
    const question = input.trim();
    if (!question || requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    shareRequestRef.current?.abort();
    shareRequestRef.current = null;
    setUserQuestion(question);
    setError("");
    setResponse(null);
    setIsLoading(true);
    setShowSharePrompt(false);
    setShareStatus("idle");
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Scripture request failed");
      const data: unknown = await res.json();
      if (!isScriptureResponse(data)) throw new Error("Scripture response was incomplete");
      if (!controller.signal.aborted) setResponse(data);
    } catch {
      setError("We couldn’t load a Scripture reflection. Your question is still here. Please try again, or ask our community for prayer.");
    } finally {
      window.clearTimeout(timeout);
      requestRef.current = null;
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!response || shareRequestRef.current || shareStatus === "success") return;
    const controller = new AbortController();
    shareRequestRef.current = controller;
    setShareStatus("sending");
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch("/api/ask/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: userQuestion.substring(0, 100), scripture: response.scripture.reference }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Sharing failed");
      const receipt: unknown = await res.json();
      if (!isRecord(receipt) || receipt.success !== true) throw new Error("Sharing was not confirmed");
      if (!controller.signal.aborted) setShareStatus("success");
    } catch {
      if (shareRequestRef.current === controller) setShareStatus("error");
    } finally {
      window.clearTimeout(timeout);
      if (shareRequestRef.current === controller) shareRequestRef.current = null;
    }
  };

  const askAgain = () => {
    shareRequestRef.current?.abort();
    shareRequestRef.current = null;
    setResponse(null);
    setInput("");
    setUserQuestion("");
    setError("");
    setShowSharePrompt(false);
    setShareStatus("idle");
    textareaRef.current?.focus();
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.introduction}>
          <BookOpen className={styles.book} aria-hidden="true" strokeWidth={1.2} />
          <h1 className={styles.title}>Ask the Word.</h1>
          <p>Bring what’s on your heart.<br />Find a place to begin in Scripture.</p>
        </header>

        <form className={styles.form} onSubmit={(event) => { event.preventDefault(); void seekScripture(); }} aria-busy={isLoading}>
          <label htmlFor="scripture-question" className={styles.inputLabel}>What’s on your heart?</label>
          <textarea
            className={styles.input}
            disabled={isLoading}
            id="scripture-question"
            maxLength={4000}
            onChange={(event) => setInput(event.target.value)}
            placeholder="I’m looking for peace. I’m finding it hard to forgive. I have a question about faith…"
            ref={textareaRef}
            rows={5}
            value={input}
            aria-describedby="question-help"
          />
          <div className={styles.formFooter}>
            <p id="question-help">A quiet moment with the Word. You don’t need the perfect words.</p>
            <button className={styles.primaryButton} disabled={!input.trim() || isLoading} type="submit">
              {isLoading ? <><LoaderCircle className={styles.spinner} aria-hidden="true" /> Seeking Scripture…</> : <>Seek Scripture <ArrowUpRight aria-hidden="true" size={20} /></>}
            </button>
          </div>
        </form>

        {isLoading && <p className={styles.loading} role="status">Seeking Scripture for you. This may take a moment.</p>}
        {error && <div className={styles.error} role="alert">
          <p>{error}</p>
          <div className={styles.actions}>
            <button className={styles.secondaryButton} onClick={() => void seekScripture()} type="button">Try again</button>
            <Link className={styles.textLink} href="/community">Ask for prayer</Link>
          </div>
        </div>}

        {response && <div className={styles.answer}>
          <section aria-labelledby="scripture-answer-heading">
            <h2 className={styles.sectionHeading} id="scripture-answer-heading" ref={answerHeadingRef} tabIndex={-1}>Scripture for you</h2>
            <blockquote className={styles.scripture}>
              <p>
                <span className={styles.srOnly}>{response.scripture.text}</span>
                <span aria-hidden="true">{response.scripture.text.split(/\s+/).map((word, index) => <span className={styles.word} key={index} style={{ animationDelay: `${Math.min(index * 0.035, 1.4)}s` }}>{word}{" "}</span>)}</span>
              </p>
              <cite>{response.scripture.reference}</cite>
            </blockquote>
          </section>

          <section className={styles.explanation} aria-labelledby="reflection-heading">
            <h2 className={styles.sectionHeading} id="reflection-heading">A moment to reflect</h2>
            <p>{response.story}</p>
          </section>

          <section className={styles.explore} aria-labelledby="explore-heading">
            <h2 className={styles.sectionHeading} id="explore-heading">Stay in the Word</h2>
            <ul>{response.exploreMore.map((item, index) => <li key={`${item.reference}-${index}`}><h3>{item.reference}</h3><p>{item.description}</p></li>)}</ul>
          </section>

          <div className={styles.sharing}>
            {!showSharePrompt && shareStatus !== "success" && <button className={styles.textLink} onClick={() => setShowSharePrompt(true)} type="button">Share this topic with Pastor Mike</button>}
            {showSharePrompt && shareStatus !== "success" && <>
              <p>Share the first 100 characters of your question and the Scripture reference with Pastor Mike? We don’t add your name or contact details. Your question may still include personal information, so leave out anything you would prefer to keep private.</p>
              <div className={styles.actions}>
                <button className={styles.secondaryButton} disabled={shareStatus === "sending"} onClick={() => void handleShare()} type="button">{shareStatus === "sending" ? "Sharing…" : "Share anonymously"}</button>
                <button className={styles.textLink} disabled={shareStatus === "sending"} onClick={() => { setShowSharePrompt(false); setShareStatus("idle"); }} type="button">No thanks</button>
              </div>
              {shareStatus === "error" && <p role="alert">Your topic wasn’t shared. Please try again.</p>}
            </>}
            {shareStatus === "success" && <p role="status">Thank you for sharing. Your topic was saved for Pastor Mike.</p>}
          </div>
          <button className={styles.secondaryButton} onClick={askAgain} type="button">Ask another question</button>
        </div>}

        <p className={styles.note}>An AI-assisted reflection to help you explore Scripture. For a personal conversation, <Link href="/welcome">reach out to Pastor Mike</Link>.</p>
      </div>
    </main>
  );
}
