"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Calendar,
  CheckCircle2,
  History,
  Loader2,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Save,
  ShieldCheck,
  Tag,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  phoneNumber: string;
  name: string | null;
  email: string | null;
  notes: string | null;
  createdAt: string;
  pipelineStageId: string | null;
  labels: Array<{ id: string; name: string; color: string }>;
  adminNotes: Array<{ id: string; content: string; createdAt: string }>;
  reminders: Array<{ id: string; description: string; dueDate: string; isCompleted: boolean }>;
}

const FormattedDate = ({ date }: { date: string }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <span>{new Date(date).toLocaleDateString()}</span> : <span>...</span>;
};

const FormattedDateTime = ({ date }: { date: string }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <span>{new Date(date).toLocaleString()}</span> : <span>...</span>;
};

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [stages, setStages] = useState<Array<{ id: string; name: string }>>([]);
  const [allLabels, setAllLabels] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [reminderDesc, setReminderDesc] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [addingReminder, setAddingReminder] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);
  const [editingContext, setEditingContext] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [savingContext, setSavingContext] = useState(false);

  const fetchContact = async () => {
    try {
      const [conRes, pipeRes, labRes] = await Promise.all([
        fetch(`/api/contacts/${id}`),
        fetch("/api/pipeline?slim=true"),
        fetch("/api/labels"),
      ]);
      if (!conRes.ok) {
        router.push("/contacts");
        return;
      }
      const conData = await conRes.json();
      const pipeData = await pipeRes.json();
      const labData = await labRes.json();
      setContact(conData);
      setStages(pipeData);
      setAllLabels(labData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContact();
  }, [id]);

  const updateStage = async (stageId: string) => {
    try {
      await fetch("/api/pipeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: id, stageId }),
      });
      fetchContact();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleContactLabel = async (labelId: string) => {
    if (!contact) return;
    const currentLabelIds = contact.labels.map((l) => l.id);
    const newLabelIds = currentLabelIds.includes(labelId)
      ? currentLabelIds.filter((item) => item !== labelId)
      : [...currentLabelIds, labelId];

    try {
      await fetch(`/api/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labelIds: newLabelIds }),
      });
      fetchContact();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/contacts/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });
      if (res.ok) {
        setNewNote("");
        fetchContact();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingNote(false);
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderDesc.trim() || !reminderDate) return;
    setAddingReminder(true);
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: id, description: reminderDesc, dueDate: reminderDate }),
      });
      if (res.ok) {
        setReminderDesc("");
        setReminderDate("");
        fetchContact();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingReminder(false);
    }
  };

  const startEditInfo = () => {
    if (!contact) return;
    setEditName(contact.name || "");
    setEditEmail(contact.email || "");
    setEditPhone(contact.phoneNumber);
    setEditingInfo(true);
  };

  const saveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPhone.trim()) return;
    setSavingInfo(true);
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim() || null,
          email: editEmail.trim() || null,
          phoneNumber: editPhone.trim(),
        }),
      });
      if (res.ok) {
        setEditingInfo(false);
        fetchContact();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingInfo(false);
    }
  };

  const saveContext = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContext(true);
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: editNotes.trim() || null }),
      });
      if (res.ok) {
        setEditingContext(false);
        fetchContact();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingContext(false);
    }
  };

  const toggleReminder = async (reminderId: string, isCompleted: boolean) => {
    try {
      await fetch("/api/reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reminderId, isCompleted }),
      });
      fetchContact();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-slate-400">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-[#546dfe]" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em]">Loading contact profile...</p>
      </div>
    );
  }

  if (!contact) return null;

  return (
    <div className="space-y-5 pb-12">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/contacts")} className="app-icon-button h-9 w-9">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Contact Profile</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-900">
            {contact.name || "Unnamed Contact"}
          </h1>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-5">
          <div className="app-card p-6">
            {editingInfo ? (
              <form onSubmit={saveInfo} className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Edit Contact Info</p>
                  <button type="button" onClick={() => setEditingInfo(false)} className="app-icon-button h-7 w-7">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Name</label>
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full name" className="app-input" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Phone Number *</label>
                    <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="628123..." className="app-input" required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-500">Email</label>
                    <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="email@example.com" className="app-input" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditingInfo(false)} className="app-button-secondary">Cancel</button>
                  <button type="submit" disabled={savingInfo || !editPhone.trim()} className="app-button-primary">
                    {savingInfo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#eef1ff] text-2xl font-semibold text-[#546dfe]">
                    {contact.name?.[0] || <User className="h-7 w-7" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold text-slate-900">{contact.name || "Contact"}</h2>
                      {contact.labels.map((label) => (
                        <span
                          key={label.id}
                          className="rounded-md px-2 py-1 text-[11px] font-semibold text-white"
                          style={{ backgroundColor: label.color }}
                        >
                          {label.name}
                        </span>
                      ))}
                      <button onClick={startEditInfo} className="app-icon-button h-7 w-7 ml-1" title="Edit info">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-slate-500 md:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        +{contact.phoneNumber}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        {contact.email || <span className="italic text-slate-400">No email</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-slate-400" />
                        Joined <FormattedDate date={contact.createdAt} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="min-w-[220px]">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Pipeline Stage
                  </label>
                  <select
                    value={contact.pipelineStageId || ""}
                    onChange={(e) => updateStage(e.target.value)}
                    className="app-select"
                  >
                    <option value="">Not assigned</option>
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="app-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#546dfe]" />
              <h3 className="text-lg font-semibold text-slate-900">Interaction Notes</h3>
            </div>

            <form onSubmit={handleAddNote} className="mb-5 space-y-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Write a note about the latest discussion with this contact..."
                className="app-textarea min-h-28"
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
              {contact.adminNotes.length > 0 ? (
                contact.adminNotes.map((note) => (
                  <div key={note.id} className="rounded-lg border border-[#e6eaf4] bg-[#fafbfe] p-4">
                    <p className="text-sm leading-6 text-slate-700">{note.content}</p>
                    <p className="mt-3 text-xs text-slate-400">
                      <FormattedDateTime date={note.createdAt} />
                    </p>
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
          <div className="app-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#546dfe]" />
                <h3 className="text-lg font-semibold text-slate-900">Labels</h3>
              </div>
              <button
                onClick={() => setShowLabelPicker((prev) => !prev)}
                className="text-sm font-medium text-[#546dfe]"
              >
                {showLabelPicker ? "Close" : "Manage"}
              </button>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {contact.labels.length > 0 ? (
                contact.labels.map((label) => (
                  <span
                    key={label.id}
                    className="rounded-md px-2 py-1 text-xs font-semibold text-white"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-400">No labels assigned.</p>
              )}
            </div>

            {showLabelPicker && (
              <div className="space-y-2 rounded-lg border border-[#e6eaf4] bg-[#fafbfe] p-3">
                {allLabels.map((label) => {
                  const active = contact.labels.some((item) => item.id === label.id);
                  return (
                    <button
                      key={label.id}
                      onClick={() => toggleContactLabel(label.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:bg-white",
                      )}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} />
                      {label.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="app-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#546dfe]" />
              <h3 className="text-lg font-semibold text-slate-900">Reminders</h3>
            </div>

            <form onSubmit={handleAddReminder} className="space-y-3">
              <input
                value={reminderDesc}
                onChange={(e) => setReminderDesc(e.target.value)}
                placeholder="Follow up for..."
                className="app-input"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  className="app-input"
                />
                <button type="submit" disabled={addingReminder} className="app-button-primary">
                  {addingReminder ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </button>
              </div>
            </form>

            <div className="mt-4 space-y-3">
              {contact.reminders.length > 0 ? (
                contact.reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border px-3 py-3",
                      reminder.isCompleted
                        ? "border-[#e6eaf4] bg-[#f8fafc] opacity-60"
                        : "border-[#d8deef] bg-white",
                    )}
                  >
                    <button onClick={() => toggleReminder(reminder.id, !reminder.isCompleted)}>
                      {reminder.isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-[#546dfe]" />
                      ) : (
                        <Calendar className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm text-slate-800", reminder.isCompleted && "line-through")}>
                        {reminder.description}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        <FormattedDate date={reminder.dueDate} />
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No reminders yet.</p>
              )}
            </div>
          </div>

          <div className="app-card p-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-[#546dfe]" />
                <h3 className="text-lg font-semibold text-slate-900">Context</h3>
              </div>
              {!editingContext && (
                <button
                  onClick={() => { setEditNotes(contact.notes || ""); setEditingContext(true); }}
                  className="text-sm font-medium text-[#546dfe]"
                >
                  Edit
                </button>
              )}
            </div>
            {editingContext ? (
              <form onSubmit={saveContext} className="space-y-3">
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add context about this contact (background, preferences, important details)..."
                  className="app-textarea min-h-28"
                  rows={4}
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditingContext(false)} className="app-button-secondary">Cancel</button>
                  <button type="submit" disabled={savingContext} className="app-button-primary">
                    {savingContext ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm leading-6 text-slate-600">
                {contact.notes || <span className="italic text-slate-400">No additional context saved for this contact.</span>}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
