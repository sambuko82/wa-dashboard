"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  File,
  FileText,
  ImageIcon,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  Video,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateVar {
  id: string;
  name: string;
  description?: string;
  example?: string;
  isRequired: boolean;
}

interface Template {
  id: string;
  name: string;
  content: string;
  description?: string;
  isActive: boolean;
  mediaType?: "image" | "video" | "document" | null;
  createdAt: string;
  variables: TemplateVar[];
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) setTemplates(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Remove this template? This action cannot be reversed.")) return;
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (res.ok) setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.description ?? "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <Loader2 className="mb-4 h-9 w-9 animate-spin text-[#546dfe]" />
        <p className="text-sm font-semibold">Loading message templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <section className="app-page-header">
        <div>
          <span className="app-kicker">Message library</span>
          <h1 className="app-page-title mt-4">Templates</h1>
          <p className="app-page-description">
            Organize reusable messages, media payloads, and variable-driven
            content in a cleaner content library.
          </p>
        </div>
        <Link href="/templates/new" className="app-button-primary">
          <Plus className="h-4 w-4" />
          Create template
        </Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="app-card flex items-center gap-3 p-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f8fafc]">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search templates by name, description, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="app-card-soft flex items-center gap-4 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Total templates
            </p>
            <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">
              {templates.length}
            </p>
          </div>
        </div>
      </section>

      {filtered.length === 0 ? (
        <section className="app-card py-24 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.25rem] bg-[#eef1ff]">
            <FileText className="h-10 w-10 text-[#546dfe]" />
          </div>
          <h2 className="mt-6 text-2xl font-black tracking-[-0.04em] text-slate-900">
            {searchTerm ? "No matching templates" : "Template library is empty"}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            {searchTerm
              ? "Try a broader keyword or clear the filter to see all templates."
              : "Create your first reusable message template to keep campaigns and support replies consistent."}
          </p>
        </section>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => (
            <article key={t.id} className="app-card flex h-full flex-col p-6">
              <div className="mb-6 flex items-start justify-between gap-3">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl",
                    t.isActive ? "bg-[#eef1ff]" : "bg-[#f8fafc]",
                  )}
                >
                  {t.mediaType === "image" ? (
                    <ImageIcon className="h-5 w-5 text-[#546dfe]" />
                  ) : t.mediaType === "video" ? (
                    <Video className="h-5 w-5 text-sky-600" />
                  ) : t.mediaType === "document" ? (
                    <File className="h-5 w-5 text-amber-600" />
                  ) : (
                    <MessageSquare className="h-5 w-5 text-slate-500" />
                  )}
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                    t.isActive
                      ? "border-[#cfd7ff] bg-[#eef1ff] text-[#4358d8]"
                      : "border-[#e2e8f0] bg-[#f8fafc] text-slate-500",
                  )}
                >
                  {t.isActive ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  {t.isActive ? "Active" : "Disabled"}
                </span>
              </div>

              <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-900">
                {t.name}
              </h2>
              {t.description && (
                <p className="mt-3 text-sm leading-6 text-slate-500">{t.description}</p>
              )}

              <div className="mt-5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4">
                <p className="line-clamp-4 text-sm leading-6 text-slate-600">{t.content}</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {t.variables.length > 0 ? (
                  t.variables.map((v) => (
                    <span
                      key={v.id}
                      className="rounded-full border border-[#f2e2af] bg-[#fff7dc] px-3 py-1 text-xs font-semibold text-[#8c5a17]"
                    >
                      {v.name}
                    </span>
                  ))
                ) : (
                  <span className="app-pill">Static content</span>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[#eef3f8] pt-5">
                <p className="text-xs font-medium text-slate-400">
                  Updated {new Date(t.createdAt).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-2">
                  <Link href={`/templates/${t.id}/edit`} className="app-button-secondary px-4 py-2.5">
                    Edit
                  </Link>
                  <button onClick={() => deleteTemplate(t.id)} className="app-icon-button">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
