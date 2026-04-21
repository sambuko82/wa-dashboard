"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  Edit,
  FileText,
  Image,
  Trash2,
  Video,
} from "lucide-react";
import Link from "next/link";

interface Template {
  id: string;
  name: string;
  content: string;
  description?: string;
  isActive: boolean;
  mediaType?: string | null;
  mediaUrl?: string | null;
  mediaFilename?: string | null;
  createdAt: string;
  updatedAt: string;
  variables: Array<{
    id: string;
    name: string;
    description?: string;
    example?: string;
    isRequired: boolean;
  }>;
  user: { id: string; name: string; email: string };
}

function renderPreview(text: string): string {
  let s = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  s = s
    .replace(/```([\s\S]*?)```/g, '<code class="font-mono text-xs bg-[#eef1ff] rounded px-0.5">$1</code>')
    .replace(/\*([^*\n]+)\*/g, "<strong>$1</strong>")
    .replace(/_([^_\n]+)_/g, "<em>$1</em>")
    .replace(/~([^~\n]+)~/g, "<del>$1</del>")
    .replace(/\{([^}]+)\}/g, '<span class="inline-block bg-[#eef1ff] text-[#546dfe] font-mono text-xs rounded px-1 mx-0.5">{$1}</span>')
    .replace(/\n/g, "<br/>");
  return s;
}

export default function TemplateDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/templates/${id}`)
      .then((r) => r.json())
      .then(setTemplate)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const deleteTemplate = async () => {
    if (!confirm("Hapus template ini?")) return;
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/templates");
    else alert("Gagal menghapus template");
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#546dfe]" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-slate-500">Template not found</p>
        <Link href="/templates" className="mt-2 inline-block text-sm font-medium text-[#546dfe]">
          Back to templates
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="app-page-header">
        <div className="flex items-start gap-3">
          <Link href="/templates" className="app-icon-button mt-1 h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <span className="app-kicker">Templates</span>
            <div className="mt-4 flex items-center gap-2">
              <h1 className="app-page-title">{template.name}</h1>
              {!template.isActive && (
                <span className="rounded-md bg-[#f2f5fb] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Inactive
                </span>
              )}
            </div>
            {template.description && <p className="app-page-description">{template.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/templates/${id}/edit`} className="app-button-secondary">
            <Edit className="h-4 w-4" />
            Edit
          </Link>
          <button onClick={deleteTemplate} className="app-icon-button text-red-500 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-5">
          <div className="app-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Message Content</h2>
              <button
                onClick={() => copy(template.content)}
                className="app-button-secondary px-3 py-2 text-xs"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-[#546dfe]" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="whitespace-pre-wrap rounded-lg border border-[#e6eaf4] bg-[#fafbfe] px-4 py-3 text-sm text-slate-700">
              {template.content}
            </pre>
          </div>

          <div className="app-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-800">Preview</h2>
            <div className="max-w-sm rounded-lg border border-[#d8deef] bg-[#f7f9fd] px-4 py-3 text-sm text-slate-800">
              <div dangerouslySetInnerHTML={{ __html: renderPreview(template.content) }} className="leading-relaxed" />
            </div>
          </div>

          {template.variables.length > 0 && (
            <div className="app-card overflow-hidden">
              <div className="border-b border-[#e6eaf4] px-5 py-4">
                <h2 className="text-sm font-semibold text-slate-800">Variables ({template.variables.length})</h2>
              </div>
              <div className="divide-y divide-[#edf1f7]">
                {template.variables.map((v) => (
                  <div key={v.id} className="flex items-start gap-4 px-5 py-4">
                    <code className="mt-0.5 rounded-md bg-[#eef1ff] px-2 py-0.5 font-mono text-sm text-[#546dfe]">
                      {`{${v.name}}`}
                    </code>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        {v.isRequired && (
                          <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                            Required
                          </span>
                        )}
                        {v.description && <span className="text-sm text-slate-700">{v.description}</span>}
                      </div>
                      {v.example && (
                        <p className="text-xs text-slate-400">
                          Example: <span className="font-mono text-slate-600">{v.example}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <div className="app-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-800">Meta</h2>
            <div className="grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-1">
              {[
                ["Template ID", template.id, true],
                ["Created by", template.user.name, false],
                ["Created", new Date(template.createdAt).toLocaleDateString(), false],
                ["Updated", new Date(template.updatedAt).toLocaleDateString(), false],
              ].map(([label, val, mono]) => (
                <div key={label as string}>
                  <p className="mb-1 text-xs uppercase tracking-[0.12em] text-slate-400">{label}</p>
                  <p className={`truncate text-slate-800 ${mono ? "font-mono text-xs" : ""}`}>{val}</p>
                </div>
              ))}
            </div>
          </div>

          {template.mediaType && (
            <div className="app-card p-5">
              <h2 className="mb-4 text-sm font-semibold text-slate-800">Media Attachment</h2>
              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex items-center gap-3">
                  {template.mediaType === "image" && <Image className="h-5 w-5 text-[#546dfe]" />}
                  {template.mediaType === "file" && <FileText className="h-5 w-5 text-[#546dfe]" />}
                  {template.mediaType === "video" && <Video className="h-5 w-5 text-[#546dfe]" />}
                  <span className="font-medium capitalize">{template.mediaType}</span>
                </div>
                {template.mediaUrl && (
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-[0.12em] text-slate-400">URL</p>
                    <code className="break-all font-mono text-xs text-slate-700">{template.mediaUrl}</code>
                  </div>
                )}
                {template.mediaFilename && (
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-[0.12em] text-slate-400">Filename</p>
                    <code className="font-mono text-xs text-slate-700">{template.mediaFilename}</code>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="app-card overflow-hidden">
            <div className="border-b border-[#e6eaf4] px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-800">Use via API</h2>
              <p className="mt-0.5 text-xs text-slate-400">POST /api/v1/send_template</p>
            </div>
            <div className="px-5 py-4">
              <pre className="overflow-auto whitespace-pre rounded-lg border border-[#e6eaf4] bg-[#fafbfe] px-4 py-3 text-xs text-slate-700">{`{
  "api_key": "YOUR-API-KEY",
  "number_key": "YOUR-NUMBER-KEY",
  "phone_no": "628123456789",
  "template_id": "${template.id}",
  "variables": {
${template.variables.map((v) => `    "${v.name}": "${v.example ?? "value"}"`).join(",\n")}
  }
}`}</pre>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
