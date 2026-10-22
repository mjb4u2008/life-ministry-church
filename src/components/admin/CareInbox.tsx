"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, HeartHandshake, LoaderCircle, Mail, Phone, Save } from "lucide-react";
import type { CareRecord, CareStatus, CareStoreV1 } from "@/lib/care";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Filter = "new" | "follow-up" | "done";

function belongs(record: CareRecord, filter: Filter) {
  if (filter === "new") return record.careStatus === "new";
  if (filter === "done") return record.careStatus === "answered" || record.careStatus === "closed";
  return record.careStatus === "contacted" || record.careStatus === "ongoing";
}

function CareCard({
  record,
  revision,
  token,
  onSaved,
  onUnauthorized,
}: {
  record: CareRecord;
  revision: number;
  token: string;
  onSaved: (store: CareStoreV1) => void;
  onUnauthorized: () => void;
}) {
  const [careStatus, setCareStatus] = useState<CareStatus>(record.careStatus);
  const [urgency, setUrgency] = useState(record.urgency);
  const [moderationStatus, setModerationStatus] = useState(record.moderationStatus);
  const [assignee, setAssignee] = useState(record.assignee ?? "");
  const [followUpAt, setFollowUpAt] = useState(record.followUpAt?.slice(0, 16) ?? "");
  const [privateNotes, setPrivateNotes] = useState(record.privateNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/care", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: record.id,
          expectedRevision: revision,
          updates: {
            careStatus,
            urgency,
            moderationStatus,
            assignee,
            followUpAt: followUpAt ? new Date(followUpAt).toISOString() : "",
            privateNotes,
          },
        }),
      });
      if (response.status === 401 || response.status === 403) {
        onUnauthorized();
        return;
      }
      const payload = await response.json();
      if (!response.ok) throw new Error(response.status === 409 ? "Inbox changed. Reload and try again." : payload.error || "Save failed");
      onSaved(payload as CareStoreV1);
      setMessage("Saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const mayPublish = record.kind === "prayer" && record.visibility === "public";
  return (
    <article className="rounded-2xl border border-[#dce8f2] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#eaf4fb] px-3 py-1 text-xs font-bold uppercase text-[#1a6fb5]">{record.kind === "visitor" ? "First-time visitor" : "Prayer"}</span>
            <span className="rounded-full bg-[#f0f4f8] px-3 py-1 text-xs font-bold uppercase text-[#4a6580]">{record.visibility}</span>
            {record.urgency === "urgent" && <span className="flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase text-red-700"><AlertTriangle className="size-3" /> Urgent</span>}
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold text-[#0a1a2f]">{record.name || "Anonymous"}</h2>
          <p className="mt-1 font-body text-xs text-[#4a6580]">Received {new Date(record.createdAt).toLocaleString()}</p>
        </div>
      </div>
      <p className="mt-5 whitespace-pre-wrap rounded-xl bg-[#f7fafc] p-4 font-body leading-relaxed text-[#0a1a2f]">{record.message}</p>
      {(record.email || record.phone) && (
        <div className="mt-4 flex flex-wrap gap-3">
          {record.email && <a className="inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 font-body text-sm font-bold text-[#1a6fb5]" href={`mailto:${record.email}`}><Mail className="size-4" /> Email</a>}
          {record.phone && <a className="inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 font-body text-sm font-bold text-[#1a6fb5]" href={`tel:${record.phone}`}><Phone className="size-4" /> Call</a>}
        </div>
      )}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="font-body text-sm font-bold">Care status
          <select className="mt-2 h-12 w-full rounded-lg border border-input bg-white px-4 text-base" onChange={(event) => setCareStatus(event.target.value as CareStatus)} value={careStatus}>
            <option value="new">New</option><option value="contacted">Contacted</option><option value="ongoing">Follow-up</option><option value="answered">Answered</option><option value="closed">Done</option>
          </select>
        </label>
        <label className="font-body text-sm font-bold">Priority
          <select className="mt-2 h-12 w-full rounded-lg border border-input bg-white px-4 text-base" onChange={(event) => setUrgency(event.target.value as "normal" | "urgent")} value={urgency}>
            <option value="normal">Normal</option><option value="urgent">Urgent</option>
          </select>
        </label>
        <label className="font-body text-sm font-bold">Public wall review
          <select className="mt-2 h-12 w-full rounded-lg border border-input bg-white px-4 text-base" disabled={!mayPublish} onChange={(event) => setModerationStatus(event.target.value as CareRecord["moderationStatus"])} value={mayPublish ? moderationStatus : "rejected"}>
            <option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Keep private</option>
          </select>
          {!mayPublish && <span className="mt-1 block text-xs font-normal text-[#4a6580]">The person did not request public sharing.</span>}
        </label>
        <label className="font-body text-sm font-bold">Follow up on
          <Input className="mt-2 h-12 px-4 text-base" onChange={(event) => setFollowUpAt(event.target.value)} type="datetime-local" value={followUpAt} />
        </label>
        <label className="font-body text-sm font-bold">Assigned to
          <Input className="mt-2 h-12 px-4 text-base" maxLength={120} onChange={(event) => setAssignee(event.target.value)} placeholder="Pastor Mike" value={assignee} />
        </label>
      </div>
      <label className="mt-4 block font-body text-sm font-bold">Private notes
        <Textarea className="mt-2 min-h-28 px-4 py-3 text-base" maxLength={5000} onChange={(event) => setPrivateNotes(event.target.value)} value={privateNotes} />
      </label>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button className="min-h-12 bg-[#1a6fb5] text-white" disabled={saving} onClick={() => void save()}><Save className="size-4" /> {saving ? "Saving…" : "Save care update"}</Button>
        {message && <p aria-live="polite" className={`text-sm ${message === "Saved" ? "text-emerald-700" : "text-red-700"}`}>{message}</p>}
      </div>
    </article>
  );
}

export function CareInbox({ token, logout }: { token: string; logout: () => void }) {
  const [store, setStore] = useState<CareStoreV1 | null>(null);
  const [filter, setFilter] = useState<Filter>("new");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/care?admin=1", { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 401 || response.status === 403) { logout(); return; }
      if (!response.ok) throw new Error("Unable to load care inbox");
      setStore(await response.json());
    } catch { setError("The pastoral care inbox could not be loaded."); }
    finally { setLoading(false); }
  }, [logout, token]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);
  const records = useMemo(() => store?.records.filter((record) => belongs(record, filter)) ?? [], [filter, store]);

  return (
    <main className="min-h-screen bg-[#f0f4f8] pb-24 pt-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-widest text-[#1a6fb5]">Private ministry workspace</p><h1 className="mt-2 font-display text-4xl font-bold text-[#0a1a2f]">Pastoral Care</h1></div>
          <Button className="min-h-11" onClick={logout} variant="outline">Sign out</Button>
        </div>
        <div className="mt-7 grid grid-cols-3 gap-2 rounded-xl bg-white p-2" role="tablist">
          {(["new", "follow-up", "done"] as const).map((item) => (
            <button aria-selected={filter === item} className={`min-h-11 rounded-lg px-2 text-sm font-bold capitalize ${filter === item ? "bg-[#1a6fb5] text-white" : "text-[#4a6580]"}`} key={item} onClick={() => setFilter(item)} role="tab">{item}</button>
          ))}
        </div>
        {loading ? <div className="flex min-h-64 items-center justify-center"><LoaderCircle className="size-8 animate-spin text-[#1a6fb5]" /></div>
          : error ? <div className="mt-6 rounded-xl bg-red-50 p-5 text-red-700">{error}<Button className="mt-3" onClick={() => void load()} variant="outline">Try again</Button></div>
          : records.length ? <div className="mt-6 space-y-5">{records.map((record) => <CareCard key={record.id} onSaved={setStore} onUnauthorized={logout} record={record} revision={store?.revision ?? 0} token={token} />)}</div>
          : <div className="mt-6 rounded-2xl bg-white p-10 text-center"><HeartHandshake className="mx-auto size-10 text-[#1a6fb5]" /><h2 className="mt-4 font-display text-2xl font-bold text-[#0a1a2f]">Nothing in {filter}</h2><p className="mt-2 text-[#4a6580]">You’re caught up.</p></div>}
      </div>
    </main>
  );
}
