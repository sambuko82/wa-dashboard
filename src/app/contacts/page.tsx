"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ListFilter,
  Loader2,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Tag,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Label {
  id: string;
  name: string;
  color: string;
  _count?: { contacts: number };
}

interface Contact {
  id: string;
  phoneNumber: string;
  name: string | null;
  email: string | null;
  notes: string | null;
  labels: Label[];
  _count: {
    messages: number;
  };
  createdAt: string;
}

function formatDateBadge(date: string) {
  const value = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - value.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { label: "Today", tone: "bg-[#fff0de] text-[#d97706]" };
  }

  if (diffDays <= 7) {
    return {
      label: value.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      tone: "bg-[#e8fbf1] text-[#14a05a]",
    };
  }

  return {
    label: value.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    tone: "bg-[#ffe9ec] text-[#ef4444]",
  };
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [waNumbers, setWaNumbers] = useState<Array<{ id: string; label: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [labelName, setLabelName] = useState("");
  const [labelColor, setLabelColor] = useState("#546dfe");
  const [savingLabel, setSavingLabel] = useState(false);

  const [formData, setFormData] = useState({
    waNumberId: "",
    phoneNumber: "",
    name: "",
    email: "",
    notes: "",
    labelIds: [] as string[],
  });

  const fetchData = async () => {
    try {
      const [conRes, labRes, numRes] = await Promise.all([
        fetch("/api/contacts"),
        fetch("/api/labels"),
        fetch("/api/numbers"),
      ]);
      const conData = await conRes.json();
      const labData = await labRes.json();
      const numData = await numRes.json();

      setContacts(Array.isArray(conData) ? conData : []);
      setLabels(Array.isArray(labData) ? labData : []);
      setWaNumbers(Array.isArray(numData) ? numData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          waNumberId: "",
          phoneNumber: "",
          name: "",
          email: "",
          notes: "",
          labelIds: [],
        });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labelName.trim()) return;
    setSavingLabel(true);
    try {
      const res = await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: labelName, color: labelColor }),
      });
      if (res.ok) {
        setLabelName("");
        setIsLabelModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingLabel(false);
    }
  };

  const toggleLabelSelection = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      labelIds: prev.labelIds.includes(id)
        ? prev.labelIds.filter((lid) => lid !== id)
        : [...prev.labelIds, id],
    }));
  };

  const toggleLabelFilter = (id: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const visibleLabels = useMemo(() => {
    return labels.filter((label) =>
      label.name.toLowerCase().includes(filterSearch.toLowerCase()),
    );
  }, [labels, filterSearch]);

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesSearch =
        (contact.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (contact.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
        contact.phoneNumber.includes(search);

      const matchesLabels =
        selectedLabelIds.length === 0 ||
        selectedLabelIds.every((id) => contact.labels.some((label) => label.id === id));

      return matchesSearch && matchesLabels;
    });
  }, [contacts, search, selectedLabelIds]);

  return (
    <div className="space-y-4 pb-14">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900">Contacts</h1>
          <p className="mt-1 text-sm text-slate-500">Manage customer records and communication history.</p>
        </div>
      </div>

      <div className="flex items-center gap-3 border-b border-[#d8deef] pb-3">
        <div className="rounded-lg bg-[#eef2fa] px-4 py-2 text-sm font-semibold text-slate-700">
          All Contacts
        </div>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="text-sm text-slate-500">
          {selectedLabelIds.length > 0
            ? `${selectedLabelIds.length} active filter${selectedLabelIds.length > 1 ? "s" : ""}`
            : "Browse and filter your contact records"}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex min-w-[240px] items-center gap-3 rounded-lg bg-[#eef2fa] px-4 py-2.5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="app-button-primary min-w-[174px]">
            Create Contact
          </button>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[286px_minmax(0,1fr)]">
        <aside className="app-table-shell p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[13px] font-semibold text-slate-800">Filter Contacts by</h2>
            <button
              onClick={() => setIsLabelModalOpen(true)}
              className="text-xs font-semibold text-[#546dfe] transition hover:text-[#3d57ee]"
            >
              Manage labels
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-lg border border-[#cfd7ea] bg-white px-3 py-2.5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ListFilter className="h-4 w-4" />
              System Defined Filters
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setSelectedLabelIds([])}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm transition",
                  selectedLabelIds.length === 0 ? "bg-[#eef2fa] text-slate-900" : "text-slate-600 hover:bg-slate-50",
                )}
              >
                <span>All Contacts</span>
                <span className="text-xs font-semibold text-slate-400">{contacts.length}</span>
              </button>
              {visibleLabels.map((label) => {
                const active = selectedLabelIds.includes(label.id);
                return (
                  <label
                    key={label.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <div
                      onClick={() => toggleLabelFilter(label.id)}
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                        active
                          ? "border-[#546dfe] bg-[#eef1ff] text-[#546dfe]"
                          : "border-[#cfd7ea] bg-white text-transparent",
                      )}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} />
                        <span>{label.name}</span>
                      </div>
                    </div>
                  </label>
                );
              })}
              {visibleLabels.length === 0 && (
                <p className="text-sm text-slate-400">No matching labels.</p>
              )}
            </div>
          </div>
        </aside>

        <section className="app-table-shell">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-[#d8deef] bg-[#fbfcff]">
                <tr className="text-sm font-semibold text-slate-800">
                  <th className="w-12 px-4 py-3">
                    <div className="h-5 w-5 rounded border border-[#cfd7ea]" />
                  </th>
                  <th className="w-[130px] px-3 py-3 text-slate-500">Follow-up</th>
                  <th className="px-3 py-3">Contact Name</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Phone</th>
                  <th className="px-3 py-3">Labels</th>
                  <th className="px-3 py-3 text-right">Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1f7]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-24 text-center">
                      <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[#546dfe]" />
                      <p className="text-sm font-medium text-slate-500">Loading contacts...</p>
                    </td>
                  </tr>
                ) : filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => {
                    const badge = formatDateBadge(contact.createdAt);
                    return (
                      <tr key={contact.id} className="bg-white text-sm text-slate-700 transition hover:bg-[#fafbfe]">
                        <td className="px-4 py-4">
                          <div className="h-5 w-5 rounded border border-[#cfd7ea]" />
                        </td>
                        <td className="px-3 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-r-md rounded-l-sm px-2.5 py-1 text-sm font-semibold",
                              badge.tone,
                            )}
                          >
                            <CalendarDays className="h-3.5 w-3.5" />
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <div className="font-medium text-slate-800">
                            {contact.name || "Unnamed Contact"}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            {contact._count.messages} messages
                          </div>
                        </td>
                        <td className="px-3 py-4 text-slate-600">
                          {contact.email || "no-email@invalid"}
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-2 text-slate-700">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            +{contact.phoneNumber}
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex flex-wrap gap-1.5">
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
                              <span className="text-xs text-slate-400">No labels</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-right">
                          <button
                            onClick={() => (window.location.href = `/contacts/${contact.id}`)}
                            className="app-icon-button h-9 w-9"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-24 text-center">
                      <Users className="mx-auto mb-4 h-10 w-10 text-slate-200" />
                      <p className="text-sm font-medium text-slate-500">
                        No contacts found for the current filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[#d8deef] px-4 py-3 text-sm text-slate-500">
            <p>
              Total Records <span className="font-semibold text-slate-800">{filteredContacts.length}</span>
            </p>
            <p>1 to {filteredContacts.length}</p>
          </div>
        </section>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/28 p-4 backdrop-blur-sm">
          <div className="app-card w-full max-w-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#e6eaf4] px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Create Contact</h2>
                <p className="mt-1 text-sm text-slate-500">Add a new CRM contact record.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="app-icon-button h-9 w-9">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  WhatsApp Channel
                </label>
                <select
                  required
                  value={formData.waNumberId}
                  onChange={(e) => setFormData({ ...formData, waNumberId: e.target.value })}
                  className="app-select"
                >
                  <option value="">Select Account...</option>
                  {waNumbers.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Phone Number
                  </label>
                  <input
                    required
                    placeholder="628123..."
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="app-input"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Full Name
                  </label>
                  <input
                    placeholder="Customer name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="app-input"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Labels
                </label>
                <div className="flex flex-wrap gap-2 rounded-lg border border-[#e6eaf4] bg-[#fafbfe] p-3">
                  {labels.map((label) => {
                    const active = formData.labelIds.includes(label.id);
                    return (
                      <button
                        key={label.id}
                        type="button"
                        onClick={() => toggleLabelSelection(label.id)}
                        className={cn(
                          "rounded-md border px-2.5 py-1.5 text-xs font-semibold transition",
                          active
                            ? "text-white"
                            : "border-[#d3dbec] bg-white text-slate-600 hover:border-[#bcc8df]",
                        )}
                        style={
                          active
                            ? {
                                backgroundColor: label.color,
                                borderColor: label.color,
                              }
                            : undefined
                        }
                      >
                        {label.name}
                      </button>
                    );
                  })}
                  {labels.length === 0 && <p className="text-sm text-slate-400">Create labels first.</p>}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Notes
                </label>
                <textarea
                  rows={4}
                  placeholder="Internal notes about this contact"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="app-textarea"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="app-button-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="app-button-primary min-w-[140px]">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLabelModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/28 p-4 backdrop-blur-sm">
          <div className="app-card w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#e6eaf4] px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Create Label</h2>
              <button onClick={() => setIsLabelModalOpen(false)} className="app-icon-button h-9 w-9">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateLabel} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Label Name
                </label>
                <input
                  required
                  placeholder="VIP Client"
                  value={labelName}
                  onChange={(e) => setLabelName(e.target.value)}
                  className="app-input"
                />
              </div>
              <div>
                <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Color
                </label>
                <div className="grid grid-cols-6 gap-3">
                  {["#546dfe", "#14a05a", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9"].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setLabelColor(color)}
                      className={cn(
                        "aspect-square rounded-lg border-2 transition",
                        labelColor === color ? "scale-105 border-slate-900" : "border-transparent opacity-70",
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLabelModalOpen(false)}
                  className="app-button-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={savingLabel} className="app-button-primary min-w-[130px]">
                  {savingLabel ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
                  Save Label
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
