"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";
import type { TikTokVideo } from "@/lib/data";
import styles from "./TikTokCarousel.module.css";

interface TikTokCarouselProps {
  videos: TikTokVideo[];
  tiktokProfileUrl?: string;
  embedded?: boolean;
}

interface DataConnection extends EventTarget { saveData?: boolean }
const PLAYER_ORIGIN = "https://www.tiktok.com";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function connection() {
  return (navigator as Navigator & { connection?: DataConnection }).connection;
}

function subscribePreferences(callback: () => void) {
  const media = window.matchMedia?.(REDUCED_MOTION);
  const network = connection();
  media?.addEventListener?.("change", callback);
  network?.addEventListener?.("change", callback);
  return () => {
    media?.removeEventListener?.("change", callback);
    network?.removeEventListener?.("change", callback);
  };
}

function autoplayAllowed() {
  return !window.matchMedia?.(REDUCED_MOTION).matches && !connection()?.saveData;
}

function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

function safeTikTokUrl(value?: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["tiktok.com", "www.tiktok.com"].includes(url.hostname) && !url.username && !url.password && !url.port ? url.href : null;
  } catch { return null; }
}

function videoIdFromUrl(url: string | null): string | null {
  return url ? new URL(url).pathname.match(/^\/@[^/]+\/video\/(\d+)\/?$/)?.[1] ?? null : null;
}

function TikTokPlayer({ video }: { video: TikTokVideo }) {
  const cardRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const playIntentRef = useRef(false);
  const allowAutoplay = useSyncExternalStore(subscribePreferences, autoplayAllowed, () => false);
  const documentVisible = useSyncExternalStore(subscribeVisibility, () => document.visibilityState !== "hidden", () => true);
  const [nearViewport, setNearViewport] = useState(false);
  const [visible, setVisible] = useState(false);
  const [manuallyLoaded, setManuallyLoaded] = useState(false);
  const [pausedByUser, setPausedByUser] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [playerState, setPlayerState] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const permalink = safeTikTokUrl(video.url);
  const postId = videoIdFromUrl(permalink);
  const shouldLoad = Boolean(postId) && (manuallyLoaded || (nearViewport && allowAutoplay));
  const shouldPlay = shouldLoad && visible && documentVisible && !pausedByUser;
  const playing = shouldPlay && playerState !== 0 && playerState !== 2;
  const title = video.title.trim() || "A message from Pastor Mike";

  // The outer observer warms the player near the rail. The second observer
  // pauses it when its actual card leaves the viewport, including horizontal scroll.
  useEffect(() => {
    const card = cardRef.current;
    if (!card || typeof IntersectionObserver === "undefined") return;
    const near = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setNearViewport(true);
    }, { rootMargin: "120px" });
    const onScreen = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.3);
    }, { threshold: [0, 0.3] });
    near.observe(card);
    onScreen.observe(card);
    return () => { near.disconnect(); onScreen.disconnect(); };
  }, []);

  useEffect(() => {
    const receiveMessage = (event: MessageEvent) => {
      if (event.origin !== PLAYER_ORIGIN || event.source !== frameRef.current?.contentWindow) return;
      const data: unknown = event.data;
      if (!data || typeof data !== "object" || !("x-tiktok-player" in data) || data["x-tiktok-player"] !== true || !("type" in data)) return;
      if (data.type === "onPlayerReady") {
        setReady(true);
        const player = frameRef.current?.contentWindow;
        player?.postMessage({ type: "mute", "x-tiktok-player": true }, PLAYER_ORIGIN);
        player?.postMessage({ type: playIntentRef.current ? "play" : "pause", "x-tiktok-player": true }, PLAYER_ORIGIN);
      }
      if (data.type === "onStateChange" && "value" in data && typeof data.value === "number") setPlayerState(data.value);
      if (data.type === "onPlayerError" || data.type === "onError") setFailed(true);
    };
    window.addEventListener("message", receiveMessage);
    return () => window.removeEventListener("message", receiveMessage);
  }, []);

  useEffect(() => {
    if (!shouldLoad || ready || failed) return;
    const timeout = window.setTimeout(() => setFailed(true), 12_000);
    return () => window.clearTimeout(timeout);
  }, [shouldLoad, ready, failed, attempt]);

  useEffect(() => {
    playIntentRef.current = shouldPlay;
    if (!ready || failed) return;
    const player = frameRef.current?.contentWindow;
    player?.postMessage({ type: "mute", "x-tiktok-player": true }, PLAYER_ORIGIN);
    player?.postMessage({ type: shouldPlay ? "play" : "pause", "x-tiktok-player": true }, PLAYER_ORIGIN);
  }, [ready, shouldPlay, failed]);

  const togglePlayback = () => {
    if (!playing) {
      setManuallyLoaded(true);
      setPausedByUser(false);
      setPlayerState(null);
      // A click is an explicit playback request, also in browsers without observers.
      setVisible(true);
      if (ready) frameRef.current?.contentWindow?.postMessage({ type: "play", "x-tiktok-player": true }, PLAYER_ORIGIN);
    } else {
      setPausedByUser(true);
    }
  };

  const retryPlayer = () => {
    setReady(false);
    setPlayerState(null);
    setFailed(false);
    setAttempt((value) => value + 1);
    setManuallyLoaded(true);
    setPausedByUser(false);
  };

  return (
    <article className={styles.card} ref={cardRef}>
      <div className={styles.player}>
        {shouldLoad && !failed ? <iframe
          allow="autoplay; fullscreen"
          allowFullScreen
          className={styles.frame}
          key={attempt}
          onError={() => setFailed(true)}
          ref={frameRef}
          referrerPolicy="strict-origin-when-cross-origin"
          src={`${PLAYER_ORIGIN}/player/v1/${postId}?autoplay=${allowAutoplay ? 1 : 0}&muted=1&loop=1&controls=1&description=0&music_info=0&rel=0`}
          title={title}
        /> : <div className={styles.playerFallback}>
          <Play aria-hidden="true" size={36} strokeWidth={1.1} />
          <p>{!postId ? "This video link isn’t available." : failed ? "We can’t play this video here. Open it on TikTok, or try the player again." : "A moment in the Word with Pastor Mike."}</p>
          {failed && postId && <button className={styles.retryButton} onClick={retryPlayer} type="button">Try player again</button>}
        </div>}
      </div>
      <div className={styles.caption}>
        <h3>{title}</h3>
        {postId && !failed && <button
          aria-label={`${playing ? "Pause" : "Play"} video: ${title}`}
          className={styles.playButton}
          onClick={togglePlayback}
          type="button"
        >{playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}{playing ? "Pause" : "Play"}</button>}
      </div>
      {permalink && <a className={styles.permalink} href={permalink} rel="noopener noreferrer" target="_blank">Open this video on TikTok <ArrowUpRight size={16} aria-hidden="true" /></a>}
    </article>
  );
}

