"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  GripVertical,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  name: string | null;
  phoneNumber: string;
  labels: Array<{ id: string; name: string; color: string }>;
  _count: { messages: number };
}

interface Stage {
  id: string;
  name: string;
  color: string;
  contacts: Contact[];
}

const COLORS = [
  "#546dfe", "#25d366", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#ec4899", "#64748b",
];

function StageMenu({
  stage,
  onRename,
  onDelete,
}: {
  stage: Stage;
  onRename: (id: string, name: string, color: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(stage.name);
  const [color, setColor] = useState(stage.color);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (editing) {
    return (
      <div className="absolute right-0 top-8 z-50 w-56 rounded-xl border border-[#e2e8f0] bg-white p-3 shadow-xl">
        <p className="mb-2 text-xs font-semibold text-slate-500">Rename stage</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="app-input mb-2 text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") { onRename(stage.id, name, color); setEditing(false); setOpen(false); }
            if (e.key === "Escape") setEditing(false);
          }}
        />
        <div className="mb-3 flex gap-1.5 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="h-5 w-5 rounded-full border-2 transition"
              style={{ backgroundColor: c, borderColor: color === c ? "#1e293b" : "transparent" }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { onRename(stage.id, name, color); setEditing(false); setOpen(false); }}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#546dfe] py-1.5 text-xs font-medium text-white"
          >
            <Check className="h-3 w-3" /> Save
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs text-slate-500"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 w-40 rounded-xl border border-[#e2e8f0] bg-white py-1 shadow-xl">
          <button
            onClick={() => { setEditing(true); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Pencil className="h-3.5 w-3.5 text-slate-400" /> Rename
          </button>
          <button
            onClick={() => { onDelete(stage.id); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete stage
          </button>
        </div>
      )}
    </div>
  );
}

function AddStageForm({ onAdd }: { onAdd: (name: string, color: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const submit = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), color);
    setName("");
    setColor(COLORS[0]);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 items-center gap-2 rounded-xl border-2 border-dashed border-[#d8deef] px-4 text-sm font-medium text-slate-400 transition hover:border-[#546dfe] hover:text-[#546dfe]"
      >
        <Plus className="h-4 w-4" /> Add stage
      </button>
    );
  }

  return (
    <div className="w-[280px] shrink-0 rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
      <p className="mb-2 text-xs font-semibold text-slate-500">New stage</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Stage name..."
        className="app-input mb-3 text-sm"
        autoFocus
        onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setOpen(false); }}
      />
      <div className="mb-3 flex gap-1.5 flex-wrap">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className="h-5 w-5 rounded-full border-2 transition"
            style={{ backgroundColor: c, borderColor: color === c ? "#1e293b" : "transparent" }}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={submit} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#546dfe] py-1.5 text-xs font-medium text-white">
          <Check className="h-3 w-3" /> Create
        </button>
        <button onClick={() => setOpen(false)} className="rounded-lg border border-[#e2e8f0] px-3 py-1.5 text-xs text-slate-500">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const router = useRouter();
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState<string | null>(null);
  const [draggedContactId, setDraggedContactId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  const fetchPipeline = async () => {
    try {
      const res = await fetch("/api/pipeline");
      const data = await res.json();
      setStages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPipeline(); }, []);

  const moveContact = async (contactId: string, stageId: string | null) => {
    // Optimistic update
    setStages((prev) => {
      const contact = prev.flatMap((s) => s.contacts).find((c) => c.id === contactId);
      if (!contact) return prev;
      return prev.map((s) => ({
        ...s,
        contacts: s.id === stageId
          ? [...s.contacts.filter((c) => c.id !== contactId), contact]
          : s.contacts.filter((c) => c.id !== contactId),
      }));
    });

    setMoving(contactId);
    try {
      await fetch("/api/pipeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, stageId }),
      });
    } catch (err) {
      console.error(err);
      fetchPipeline(); // revert on error
    } finally {
      setMoving(null);
    }
  };

  const addStage = async (name: string, color: string) => {
    const res = await fetch("/api/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    if (res.ok) {
      const stage = await res.json();
      setStages((prev) => [...prev, { ...stage, contacts: [] }]);
    }
  };

  const renameStage = async (id: string, name: string, color: string) => {
    setStages((prev) => prev.map((s) => s.id === id ? { ...s, name, color } : s));
    await fetch("/api/pipeline", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name, color }),
    });
  };

  const deleteStage = async (id: string) => {
    if (!confirm("Hapus stage ini? Semua contact di dalamnya akan dilepaskan dari pipeline.")) return;
    setStages((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/pipeline?id=${id}`, { method: "DELETE" });
  };

  const handleDragStart = (e: React.DragEvent, contactId: string) => {
    setDraggedContactId(contactId);
    e.dataTransfer.setData("contactId", contactId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStageId(stageId);
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const contactId = e.dataTransfer.getData("contactId") || draggedContactId;
    if (contactId) await moveContact(contactId, stageId);
    setDraggedContactId(null);
    setDragOverStageId(null);
  };

  const handleDragEnd = () => {
    setDraggedContactId(null);
    setDragOverStageId(null);
  };

  const totalContacts = stages.reduce((sum, s) => sum + s.contacts.length, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <Loader2 className="mb-4 h-9 w-9 animate-spin text-[#546dfe]" />
        <p className="text-sm font-semibold">Loading pipeline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pipeline</h1>
          <p className="mt-1 text-sm text-slate-500">
            {totalContacts} contact · {stages.length} stage
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Stage summary pills */}
          <div className="hidden gap-2 md:flex">
            {stages.map((s) => (
              <div key={s.id} className="flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
                <span className="ml-0.5 font-bold text-slate-900">{s.contacts.length}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {stages.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d8deef] py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef1ff]">
            <GripVertical className="h-8 w-8 text-[#546dfe]" />
          </div>
          <p className="text-lg font-bold text-slate-800">Belum ada stage</p>
          <p className="mt-1 text-sm text-slate-500">Buat stage pertama untuk mulai track contact di pipeline</p>
          <div className="mt-6">
            <AddStageForm onAdd={addStage} />
          </div>
        </div>
      )}

      {/* Kanban board */}
      {stages.length > 0 && (
        <div className="custom-scrollbar overflow-x-auto pb-6">
          <div className="flex min-w-max items-start gap-4">
            {stages.map((stage) => (
              <div
                key={stage.id}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDrop={(e) => handleDrop(e, stage.id)}
                onDragLeave={() => setDragOverStageId(null)}
                className="w-[300px] shrink-0"
              >
                {/* Stage header */}
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                    <h2 className="text-sm font-bold text-slate-700">{stage.name}</h2>
                    <span className="rounded-full bg-[#f3f5fb] px-2 py-0.5 text-xs font-semibold text-slate-500">
                      {stage.contacts.length}
                    </span>
                  </div>
                  <div className="relative">
                    <StageMenu stage={stage} onRename={renameStage} onDelete={deleteStage} />
                  </div>
                </div>

                {/* Contact cards */}
                <div
                  className={cn(
                    "min-h-[20rem] rounded-xl border-2 bg-[#f8fafc] p-3 space-y-3 transition-colors",
                    dragOverStageId === stage.id
                      ? "border-[#546dfe] bg-[#eef1ff]"
                      : "border-transparent",
                  )}
                >
                  {stage.contacts.map((contact) => (
                    <article
                      key={contact.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, contact.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "app-card cursor-grab rounded-xl p-4 transition select-none",
                        moving === contact.id && "opacity-50 scale-95",
                        draggedContactId === contact.id && "opacity-40 rotate-1",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef1ff] text-sm font-bold text-[#546dfe]">
                            {contact.name?.[0]?.toUpperCase() ?? <User className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {contact.name || "No name"}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">+{contact.phoneNumber}</p>
                          </div>
                        </div>
                        <GripVertical className="h-4 w-4 shrink-0 text-slate-300" />
                      </div>

                      {/* Labels */}
                      {contact.labels.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {contact.labels.map((l) => (
                            <span
                              key={l.id}
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                              style={{ backgroundColor: l.color + "22", color: l.color }}
                            >
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: l.color }} />
                              {l.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer actions */}
                      <div className="mt-3 flex items-center justify-between border-t border-[#eef3f8] pt-3">
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {contact._count.messages}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => router.push(`/numbers?sendTo=${contact.phoneNumber}`)}
                            title="Kirim pesan"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-[#eef1ff] hover:text-[#546dfe]"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => router.push(`/contacts/${contact.id}`)}
                            title="Lihat detail"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-[#eef1ff] hover:text-[#546dfe]"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}

                  {stage.contacts.length === 0 && dragOverStageId !== stage.id && (
                    <div className="flex h-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#dbe4ef] text-slate-400">
                      <p className="text-xs font-medium">Drop contact di sini</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Add stage button */}
            <div className="shrink-0 pt-9">
              <AddStageForm onAdd={addStage} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
