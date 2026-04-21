"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { TemplateEditor } from "@/components/template-editor";
import { MediaPicker, type MediaType } from "@/components/media-picker";

function extractVars(text: string): string[] {
  const matches = text.match(/\{([^}]+)\}/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(1, -1).trim()))];
}

export default function NewTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [mediaType, setMediaType] = useState<MediaType | null>(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaFilename, setMediaFilename] = useState("");
  const [varMeta, setVarMeta] = useState<Record<string, { description: string; example: string; isRequired: boolean }>>({});

  const variableNames = useMemo(
    () => extractVars([content, mediaUrl, mediaFilename].join("\n")),
    [content, mediaUrl, mediaFilename],
  );

  const syncVarMeta = (newVars: string[]) => {
    setVarMeta((prev) => {
      const next: typeof prev = {};
      newVars.forEach((n) => {
        next[n] = prev[n] ?? { description: "", example: "", isRequired: false };
      });
      return next;
    });
  };

  const handleContentChange = (v: string) => {
    setContent(v);
    syncVarMeta(extractVars([v, mediaUrl, mediaFilename].join("\n")));
  };
  const handleMediaUrlChange = (v: string) => {
    setMediaUrl(v);
    syncVarMeta(extractVars([content, v, mediaFilename].join("\n")));
  };
  const handleMediaFilenameChange = (v: string) => {
    setMediaFilename(v);
    syncVarMeta(extractVars([content, mediaUrl, v].join("\n")));
  };

  const setVarField = (varName: string, field: string, value: string | boolean) =>
    setVarMeta((prev) => ({
      ...prev,
      [varName]: {
        ...(prev[varName] ?? { description: "", example: "", isRequired: false }),
        [field]: value,
      },
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaUrl.trim()) {
      alert("Isi pesan atau URL media wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const variables = variableNames.map((n) => ({
        name: n,
        description: varMeta[n]?.description ?? "",
        example: varMeta[n]?.example ?? "",
        isRequired: varMeta[n]?.isRequired ?? false,
      }));

      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          content,
          mediaType: mediaType ?? null,
          mediaUrl: mediaUrl.trim() || null,
          mediaFilename: mediaFilename.trim() || null,
          variables,
        }),
      });

      if (res.ok) {
        router.push("/templates");
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error ?? "Gagal membuat template");
      }
    } catch {
      alert("Gagal membuat template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="app-page-header">
        <div className="flex items-start gap-3">
          <Link href="/templates" className="app-icon-button mt-1 h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <span className="app-kicker">Templates</span>
            <h1 className="app-page-title mt-4">Create Template</h1>
            <p className="app-page-description">
              Build a reusable WhatsApp template with dynamic variables and optional media.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="app-card space-y-4 p-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Booking Reminder"
              className="app-input"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Description <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this template is used for"
              className="app-input"
            />
          </div>
        </div>

        <div className="app-card overflow-hidden">
          <div className="border-b border-[#e6eaf4] px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Message Content <span className="font-normal text-slate-400">(text / caption)</span>
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Use <code className="font-mono text-[#546dfe]">{"{variable_name}"}</code> for dynamic values
            </p>
          </div>
          <TemplateEditor value={content} onChange={handleContentChange} variableNames={variableNames} />
        </div>

        <MediaPicker
          mediaType={mediaType}
          mediaUrl={mediaUrl}
          mediaFilename={mediaFilename}
          onMediaTypeChange={setMediaType}
          onMediaUrlChange={handleMediaUrlChange}
          onMediaFilenameChange={handleMediaFilenameChange}
        />

        {variableNames.length > 0 && (
          <div className="app-card overflow-hidden">
            <div className="border-b border-[#e6eaf4] px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-800">Variable Definitions</h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Variables found in your message{mediaType ? " and media fields" : ""}
              </p>
            </div>
            <div className="divide-y divide-[#edf1f7]">
              {variableNames.map((varName) => (
                <div key={varName} className="px-5 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <code className="rounded-md bg-[#eef1ff] px-2 py-0.5 font-mono text-sm text-[#546dfe]">
                      {`{${varName}}`}
                    </code>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={varMeta[varName]?.isRequired ?? false}
                        onChange={(e) => setVarField(varName, "isRequired", e.target.checked)}
                        className="rounded border-gray-300 text-[#546dfe] focus:ring-[#546dfe]"
                      />
                      Required
                    </label>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">Description</label>
                      <input
                        value={varMeta[varName]?.description ?? ""}
                        onChange={(e) => setVarField(varName, "description", e.target.value)}
                        placeholder="What this variable contains"
                        className="app-input"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">Example value</label>
                      <input
                        value={varMeta[varName]?.example ?? ""}
                        onChange={(e) => setVarField(varName, "example", e.target.value)}
                        placeholder="Reference example"
                        className="app-input"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pb-8">
          <Link href="/templates" className="app-button-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !name.trim() || (!content.trim() && !mediaUrl.trim())}
            className="app-button-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Saving..." : "Create Template"}
          </button>
        </div>
      </form>
    </div>
  );
}
