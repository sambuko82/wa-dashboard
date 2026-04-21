"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers";
import Link from "next/link";
import {
  Loader2,
  Plus,
  QrCode,
  Settings,
  Signal,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";

interface WaNumber {
  id: string;
  label: string;
  phoneNumber: string | null;
  status: "disconnected" | "connecting" | "connected";
  apiKey: string;
  createdAt: string;
}

const MAX_NUMBERS = 3;

export default function NumbersPage() {
  const { user } = useAuth();
  const [numbers, setNumbers] = useState<WaNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchNumbers = async () => {
    try {
      const res = await fetch("/api/numbers");
      if (res.ok) {
        const data = await res.json();
        setNumbers(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNumbers();
  }, []);

  const addNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setAdding(true);
    setError("");

    try {
      const res = await fetch("/api/numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add number");
      } else {
        setNewLabel("");
        fetchNumbers();
      }
    } catch {
      setError("Network error");
    } finally {
      setAdding(false);
    }
  };

  const deleteNumber = async (id: string) => {
    if (!confirm("Delete this WA number? This will disconnect and remove all data.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/numbers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Delete failed (${res.status})`);
      } else {
        await fetchNumbers();
      }
    } catch {
      setError("Network error saat menghapus");
    } finally {
      setDeleting(null);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="app-page-header">
        <div>
          <span className="app-kicker">Channel management</span>
          <h1 className="app-page-title mt-4">WhatsApp Accounts</h1>
          <p className="app-page-description">
            Connect, monitor, and manage your active WhatsApp instances from one
            cleaner workspace.
          </p>
        </div>
        <div className="app-card-soft flex items-center gap-5 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Slots used
            </p>
            <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">
              {numbers.length}
              <span className="text-lg text-slate-400">/{MAX_NUMBERS}</span>
            </p>
          </div>
          <div className="h-12 w-px bg-[#dbe4ef]" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Connected
            </p>
            <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#546dfe]">
              {numbers.filter((n) => n.status === "connected").length}
            </p>
          </div>
        </div>
      </section>

      {numbers.length < MAX_NUMBERS && (
        <section className="app-card p-5 sm:p-6">
          <form onSubmit={addNumber} className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#eef1ff]">
                <Plus className="h-6 w-6 text-[#546dfe]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
                  Add new instance
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Create a new channel slot for sales, support, or internal ops.
                </p>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Name your instance, for example Sales Jakarta"
                  className="app-input mt-4"
                  maxLength={50}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={adding || !newLabel.trim()}
              className="app-button-primary w-full lg:w-auto"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create account
            </button>
          </form>
          {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
        </section>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Loader2 className="mb-4 h-9 w-9 animate-spin text-[#546dfe]" />
          <p className="text-sm font-semibold">Loading WhatsApp instances...</p>
        </div>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {numbers.map((num) => (
            <article key={num.id} className="app-card flex h-full flex-col p-6">
              <div className="mb-6 flex items-start justify-between gap-3">
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-xl",
                    num.status === "connected" ? "bg-[#eef1ff]" : "bg-slate-100",
                  )}
                >
                  {num.status === "connected" ? (
                    <Wifi className="h-6 w-6 text-[#546dfe]" />
                  ) : (
                    <WifiOff className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <StatusBadge status={num.status} />
              </div>

              <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-900">
                {num.label}
              </h2>
              <div className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-500">
                <Signal
                  className={cn(
                    "h-4 w-4",
                    num.status === "connected" ? "text-[#546dfe]" : "text-slate-300",
                  )}
                />
                {num.phoneNumber ? `+${num.phoneNumber}` : "Not connected yet"}
              </div>

              <div className="mt-6 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  API access key
                </p>
                <code className="mt-3 block break-all rounded-lg border border-[#e2e8f0] bg-white px-3 py-3 text-xs font-medium text-slate-600">
                  {num.apiKey}
                </code>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[#eef3f8] pt-5">
                <p className="text-xs font-medium text-slate-400">
                  Added {new Date(num.createdAt).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-2">
                  <Link href={`/numbers/${num.id}`} className="app-button-secondary px-4 py-2.5">
                    <Settings className="h-4 w-4" />
                    Manage
                  </Link>
                  <button
                    onClick={() => deleteNumber(num.id)}
                    disabled={deleting === num.id}
                    className="app-icon-button"
                  >
                    {deleting === num.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </article>
          ))}

          {numbers.length === 0 && !loading && (
            <div className="app-card col-span-full py-20 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.25rem] bg-[#eef1ff]">
                <QrCode className="h-10 w-10 text-[#546dfe]" />
              </div>
              <h3 className="mt-6 text-2xl font-black tracking-[-0.04em] text-slate-900">
                No accounts connected yet
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
                Create your first WhatsApp account slot to start sending messages,
                scanning QR codes, and assigning channels to your team.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