export function TikTokCarousel({ videos, tiktokProfileUrl, embedded = false }: TikTokCarouselProps) {
  const headingId = useId();
  const railId = useId();
  const railRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ left: false, right: false });
  const profileUrl = safeTikTokUrl(tiktokProfileUrl);

  const updateScroll = () => {
    if (!railRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = railRef.current;
    setScrollState({ left: scrollLeft > 2, right: scrollLeft < scrollWidth - clientWidth - 2 });
  };

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const frame = window.requestAnimationFrame(updateScroll);
    const resize = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateScroll) : null;
    resize?.observe(rail);
    window.addEventListener("resize", updateScroll);
    return () => { window.cancelAnimationFrame(frame); resize?.disconnect(); window.removeEventListener("resize", updateScroll); };
  }, [videos.length]);

  const scroll = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    const distance = rail.firstElementChild?.getBoundingClientRect().width ?? 320;
    rail.scrollBy({ left: direction * (distance + 24), behavior: autoplayAllowed() ? "smooth" : "auto" });
  };

  return (
    <section aria-label={embedded ? "Messages from Pastor Mike" : undefined} aria-labelledby={embedded ? undefined : headingId} className={`${styles.section} ${embedded ? styles.embedded : ""}`}>
      {!embedded && <div className={styles.heading}>
        <div>
          <h2 id={headingId}>A word for your everyday.</h2>
          <p>Scripture and encouragement from Pastor Mike, wherever the week finds you.</p>
        </div>
        {profileUrl && <a className={styles.profileLink} href={profileUrl} target="_blank" rel="noopener noreferrer">Visit Pastor Mike on TikTok <ArrowUpRight size={18} aria-hidden="true" /></a>}
      </div>}
      {videos.length ? <>
        <div aria-label="Pastor Mike’s videos" className={styles.rail} id={railId} onScroll={updateScroll} ref={railRef} role="region" tabIndex={0}>
          {videos.map((video) => <TikTokPlayer key={`${video.id}-${video.url}`} video={video} />)}
        </div>
        <div className={styles.railFooter}>
          <p>Videos play silently. Open a video on TikTok to listen.</p>
          {videos.length > 1 && <div className={styles.scrollControls}>
            <button aria-controls={railId} aria-label="Previous video" disabled={!scrollState.left} onClick={() => scroll(-1)} type="button"><ArrowLeft size={20} aria-hidden="true" /></button>
            <button aria-controls={railId} aria-label="Next video" disabled={!scrollState.right} onClick={() => scroll(1)} type="button"><ArrowRight size={20} aria-hidden="true" /></button>
          </div>}
        </div>
      </> : <div className={styles.empty}><p>Pastor Mike’s videos will appear here when they’re added.</p><p>In the meantime, join us for the next gathering or explore a message.</p><a className={styles.profileLink} href="/watch">Join or watch a gathering <ArrowUpRight size={18} aria-hidden="true" /></a></div>}
      {embedded && profileUrl && <a className={styles.profileLink} href={profileUrl} target="_blank" rel="noopener noreferrer">Visit Pastor Mike on TikTok <ArrowUpRight size={18} aria-hidden="true" /></a>}
    </section>
  );
}
