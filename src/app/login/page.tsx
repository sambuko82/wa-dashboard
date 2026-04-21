"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
  MessageSquare,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "Login failed");
      }
    } catch {
      setError("Network error, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <section className="hidden lg:block">
        <span className="app-kicker">Workspace access</span>
        <h1 className="mt-6 text-5xl font-black tracking-[-0.06em] text-slate-900">
          Sign in to your WhatsApp operations hub.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-slate-500">
          A brighter dashboard shell, cleaner content hierarchy, and simpler daily
          workflows are ready inside your account.
        </p>
        <div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-2">
          <div className="app-card-soft p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Unified CRM
            </p>
            <p className="mt-3 text-lg font-black tracking-[-0.03em] text-slate-900">
              Contacts, pipeline, reminders
            </p>
          </div>
          <div className="app-card-soft p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Multi-number control
            </p>
            <p className="mt-3 text-lg font-black tracking-[-0.03em] text-slate-900">
              Monitor every WhatsApp channel
            </p>
          </div>
        </div>
      </section>

      <section className="app-card p-8 sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.6rem] bg-[linear-gradient(135deg,#ff8da1,#b83280)] shadow-[0_20px_40px_-24px_rgba(184,50,128,0.7)]">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-5 text-3xl font-black tracking-[-0.05em] text-slate-900">
            WA Pro
          </h2>
          <p className="mt-2 text-sm text-slate-500">Sign in to continue to your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@admin.com"
                className="app-input pl-11"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="app-input pl-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="app-button-primary w-full py-3.5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          WhatsApp Multi-User Dashboard · Powered by Baileys
        </p>
      </section>
    </div>
  );
}
