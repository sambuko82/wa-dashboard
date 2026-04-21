"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  GripVertical,
  Loader2,
  MessageSquare,
  Plus,
  Trophy,
  User,
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

export default function PipelinePage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState<string | null>(null);
  const [draggedContactId, setDraggedContactId] = useState<string | null>(null);

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

  useEffect(() => {
    fetchPipeline();
  }, []);

  const moveContact = async (contactId: string, stageId: string | null) => {
    setMoving(contactId);
    try {
      await fetch("/api/pipeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, stageId }),
      });
      fetchPipeline();
    } catch (err) {
      console.error(err);
    } finally {
      setMoving(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, contactId: string) => {
    setDraggedContactId(contactId);
    e.dataTransfer.setData("contactId", contactId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const contactId = e.dataTransfer.getData("contactId") || draggedContactId;
    if (contactId) await moveContact(contactId, stageId);
    setDraggedContactId(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <Loader2 className="mb-4 h-9 w-9 animate-spin text-[#546dfe]" />
        <p className="text-sm font-semibold">Loading pipeline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <section className="app-page-header">
        <div>
          <span className="app-kicker">Sales flow</span>
          <h1 className="app-page-title mt-4">Pipeline</h1>
          <p className="app-page-description">
            Drag leads between stages and review each part of your conversion journey.
          </p>
        </div>
        <div className="app-card-soft flex items-center gap-4 px-5 py-4">
          <div className="flex -space-x-2">
            {stages.slice(0, 3).map((s) => (
              <div
                key={s.id}
                className="h-9 w-9 rounded-full border-2 border-white"
                style={{ backgroundColor: s.color }}
              />
            ))}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Total stages
            </p>
            <p className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-900">
              {stages.length}
            </p>
          </div>
        </div>
      </section>

      <section className="custom-scrollbar overflow-x-auto pb-6">
        <div className="flex min-w-max gap-5">
          {stages.map((stage) => (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              className="w-[320px] shrink-0"
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full shadow-[0_0_10px_rgba(15,23,42,0.1)]"
                    style={{ backgroundColor: stage.color }}
                  />
                  <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                    {stage.name}
                  </h2>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
                  {stage.contacts.length}
                </span>
              </div>

              <div
                className={cn(
                  "app-card-soft min-h-[28rem] space-y-4 p-4 transition",
                  draggedContactId && "border-dashed border-[#cbd7e6]",
                )}
              >
                {stage.contacts.map((contact) => (
                  <article
                    key={contact.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, contact.id)}
                    className={cn(
                      "app-card cursor-grab p-5 transition",
                      moving === contact.id && "scale-95 opacity-50 grayscale",
                      draggedContactId === contact.id && "rotate-2 opacity-30",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f8fafc] text-slate-500">
                          {contact.name?.[0] ?? <User className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {contact.name || "Lead"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">+{contact.phoneNumber}</p>
                        </div>
                      </div>
                      <GripVertical className="h-4 w-4 text-slate-300" />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {contact.labels.map((l) => (
                        <span
                          key={l.id}
                          className="inline-flex h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: l.color }}
                          title={l.name}
                        />
                      ))}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-[#eef3f8] pt-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {contact._count.messages} messages
                      </div>
                      <button
                        onClick={() => (window.location.href = `/contacts/${contact.id}`)}
                        className="app-icon-button h-9 w-9"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                ))}

                {stage.contacts.length === 0 && (
                  <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#dbe4ef] bg-white text-slate-400">
                    <Plus className="mb-2 h-5 w-5" />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                      Ready for new leads
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}

          <aside className="app-card w-[320px] shrink-0 p-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#eef1ff]">
              <Trophy className="h-6 w-6 text-[#c58a12]" />
            </div>
            <h2 className="mt-6 text-2xl font-black tracking-[-0.04em] text-slate-900">
              Performance focus
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Keep moving contacts toward your closing stages and review where deals slow down.
            </p>
            <div className="mt-6 rounded-xl border border-[#d8deef] bg-[#f8fafc] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Conversion goal
              </p>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-black tracking-[-0.05em] text-slate-900">75%</span>
                <span className="pb-1 text-sm font-semibold text-[#546dfe]">+5.2%</span>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
