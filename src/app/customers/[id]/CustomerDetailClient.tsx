"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Tag,
  Trash2,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface JvtoCustomer {
  id: number;
  name: string;
  phone: string;
  email: string;
  category: "JVTO" | "KLOOK";
  package: {
    id: number | null;
    code: string;
    name: string;
    link: string;
    duration: { day: number | string; night: number | string };
  };
  booking: {
    id: number;
    code: string;
    numb_of_pax: number;
    travel_date_start: string;
    travel_date_end: string;
    booking_date: string;
    pickup: { location: string; time: string };
    drop: { location: string; time: string };
  };
}

interface ChatMessage {
  id: string;
  direction: "IN" | "OUT";
  content: string | null;
  mediaType: string | null;
  createdAt: string;
  number: { id: string; label: string; phoneNumber: string | null };
}

interface CrmData {
  id: string;
  notes: string | null;
  pipelineStageId: string | null;
  pipelineStage: { id: string; name: string; color: string } | null;
  labels: Array<{ id: string; name: string; color: string }>;
  adminNotes: Array<{ id: string; content: string; createdAt: string }>;
  reminders: Array<{ id: string; description: string; dueDate: string; isCompleted: boolean }>;
}

interface WaNumber {
  id: string;
  label: string;
  phoneNumber: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const FormattedDate = ({ date }: { date: string }) => {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m ? <span>{new Date(date).toLocaleDateString()}</span> : <span>…</span>;
};

const FormattedTime = ({ date }: { date: string }) => {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m ? (
    <span>{new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
  ) : (
    <span>…</span>
  );
};

function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Component ──────────────────────────────────────────────────────────────

export default function CustomerDetailClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [customer, setCustomer] = useState<JvtoCustomer | null>(null);
  const [crm, setCrm] = useState<CrmData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [waNumbers, setWaNumbers] = useState<WaNumber[]>([]);
  const [stages, setStages] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [allLabels, setAllLabels] = useState<Array<{ id: string; name: string; color: string }>>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"chat" | "crm">("chat");

  // Send message
  const [selectedNumber, setSelectedNumber] = useState("");
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // CRM state
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [reminderDesc, setReminderDesc] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [addingReminder, setAddingReminder] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchAll = async () => {
    try {
      const [custRes, crmRes, numRes, pipeRes, labRes] = await Promise.all([
        fetch(`/api/jvto/customers/${id}`),
        fetch(`/api/jvto/crm/${id}`),
        fetch("/api/numbers"),
        fetch("/api/pipeline?slim=true"),
        fetch("/api/labels"),
      ]);

      if (!custRes.ok) { router.push("/customers"); return; }

      const custData = await custRes.json();
      const crmData = crmRes.ok ? await crmRes.json() : null;
      const numData = numRes.ok ? await numRes.json() : [];
      const pipeData = pipeRes.ok ? await pipeRes.json() : [];
      const labData = labRes.ok ? await labRes.json() : [];

      setCustomer(custData.data);
      setCrm(crmData);
      setWaNumbers(Array.isArray(numData) ? numData : []);
      setStages(Array.isArray(pipeData) ? pipeData : []);
      setAllLabels(Array.isArray(labData) ? labData : []);
      if (Array.isArray(numData) && numData.length > 0) {
        setSelectedNumber((prev) => prev || numData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!customer) return;
    try {
      const phone = customer.phone.replace(/^\+/, "");
      const res = await fetch(`/api/jvto/chat?phone=${phone}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCrm = async () => {
    const res = await fetch(`/api/jvto/crm/${id}`);
    if (res.ok) setCrm(await res.json());
  };

  useEffect(() => { fetchAll(); }, [id]);
  useEffect(() => { if (customer) fetchMessages(); }, [customer]);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim() || !selectedNumber || !customer) return;
    setSending(true);
    try {
      const res = await fetch("/api/jvto/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numberId: selectedNumber,
          phone: customer.phone,
          message: msgText.trim(),
        }),
      });
      if (res.ok) {
        setMsgText("");
        setTimeout(fetchMessages, 500);
      }
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/jvto/crm/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });
      if (res.ok) { setNewNote(""); fetchCrm(); }
    } catch (err) { console.error(err); }
    finally { setAddingNote(false); }
  };

  const handleDeleteNote = async (noteId: string) => {
    await fetch(`/api/jvto/crm/${id}/notes?noteId=${noteId}`, { method: "DELETE" });
    fetchCrm();
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderDesc.trim() || !reminderDate) return;
    setAddingReminder(true);
    try {
      const res = await fetch(`/api/jvto/crm/${id}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: reminderDesc, dueDate: reminderDate }),
      });
      if (res.ok) { setReminderDesc(""); setReminderDate(""); fetchCrm(); }
    } catch (err) { console.error(err); }
    finally { setAddingReminder(false); }
  };

