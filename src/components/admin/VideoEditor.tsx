"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import type { TikTokVideo } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function parseVideoUrl(raw: string): { id: string; url: string } | null {
  try {
    const url = new URL(raw.trim());
    const match = url.pathname.match(/^\/@[a-zA-Z0-9._]+\/video\/(\d{1,30})\/?$/);
    if (url.protocol !== "https:" || !["tiktok.com", "www.tiktok.com"].includes(url.hostname) || url.username || url.password || url.port || !match) return null;
    return { id: match[1], url: `https://www.tiktok.com${url.pathname.replace(/\/$/, "")}` };
  } catch { return null; }
}

function readVideos(value: unknown): TikTokVideo[] | null {
  if (!value || typeof value !== "object" || !("tiktokVideos" in value) || !Array.isArray(value.tiktokVideos) || value.tiktokVideos.length > 100) return null;
  const videos: TikTokVideo[] = [];
  for (const item of value.tiktokVideos) {
    if (!item || typeof item !== "object" || typeof item.id !== "string" || item.id.length > 100 || typeof item.url !== "string" || typeof item.title !== "string" || item.title.length > 200) return null;
    const parsed = parseVideoUrl(item.url);
    if (!parsed) return null;
    videos.push({ id: item.id, url: parsed.url, title: item.title });
  }
  return videos;
}

function readRevision(value: unknown): number | null {
  if (!value || typeof value !== "object" || !("revision" in value)) return null;
  return typeof value.revision === "number" && Number.isSafeInteger(value.revision) && value.revision >= 0 ? value.revision : null;
}

