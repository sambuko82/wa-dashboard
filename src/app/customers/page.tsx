"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  MapPin,
  MoreHorizontal,
  Phone,
  Search,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JvtoPackage {
  id: number | null;
  code: string;
  name: string;
  link: string;
  duration: { day: number | string; night: number | string };
}

interface JvtoBooking {
  id: number;
  code: string;
  numb_of_pax: number;
  travel_date_start: string;
  travel_date_end: string;
  booking_date: string;
  pickup: { location: string; time: string };
  drop: { location: string; time: string };
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  category: "JVTO" | "KLOOK";
  package: JvtoPackage;
  booking: JvtoBooking;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

type Tab = "JVTO" | "KLOOK";

function TripDateBadge({ start, end }: { start: string; end: string }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(start);
  const endDate = new Date(end);

  let tone = "bg-[#eef1ff] text-[#546dfe]"; // upcoming
  if (endDate < today) tone = "bg-[#f0f2f5] text-slate-500"; // past
  else if (startDate <= today) tone = "bg-[#e8fbf1] text-[#14a05a]"; // in progress

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold", tone)}>
      <Calendar className="h-3 w-3" />
      {fmt(start)} – {fmt(end)}
    </span>
  );
}

export default function CustomersPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("JVTO");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCustomers = async (category: Tab, p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jvto/customers?category=${category}&page=${p}`);
      if (!res.ok) return;
      const json = await res.json();
      // Laravel pagination: json.data.data = items, json.data.* = meta
      const items: Customer[] = json?.data?.data ?? [];
      const meta: PaginationMeta = {
        current_page: json?.data?.current_page ?? 1,
        last_page: json?.data?.last_page ?? 1,
        per_page: json?.data?.per_page ?? 15,
        total: json?.data?.total ?? 0,
      };
      setCustomers(items);
      setPagination(meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchCustomers(tab, 1);
  }, [tab]);

  useEffect(() => {
    fetchCustomers(tab, page);
  }, [page]);

  const filteredCustomers = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.package.name.toLowerCase().includes(q) ||
        c.booking.code.toLowerCase().includes(q),
    );
  }, [customers, search]);

  return (
    <div className="space-y-4 pb-14">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900">Customers</h1>
        <p className="mt-1 text-sm text-slate-500">Upcoming & active customer bookings from JVTO and KLOOK.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#d8deef]">
        {(["JVTO", "KLOOK"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "relative px-5 py-3 text-sm font-semibold transition",
              tab === t
                ? "text-[#546dfe] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#546dfe]"
                : "text-slate-500 hover:text-slate-800",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Search + meta */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {pagination ? (
            <>
              <span className="font-semibold text-slate-800">{pagination.total}</span> customers found
            </>
          ) : null}
        </p>
        <div className="flex min-w-[260px] items-center gap-3 rounded-lg bg-[#eef2fa] px-4 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, phone, booking..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="app-table-shell">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-[#d8deef] bg-[#fbfcff]">
              <tr className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Package</th>
                <th className="px-4 py-3">Trip Dates</th>
                <th className="px-4 py-3">Pickup</th>
                <th className="px-4 py-3 text-center">Pax</th>
                <th className="px-4 py-3 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf1f7]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center">
                    <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[#546dfe]" />
                    <p className="text-sm font-medium text-slate-500">Loading customers...</p>
                  </td>
                </tr>
              ) : filteredCustomers.length > 0 ? (
                filteredCustomers.map((c) => (
                  <tr key={`${c.id}-${c.booking.id}`} className="bg-white text-sm text-slate-700 transition hover:bg-[#fafbfe]">
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-800">{c.name}</div>
                      <div className="mt-0.5 text-xs text-slate-400">{c.booking.code}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {c.phone}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">{c.email !== "-" ? c.email : ""}</div>
                    </td>
                    <td className="max-w-[220px] px-4 py-4">
                      <div className="line-clamp-2 font-medium text-slate-800">{c.package.name}</div>
                      <div className="mt-0.5 text-xs text-slate-400">
                        {c.package.code !== "-" ? c.package.code + " · " : ""}
                        {c.package.duration.day}D{c.package.duration.night}N
                        {c.package.link !== "-" && (
                          <a
                            href={c.package.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1.5 inline-flex items-center gap-0.5 text-[#546dfe] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <TripDateBadge start={c.booking.travel_date_start} end={c.booking.travel_date_end} />
                    </td>
                    <td className="px-4 py-4">
                      {c.booking.pickup.location !== "-" ? (
                        <div className="flex items-start gap-1.5 text-xs text-slate-600">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <div>
                            <div>{c.booking.pickup.location}</div>
                            {c.booking.pickup.time !== "-" && (
                              <div className="text-slate-400">{c.booking.pickup.time}</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#eef1ff] text-xs font-bold text-[#546dfe]">
                        {c.booking.numb_of_pax}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => router.push(`/customers/${c.id}`)}
                        className="app-icon-button h-9 w-9"
                        title="View detail"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center">
                    <Users className="mx-auto mb-4 h-10 w-10 text-slate-200" />
                    <p className="text-sm font-medium text-slate-500">
                      {search ? "No customers match your search." : `No ${tab} customers found.`}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-[#d8deef] px-4 py-3 text-sm text-slate-500">
            <p>
              Page <span className="font-semibold text-slate-800">{pagination.current_page}</span> of{" "}
              <span className="font-semibold text-slate-800">{pagination.last_page}</span>
              {" · "}
              <span className="font-semibold text-slate-800">{pagination.total}</span> total
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="app-icon-button h-8 w-8 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= pagination.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="app-icon-button h-8 w-8 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