  const toggleReminder = async (reminderId: string, isCompleted: boolean) => {
    await fetch(`/api/jvto/crm/${id}/reminders`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reminderId, isCompleted }),
    });
    fetchCrm();
  };

  const deleteReminder = async (reminderId: string) => {
    await fetch(`/api/jvto/crm/${id}/reminders?reminderId=${reminderId}`, { method: "DELETE" });
    fetchCrm();
  };

  const toggleLabel = async (labelId: string) => {
    if (!crm) return;
    const currentIds = crm.labels.map((l) => l.id);
    const newIds = currentIds.includes(labelId)
      ? currentIds.filter((x) => x !== labelId)
      : [...currentIds, labelId];
    await fetch(`/api/jvto/crm/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labelIds: newIds }),
    });
    fetchCrm();
  };

  const updateStage = async (stageId: string) => {
    await fetch(`/api/jvto/crm/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipelineStageId: stageId }),
    });
    fetchCrm();
  };

  const saveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNotes(true);
    try {
      await fetch(`/api/jvto/crm/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesText.trim() || null }),
      });
      setEditingNotes(false);
      fetchCrm();
    } catch (err) { console.error(err); }
    finally { setSavingNotes(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-slate-400">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#546dfe]" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em]">Loading customer...</p>
      </div>
    );
  }

  if (!customer) return null;

  const phone = customer.phone.replace(/^\+/, "");

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/customers")} className="app-icon-button h-9 w-9">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Customer Profile · {customer.category}
          </p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-[-0.03em] text-slate-900">
            {customer.name}
          </h1>
        </div>
      </div>

      {/* Info card */}
      <div className="app-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#eef1ff] text-xl font-bold text-[#546dfe]">
              {customer.name[0] ?? <User className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold text-slate-900">{customer.name}</h2>
                <span className="rounded-md bg-[#eef1ff] px-2 py-0.5 text-xs font-semibold text-[#546dfe]">
                  {customer.category}
                </span>
                {crm?.labels.map((l) => (
                  <span key={l.id} className="rounded-md px-2 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: l.color }}>
                    {l.name}
                  </span>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" />{customer.phone}</div>
                {customer.email !== "-" && <div>{customer.email}</div>}
              </div>
            </div>
          </div>

          {/* Booking summary */}
          <div className="rounded-xl border border-[#e6eaf4] bg-[#fafbfe] p-4 lg:min-w-[280px]">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              <Package className="h-3.5 w-3.5" /> Booking
            </div>
            <p className="font-semibold text-slate-800">{customer.package.name}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {customer.package.code !== "-" ? customer.package.code + " · " : ""}
              {customer.package.duration.day}D{customer.package.duration.night}N
              {customer.package.link !== "-" && (
                <a href={customer.package.link} target="_blank" rel="noopener noreferrer" className="ml-1.5 inline-flex items-center gap-0.5 text-[#546dfe] hover:underline">
                  <ExternalLink className="h-3 w-3" /> View
                </a>
              )}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div>
                <p className="text-slate-400">Booking code</p>
                <p className="font-medium">{customer.booking.code}</p>
              </div>
              <div>
                <p className="text-slate-400">Pax</p>
                <p className="font-medium">{customer.booking.numb_of_pax} pax</p>
              </div>
              <div>
                <p className="text-slate-400">Travel dates</p>
                <p className="font-medium">{fmt(customer.booking.travel_date_start)} – {fmt(customer.booking.travel_date_end)}</p>
              </div>
              {customer.booking.pickup.location !== "-" && (
                <div>
                  <p className="text-slate-400">Pickup</p>
                  <p className="font-medium flex items-start gap-1">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                    {customer.booking.pickup.location}
                    {customer.booking.pickup.time !== "-" && ` · ${customer.booking.pickup.time}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#d8deef]">
        {([
          { key: "chat", label: "Chat History", icon: MessageSquare },
          { key: "crm", label: "CRM", icon: ShieldCheck },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "relative flex items-center gap-2 px-5 py-3 text-sm font-semibold transition",
              activeTab === key
                ? "text-[#546dfe] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#546dfe]"
                : "text-slate-500 hover:text-slate-800",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── CHAT TAB ── */}
      {activeTab === "chat" && (
        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
          {/* Chat window */}
          <div className="app-card flex flex-col overflow-hidden" style={{ minHeight: "520px" }}>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-slate-400 py-20">
                  <MessageSquare className="h-10 w-10 text-slate-200" />
                  <p className="text-sm font-medium">No messages yet.</p>
                  <p className="text-xs">Messages with {customer.phone} will appear here.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOut = msg.direction === "OUT";
                  return (
                    <div key={msg.id} className={cn("flex", isOut ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5 text-sm", isOut ? "rounded-br-sm bg-[#546dfe] text-white" : "rounded-bl-sm bg-[#f0f2f8] text-slate-800")}>
                        {msg.mediaType && !msg.content && (
                          <p className="italic text-xs opacity-70">[{msg.mediaType}]</p>
                        )}
                        {msg.content && <p className="leading-[1.55]">{msg.content}</p>}
                        <p className={cn("mt-1 text-right text-[11px]", isOut ? "text-white/60" : "text-slate-400")}>
                          <FormattedTime date={msg.createdAt} />
                          {" · "}
                          <span className="font-medium">{isOut ? msg.number.label : customer.phone}</span>
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Send form */}
            <div className="border-t border-[#e6eaf4] bg-[#fafbfe] p-4">
              <form onSubmit={handleSend} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <select
                    value={selectedNumber}
                    onChange={(e) => setSelectedNumber(e.target.value)}
                    className="app-select flex-1 text-sm"
                  >
                    {waNumbers.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label}{n.phoneNumber ? ` (${n.phoneNumber})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    placeholder={`Message to ${customer.phone}...`}
                    className="app-input flex-1"
                  />
                  <button
                    type="submit"
                    disabled={sending || !msgText.trim() || !selectedNumber}
                    className="app-button-primary px-4"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Side: pipeline */}
          <div className="app-card p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pipeline Stage</p>
            <select
              value={crm?.pipelineStageId ?? ""}
              onChange={(e) => updateStage(e.target.value)}
              className="app-select w-full"
            >
              <option value="">Not assigned</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {crm?.pipelineStage && (
              <div className="mt-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: crm.pipelineStage.color }} />
                <span className="text-sm font-medium text-slate-700">{crm.pipelineStage.name}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CRM TAB ── */}
      {activeTab === "crm" && (
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-5">
            {/* Notes */}
            <div className="app-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#546dfe]" />
                <h3 className="text-lg font-semibold text-slate-900">Interaction Notes</h3>
              </div>
              <form onSubmit={handleAddNote} className="mb-5 space-y-3">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Write a note about the latest interaction..."
                  className="app-textarea min-h-24"
                  rows={3}
                />
                <div className="flex justify-end">
                  <button type="submit" disabled={addingNote || !newNote.trim()} className="app-button-primary">
                    {addingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Note
                  </button>
                </div>
              </form>
              <div className="space-y-3">
                {crm?.adminNotes.length ? (
                  crm.adminNotes.map((note) => (
                    <div key={note.id} className="group relative rounded-lg border border-[#e6eaf4] bg-[#fafbfe] p-4">
                      <p className="text-sm leading-6 text-slate-700">{note.content}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-xs text-slate-400"><FormattedDate date={note.createdAt} /></p>
                        <button onClick={() => handleDeleteNote(note.id)} className="invisible text-slate-400 transition hover:text-red-500 group-hover:visible">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-[#d8deef] bg-[#fafbfe] px-4 py-10 text-center text-sm text-slate-400">
                    No interaction notes yet.
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            {/* Pipeline */}
            <div className="app-card p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pipeline Stage</p>
              <select value={crm?.pipelineStageId ?? ""} onChange={(e) => updateStage(e.target.value)} className="app-select w-full">
                <option value="">Not assigned</option>
                {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Labels */}
            <div className="app-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#546dfe]" />
                  <h3 className="text-base font-semibold text-slate-900">Labels</h3>
                </div>
                <button onClick={() => setShowLabelPicker((p) => !p)} className="text-xs font-medium text-[#546dfe]">
                  {showLabelPicker ? "Close" : "Manage"}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {crm?.labels.length ? (
                  crm.labels.map((l) => (
                    <span key={l.id} className="rounded-md px-2 py-1 text-xs font-semibold text-white" style={{ backgroundColor: l.color }}>{l.name}</span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No labels.</p>
                )}
              </div>
              {showLabelPicker && (
                <div className="mt-3 space-y-1 rounded-lg border border-[#e6eaf4] bg-[#fafbfe] p-2">
                  {allLabels.map((label) => {
                    const active = crm?.labels.some((l) => l.id === label.id);
                    return (
                      <button key={label.id} onClick={() => toggleLabel(label.id)} className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition", active ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:bg-white")}>
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} />
                        {label.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reminders */}
            <div className="app-card p-5">
              <div className="mb-3 flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#546dfe]" />
                <h3 className="text-base font-semibold text-slate-900">Reminders</h3>
              </div>
              <form onSubmit={handleAddReminder} className="mb-4 space-y-2">
                <input value={reminderDesc} onChange={(e) => setReminderDesc(e.target.value)} placeholder="Follow up for..." className="app-input" />
                <div className="flex gap-2">
                  <input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} className="app-input" />
                  <button type="submit" disabled={addingReminder} className="app-button-primary px-3">
                    {addingReminder ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </button>
                </div>
              </form>
              <div className="space-y-2">
                {crm?.reminders.length ? (
                  crm.reminders.map((r) => (
                    <div key={r.id} className={cn("group flex items-start gap-2 rounded-lg border px-3 py-2.5", r.isCompleted ? "border-[#e6eaf4] bg-[#f8fafc] opacity-60" : "border-[#d8deef] bg-white")}>
                      <button onClick={() => toggleReminder(r.id, !r.isCompleted)} className="mt-0.5 shrink-0">
                        {r.isCompleted ? <CheckCircle2 className="h-4 w-4 text-[#546dfe]" /> : <Calendar className="h-4 w-4 text-slate-400" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm text-slate-800", r.isCompleted && "line-through")}>{r.description}</p>
                        <p className="mt-0.5 text-xs text-slate-400"><FormattedDate date={r.dueDate} /></p>
                      </div>
                      <button onClick={() => deleteReminder(r.id)} className="invisible shrink-0 text-slate-400 hover:text-red-500 group-hover:visible">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No reminders yet.</p>
                )}
              </div>
            </div>

            {/* Context notes */}
            <div className="app-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-[#546dfe]" />
                  <h3 className="text-base font-semibold text-slate-900">Context</h3>
                </div>
                {!editingNotes && (
                  <button onClick={() => { setNotesText(crm?.notes ?? ""); setEditingNotes(true); }} className="text-xs font-medium text-[#546dfe]">Edit</button>
                )}
              </div>
              {editingNotes ? (
                <form onSubmit={saveNotes} className="space-y-2">
                  <textarea value={notesText} onChange={(e) => setNotesText(e.target.value)} placeholder="Context about this customer..." className="app-textarea min-h-24" rows={3} />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingNotes(false)} className="app-button-secondary">Cancel</button>
                    <button type="submit" disabled={savingNotes} className="app-button-primary">
                      {savingNotes ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-sm leading-6 text-slate-600">
                  {crm?.notes || <span className="italic text-slate-400">No context saved.</span>}
                </p>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