export function VideoEditor({ token, logout }: { token: string; logout: () => void }) {
  const id = useId();
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [savedVideos, setSavedVideos] = useState<TikTokVideo[] | null>(null);
  const [savedRevision, setSavedRevision] = useState<number | null>(null);
  const [conflict, setConflict] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const loadRequest = useRef<AbortController | null>(null);
  const saveRequest = useRef<AbortController | null>(null);
  const urlInput = useRef<HTMLInputElement>(null);
  const dirty = savedVideos !== null && JSON.stringify(videos) !== JSON.stringify(savedVideos);

  const load = useCallback(async () => {
    loadRequest.current?.abort();
    const controller = new AbortController();
    loadRequest.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 12_000);
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/content?admin=1", { cache: "no-store", headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
      if (response.status === 401 || response.status === 403) { logout(); return; }
      if (!response.ok) throw new Error("Content unavailable");
      const content: unknown = await response.json();
      const loaded = readVideos(content);
      const revision = readRevision(content);
      if (loaded === null || revision === null) throw new Error("Saved videos were not readable");
      if (!controller.signal.aborted) { setVideos(loaded); setSavedVideos(loaded); setSavedRevision(revision); setConflict(false); setUrl(""); setTitle(""); setSuccess(""); }
    } catch {
      if (loadRequest.current === controller) setError("Your saved videos couldn’t be loaded. Try again before making changes.");
    } finally {
      window.clearTimeout(timeout);
      if (loadRequest.current === controller) { loadRequest.current = null; setLoading(false); }
    }
  }, [token, logout]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => { window.clearTimeout(timer); loadRequest.current?.abort(); saveRequest.current?.abort(); };
  }, [load]);

  const addVideo = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = parseVideoUrl(url);
    setError(""); setSuccess("");
    if (!parsed) { setError("Paste a full TikTok video link: https://www.tiktok.com/@your-name/video/123456789. Short share links won’t work here."); return; }
    if (videos.some((video) => parseVideoUrl(video.url)?.id === parsed.id)) { setError("That video is already in the list."); return; }
    if (videos.length >= 100) { setError("The list is full. Remove a video before adding another."); return; }
    setVideos((current) => [...current, { id: parsed.id, url: parsed.url, title: title.trim() }]);
    setUrl(""); setTitle(""); urlInput.current?.focus();
  };

  const removeVideo = (index: number) => {
    const video = videos[index];
    if (!window.confirm(`Remove ${video.title ? `“${video.title}”` : "this video"} from the website list? It will not be deleted from TikTok. Click Save videos to apply this change.`)) return;
    setVideos((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setSuccess(""); setError("");
  };

  const reloadSavedVideos = () => {
    if ((dirty || url.trim() || title.trim()) && !window.confirm("Reload the saved video list? Your unsaved changes in this tab will be replaced.")) return;
    void load();
  };

  const save = async () => {
    if (savedVideos === null || savedRevision === null || conflict || !dirty || saveRequest.current) return;
    if (url.trim()) { setError("Add the new link to the list before saving, or clear the link field."); urlInput.current?.focus(); return; }
    const requested = videos.map((video) => ({ ...video, title: video.title.trim() }));
    const controller = new AbortController();
    saveRequest.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 12_000);
    setSaving(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/content", { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "If-Match": String(savedRevision) }, body: JSON.stringify({ tiktokVideos: requested }), signal: controller.signal });
      if (response.status === 401 || response.status === 403) { logout(); return; }
      if (response.status === 409) { setConflict(true); return; }
      if (!response.ok) throw new Error("Save failed");
      const payload: unknown = await response.json();
      const confirmed = readVideos(payload);
      const revision = readRevision(payload);
      if (confirmed === null || revision === null || revision <= savedRevision || JSON.stringify(confirmed) !== JSON.stringify(requested)) throw new Error("Save not confirmed");
      if (!controller.signal.aborted) { setVideos(confirmed); setSavedVideos(confirmed); setSavedRevision(revision); setSuccess(confirmed.length ? "Videos saved. The homepage now uses this list." : "Videos saved. The homepage video list is now empty."); }
    } catch {
      if (saveRequest.current === controller) setError("Your video changes weren’t confirmed. They’re still here. Please try Save videos again.");
    } finally {
      window.clearTimeout(timeout);
      if (saveRequest.current === controller) { saveRequest.current = null; setSaving(false); }
    }
  };

  return <main className="min-h-screen bg-[#f0f4f8] pb-24 pt-24 text-[#0a1a2f]">
    <div className="mx-auto max-w-3xl px-4 sm:px-6">
      <Link className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#1a6fb5]" href="/admin"><ArrowLeft size={16} /> Back to Pastor’s desk</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-display text-4xl font-bold">Homepage videos</h1><p className="mt-3 max-w-lg leading-7 text-[#4a6580]">Choose the TikTok videos people see on the website. Add links to the list, then save your changes.</p></div><Button className="min-h-11" onClick={logout} variant="outline">Sign out</Button></div>
      {loading ? <p className="mt-8 flex min-h-40 items-center justify-center gap-3" role="status"><LoaderCircle className="size-6 animate-spin" /> Loading your videos…</p>
        : savedVideos === null ? <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm"><p className="leading-7 text-red-800" role="alert">{error || "Your saved videos aren’t available right now."}</p><Button className="mt-5 min-h-11" onClick={() => void load()} variant="outline">Try loading videos again</Button></div>
        : <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm sm:p-8" aria-label="Manage homepage videos">
          <fieldset disabled={saving}>
            <legend className="sr-only">Edit homepage videos</legend>
            {videos.length ? <ol className="space-y-5">{videos.map((video, index) => <li className="rounded-xl border border-[#dce8f2] p-4 sm:p-5" key={`${video.id}-${index}`}>
              <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Video {index + 1}</h2><Button aria-label={`Remove video ${index + 1}`} className="min-h-11 text-red-700" onClick={() => removeVideo(index)} variant="ghost"><Trash2 size={16} /> Remove</Button></div>
              <label className="mt-3 block text-sm font-semibold" htmlFor={`${id}-title-${index}`}>Title (optional)</label>
              <Input className="mt-2 h-12 px-3 text-base" id={`${id}-title-${index}`} maxLength={200} onChange={(event) => { setVideos((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item)); setSuccess(""); }} value={video.title} />
              <a className="mt-3 flex min-h-11 items-center gap-2 break-all text-sm leading-6 text-[#1a6fb5] underline underline-offset-4" href={video.url} rel="noopener noreferrer" target="_blank"><span className="min-w-0">{video.url}</span><ExternalLink className="size-4 shrink-0" aria-hidden="true" /></a>
            </li>)}</ol> : <p className="rounded-xl bg-[#f0f4f8] p-5 leading-7 text-[#4a6580]">No videos in the list. Add a TikTok link below, or save this empty list to remove videos from the homepage.</p>}
            <form className="mt-7 border-t border-[#dce8f2] pt-6" onSubmit={addVideo}>
              <h2 className="text-xl font-semibold">Add a video</h2>
              <p className="mt-2 text-sm leading-6 text-[#4a6580]">Open the video on TikTok in your browser and copy its full address. Use a link with /@name/video/ and the video number.</p>
              <label className="mt-4 block text-sm font-semibold" htmlFor={`${id}-url`}>TikTok video link</label>
              <Input className="mt-2 h-12 px-3 text-base" id={`${id}-url`} maxLength={2048} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.tiktok.com/@name/video/…" ref={urlInput} type="url" value={url} />
              <label className="mt-4 block text-sm font-semibold" htmlFor={`${id}-new-title`}>New video title (optional)</label>
              <Input className="mt-2 h-12 px-3 text-base" id={`${id}-new-title`} maxLength={200} onChange={(event) => setTitle(event.target.value)} value={title} />
              <Button className="mt-4 min-h-11" disabled={!url.trim()} type="submit" variant="outline"><Plus size={16} /> Add to list</Button>
            </form>
          </fieldset>
          {conflict && <div className="mt-5 rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-950" role="alert"><p>Videos were saved in another tab. Your changes are still here. Reload the saved list before saving again, so you can see the latest videos.</p><Button className="mt-3 min-h-11" onClick={reloadSavedVideos} type="button" variant="outline">Reload saved videos</Button></div>}
          {error && <p className="mt-5 rounded-lg bg-red-50 p-4 text-sm leading-6 text-red-800" role="alert">{error}</p>}
          {success && <p className="mt-5 rounded-lg bg-emerald-50 p-4 text-sm leading-6 text-emerald-800" role="status">{success}</p>}
          <div className="mt-7 border-t border-[#dce8f2] pt-6"><Button className="min-h-12 w-full bg-[#1a6fb5] text-white sm:w-auto" disabled={saving || conflict || !dirty} onClick={() => void save()} type="button"><Save size={17} /> {saving ? "Saving videos…" : "Save videos"}</Button><p className="mt-3 text-sm text-[#4a6580]">{conflict ? "Reload the saved list to continue." : dirty ? "You have changes to save." : "Your list is up to date."}</p></div>
        </section>}
    </div>
  </main>;
}
