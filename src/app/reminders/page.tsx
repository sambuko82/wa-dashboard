"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Reminder {
  id: string;
  description: string;
  dueDate: string;
  isCompleted: boolean;
  contact: {
    id: string;
    name: string | null;
    phoneNumber: string;
  };
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = async () => {
    try {
      const res = await fetch("/api/reminders");
      const data = await res.json();
      setReminders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const toggleReminder = async (id: string, isCompleted: boolean) => {
    try {
      await fetch("/api/reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isCompleted }),
      });
      fetchReminders();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <Loader2 className="mb-4 h-9 w-9 animate-spin text-[#546dfe]" />
        <p className="text-sm font-semibold">Loading reminders...</p>
      </div>
    );
  }

  const overdue = reminders.filter((r) => new Date(r.dueDate) < new Date() && !r.isCompleted);
  const upcoming = reminders.filter((r) => new Date(r.dueDate) >= new Date() && !r.isCompleted);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <section className="app-page-header">
        <div>
          <span className="app-kicker">Follow-up center</span>
          <h1 className="app-page-title mt-4">Reminders</h1>
          <p className="app-page-description">
            Keep sales and support follow-ups visible so no lead goes cold.
          </p>
        </div>
        <div className="app-card-soft flex items-center gap-6 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Active</p>
            <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">{upcoming.length}</p>
          </div>
          <div className="h-12 w-px bg-[#dbe4ef]" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">Overdue</p>
            <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-red-600">{overdue.length}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-10">
        {overdue.length > 0 && (
          <section className="space-y-5">
            <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-red-600">
                Urgent actions required
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {overdue.map((r) => (
                <ReminderCard key={r.id} reminder={r} onToggle={toggleReminder} urgent />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef1ff]">
              <Calendar className="h-5 w-5 text-[#546dfe]" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-slate-500">
              Scheduled operations
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {upcoming.map((r) => (
              <ReminderCard key={r.id} reminder={r} onToggle={toggleReminder} />
            ))}
            {upcoming.length === 0 && overdue.length === 0 && (
              <div className="app-card col-span-full py-24 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.25rem] bg-[#eef1ff]">
                  <CheckCircle2 className="h-10 w-10 text-[#546dfe]" />
                </div>
                <h3 className="mt-6 text-2xl font-black tracking-[-0.04em] text-slate-900">
                  Schedule clear
                </h3>
                <p className="mt-3 text-sm text-slate-500">
                  You have no pending follow-up tasks right now.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ReminderCard({
  reminder,
  onToggle,
  urgent,
}: {
  reminder: Reminder;
  onToggle: (id: string, val: boolean) => void;
  urgent?: boolean;
}) {
  return (
    <div
      className={cn(
        "app-card p-6 transition hover:border-[#cbd7e6]",
        urgent && "border-red-200 bg-[linear-gradient(180deg,#fff,#fff8f8)]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button onClick={() => onToggle(reminder.id, !reminder.isCompleted)} className="mt-1">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl border-2 transition",
                urgent
                  ? "border-red-200 hover:bg-red-50"
                  : "border-[#dbe4ef] hover:border-[#cfd7ff] hover:bg-[#eef1ff]",
              )}
            >
              <Check className="h-4 w-4 text-slate-300" />
            </div>
          </button>
          <div className="min-w-0">
            <p className="text-base font-bold leading-7 text-slate-900">{reminder.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                <User className="h-3.5 w-3.5 text-sky-500" />
                {reminder.contact.name || "Identified lead"}
              </div>
              <div
                className={cn(
                  "flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]",
                  urgent ? "text-red-500" : "text-slate-400",
                )}
              >
                <Clock className="h-3.5 w-3.5" />
                {new Date(reminder.dueDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => (window.location.href = `/contacts/${reminder.contact.id}`)}
          className="app-icon-button"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
