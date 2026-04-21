"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Loader2,
  Phone,
  RefreshCw,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import type { ConnectionStatus } from "@/lib/wa-client";

interface OverviewData {
  stats: {
    totalUsers: number;
    totalNumbers: number;
    connectedNumbers: number;
  };
  numbers: {
    id: string;
    label: string;
    phoneNumber: string | null;
    status: ConnectionStatus;
    apiKey: string;
    user: { name: string; email: string };
  }[];
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  tone: string;
}) {
  return (
    <div className="app-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-500">{label}</span>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5 text-slate-900" />
        </div>
      </div>
      <p className="text-4xl font-black tracking-[-0.05em] text-slate-900">{value}</p>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/overview");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#546dfe]" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <section className="app-page-header">
        <div>
          <span className="app-kicker">Admin monitor</span>
          <h1 className="app-page-title mt-4 flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-[#546dfe]" />
            System Overview
          </h1>
          <p className="app-page-description">
            Real-time summary of users, connections, and active WhatsApp numbers.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={refreshing}
          className="app-button-secondary"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <StatCard label="Total users" value={data.stats.totalUsers} icon={Users} tone="bg-[#fee2e2]" />
        <StatCard label="WA numbers" value={data.stats.totalNumbers} icon={Phone} tone="bg-[#fef3c7]" />
        <StatCard label="Connected" value={data.stats.connectedNumbers} icon={Wifi} tone="bg-[#eef1ff]" />
      </section>

      <section className="app-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#eef3f8] px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Connected assets
            </p>
            <h2 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-[-0.04em] text-slate-900">
              <Activity className="h-5 w-5 text-[#546dfe]" />
              All WA Numbers
            </h2>
          </div>
        </div>
        <div className="divide-y divide-[#eef3f8]">
          {data.numbers.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">No WA numbers yet</div>
          ) : (
            data.numbers.map((n) => (
              <div key={n.id} className="flex items-center gap-4 px-6 py-5 transition hover:bg-[#f8fafc]">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#f8fafc]">
                  {n.status === "connected" ? (
                    <Wifi className="h-5 w-5 text-[#546dfe]" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-bold text-slate-900">{n.label}</p>
                    <StatusBadge status={n.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Owner: {n.user.name} ({n.user.email})
                    {n.phoneNumber && ` · +${n.phoneNumber}`}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
