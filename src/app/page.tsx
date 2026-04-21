"use client";

import { useAuth } from "@/components/providers";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Layout,
  MessageCircle,
  Phone,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

function DashboardStat({
  label,
  value,
  icon: Icon,
  tone,
  note,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  tone: string;
  note: string;
}) {
  return (
    <div className="app-card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", tone)}>
          <Icon className="h-5 w-5 text-slate-900" />
        </div>
        <span className="app-pill">{note}</span>
      </div>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-4xl font-black tracking-[-0.05em] text-slate-900">
        {value}
      </p>
    </div>
  );
}

function ActionCard({
  href,
  icon: Icon,
  title,
  desc,
  tone,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className="app-card group flex h-full flex-col p-6 transition hover:-translate-y-0.5 hover:border-[#cbd7e6]"
    >
      <div className={cn("mb-6 flex h-14 w-14 items-center justify-center rounded-xl", tone)}>
        <Icon className="h-6 w-6 text-slate-900" />
      </div>
      <h3 className="text-xl font-black tracking-[-0.03em] text-slate-900">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-slate-500">{desc}</p>
      <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#4358d8]">
        Open workspace
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, connected: 0, contacts: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [numRes, conRes] = await Promise.all([
          fetch("/api/numbers"),
          fetch("/api/contacts"),
        ]);
        const nums = await numRes.json();
        const cons = await conRes.json();

        setStats({
          total: Array.isArray(nums) ? nums.length : 0,
          connected: Array.isArray(nums)
            ? nums.filter((n: any) => n.status === "connected").length
            : 0,
          contacts: Array.isArray(cons) ? cons.length : 0,
        });
      } catch {}
    };
    if (user) fetchStats();
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="app-card overflow-hidden p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
          <div>
            <span className="app-kicker">
              <Sparkles className="h-3.5 w-3.5 text-[#546dfe]" />
              Workspace overview
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.06em] text-slate-900 lg:text-5xl">
              Welcome back, {user.name.split(" ")[0]}.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
              Monitor your WhatsApp operations, keep the team aligned, and move
              leads through the pipeline with a calmer dashboard flow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/numbers" className="app-button-primary">
                <Phone className="h-4 w-4" />
                Manage accounts
              </Link>
              <Link href="/contacts" className="app-button-secondary">
                <Users className="h-4 w-4" />
                View contacts
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="app-card-soft p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                System status
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef1ff]">
                  <Activity className="h-5 w-5 text-[#546dfe]" />
                </div>
                <div>
                  <p className="text-lg font-black tracking-[-0.03em] text-slate-900">
                    Workspace ready
                  </p>
                  <p className="text-sm text-slate-500">Core modules are available for daily work.</p>
                </div>
              </div>
            </div>
            <div className="app-card-soft p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Team role
              </p>
              <p className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-900">
                {user.role === "ADMIN" ? "Administrator" : "Workspace operator"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Access level synced with the new dashboard shell.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <DashboardStat
          label="WhatsApp accounts"
          value={`${stats.total} / 3`}
          icon={MessageCircle}
          tone="bg-[#e0f2fe]"
          note="Capacity"
        />
        <DashboardStat
          label="Active connections"
          value={stats.connected}
          icon={Zap}
          tone="bg-[#eef1ff]"
          note="Live"
        />
        <DashboardStat
          label="Total contacts"
          value={stats.contacts}
          icon={Users}
          tone="bg-[#fef3c7]"
          note="CRM"
        />
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
              Quick access
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-900">
              Move between your core workflows
            </h2>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <ActionCard
            href="/numbers"
            icon={Phone}
            title="Accounts"
            desc="Connect numbers, monitor status, and open detailed channel settings."
            tone="bg-[#dbeafe]"
          />
          <ActionCard
            href="/contacts"
            icon={Users}
            title="Contacts"
            desc="Review profiles, labels, and recent activity in a cleaner CRM layout."
            tone="bg-[#eef1ff]"
          />
          <ActionCard
            href="/crm/pipeline"
            icon={Layout}
            title="Pipeline"
            desc="Track leads across stages with a brighter drag-and-drop board."
            tone="bg-[#fee2e2]"
          />
          <ActionCard
            href="/api-docs"
            icon={BookOpen}
            title="API docs"
            desc="Browse endpoints, request samples, and integration notes."
            tone="bg-[#fef3c7]"
          />
        </div>
      </section>
    </div>
  );
}
