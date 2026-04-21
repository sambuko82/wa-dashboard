"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft, QrCode, RefreshCw, LogOut, CheckCircle2,
  Send, Webhook, Key, Copy, Check, Loader2,
  MessageSquare, Image as ImageIcon, Video, FileText, Users,
  Play, Music, Archive, File,
  Bell, BookOpen, Pencil, Plus, Save, Trash2, X,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/lib/wa-client";

type Tab = "connection" | "send" | "groups" | "webhook" | "api" | "profile";

interface WaNumberNote {
  id: string;
  content: string;
  createdAt: string;
}

interface WaNumberReminder {
  id: string;
  description: string;
  dueDate: string;
  isCompleted: boolean;
}

interface NumberInfo {
  id: string;
  label: string;
  apiKey: string;
  userApiKey?: string | null;
  webhookUrl: string | null;
  phoneNumber: string | null;
  status: ConnectionStatus;
  user?: { id: string; name: string; email: string };
  qr?: string | null;
  stats?: { sent: number; received: number };
  description?: string | null;
}

interface Message {
  id: string;
  direction: "IN" | "OUT";
  toFrom: string;
  content: string | null;
  mediaType: string | null;
  createdAt: string;
}

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="text-slate-400 transition-colors hover:text-slate-700">
      {copied ? <Check className="w-4 h-4 text-[#546dfe]" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

// ─── Connection Tab ───────────────────────────────────────────────────────────
function ConnectionTab({
  numberId, info, reload, onConnect,
}: {
  numberId: string;
  info: NumberInfo;
  reload: () => void;
  onConnect: () => void;
}) {
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Clear spinner once QR or connected state arrives via SSE
  useEffect(() => {
    if (info.qr || info.status === "connected" || info.status === "disconnected") {
      setConnecting(false);
    }
  }, [info.qr, info.status]);

  const connect = async () => {
    setConnecting(true);
    // POST to start the connection, then SSE will stream QR/status updates.
    // onConnect() also reopens SSE in case it was closed.
    onConnect();
    await fetch(`/api/numbers/${numberId}/connect`, { method: "POST" }).catch(() => {});
  };

  const disconnect = async () => {
    if (!confirm("Disconnect this number? You'll need to scan QR again.")) return;
    setDisconnecting(true);
    await fetch(`/api/numbers/${numberId}/disconnect`, { method: "POST" });
    reload();
    setDisconnecting(false);
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="app-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#eef3f8] px-6 py-4">
          <span className="text-sm font-medium text-slate-500">Connection Status</span>
          <StatusBadge status={info.status} />
        </div>

        <div className="p-8 flex flex-col items-center">
          {info.status === "connected" ? (
            <div className="flex flex-col items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#cfd7ff] bg-[#eef1ff]">
                <CheckCircle2 className="h-10 w-10 text-[#546dfe]" />
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-slate-900">Connected</p>
                {info.phoneNumber && (
                  <p className="mt-1 text-sm text-slate-500">+{info.phoneNumber}</p>
                )}
              </div>
              <button
                onClick={disconnect}
                disabled={disconnecting}
                className="app-button-secondary border-red-200 text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                {disconnecting ? "Disconnecting..." : "Disconnect"}
              </button>
            </div>
          ) : info.status === "connecting" && !info.qr ? (
            <div className="flex flex-col items-center gap-5 py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-yellow-200 bg-yellow-50">
                <RefreshCw className="h-8 w-8 animate-spin text-yellow-600" />
              </div>
              <p className="font-semibold text-slate-900">Initializing...</p>
            </div>
          ) : info.qr ? (
            <div className="flex flex-col items-center gap-6">
              <div className="rounded-lg border border-[#d8deef] bg-[#f8fafc] p-4">
                <Image src={info.qr} alt="QR Code" width={260} height={260} unoptimized />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-900">Scan this QR code</p>
                <p className="mt-1 text-xs text-slate-400">
                  WhatsApp → More options → Linked devices → Link a device
                </p>
              </div>
              <button
                onClick={connect}
                disabled={connecting}
                className="app-button-secondary"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${connecting ? "animate-spin" : ""}`} />
                Refresh QR
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 py-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#d8deef] bg-[#f8fafc]">
                <QrCode className="h-10 w-10 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-900">Not Connected</p>
                <p className="mt-1 text-sm text-slate-500">
                  Click below to generate a QR code
                </p>
              </div>
              <button
                onClick={connect}
                disabled={connecting}
                className="app-button-primary disabled:opacity-60"
              >
                <QrCode className="w-4 h-4" />
                {connecting ? "Generating..." : "Generate QR Code"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── WA preview renderer ──────────────────────────────────────────────────────
function renderWAPreview(text: string, vars: Record<string, string> = {}): string {
  let s = text.replace(/\{([^}]+)\}/g, (_, name) => {
    const val = vars[name.trim()];
    return val
      ? `<span>${val.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</span>`
      : `<span class="inline-block bg-amber-100 text-amber-700 font-mono text-xs rounded px-1 mx-0.5">{${name}}</span>`;
  });
  s = s
    .replace(/```([\s\S]*?)```/g, "<code class=\"font-mono text-xs bg-black/10 rounded px-0.5\">$1</code>")
    .replace(/\*([^*\n]+)\*/g, "<strong>$1</strong>")
    .replace(/_([^_\n]+)_/g, "<em>$1</em>")
    .replace(/~([^~\n]+)~/g, "<del>$1</del>")
    .replace(/\n/g, "<br/>");
  return s;
}

// ─── WA media preview bubble ──────────────────────────────────────────────────
function getFileIcon(filename?: string | null) {
  const ext = filename?.split(".").pop()?.toLowerCase() ?? "";
  if (["mp3","wav","ogg","m4a","aac"].includes(ext)) return <Music className="w-7 h-7 text-[#54656f]" />;
  if (["zip","rar","7z","tar","gz"].includes(ext))   return <Archive className="w-7 h-7 text-[#54656f]" />;
  return <File className="w-7 h-7 text-[#54656f]" />;
}

function WAMediaPreview({
  mediaType, mediaUrl, filename,
}: {
  mediaType: string;
  mediaUrl: string | null;
  filename?: string | null;
}) {
  const [imgError, setImgError] = useState(false);

  if (mediaType === "image") {
    const src = mediaUrl?.trim();
    if (src && !imgError) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="preview"
          className="w-full max-h-52 object-cover rounded-lg mb-1"
          onError={() => setImgError(true)}
        />
      );
    }
    return (
      <div className="w-full h-36 rounded-lg bg-gray-200 flex flex-col items-center justify-center mb-1 gap-1">
        <ImageIcon className="w-8 h-8 text-gray-400" />
        {!src && <p className="text-gray-400 text-xs">Image URL not set</p>}
        {imgError && <p className="text-gray-400 text-xs">Could not load image</p>}
      </div>
    );
  }

  if (mediaType === "video") {
    return (
      <div className="w-full h-36 rounded-lg bg-gray-900 flex flex-col items-center justify-center mb-1 gap-2 relative overflow-hidden">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
          <Play className="w-6 h-6 text-white ml-0.5" />
        </div>
        <p className="text-white/60 text-xs">Video</p>
      </div>
    );
  }

  if (mediaType === "file") {
    const ext = filename?.split(".").pop()?.toUpperCase() ?? "FILE";
    return (
      <div className="flex items-center gap-3 bg-black/5 rounded-lg px-3 py-2.5 mb-1">
        {getFileIcon(filename)}
        <div className="min-w-0">
          <p className="text-[#111b21] text-sm font-medium truncate">{filename || "document"}</p>
          <p className="text-[#54656f] text-xs">{ext} · Document</p>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Send Tab ────────────────────────────────────────────────────────────────
interface TemplateDetail {
  id: string;
  name: string;
  content: string;
  description?: string | null;
  mediaType?: string | null;
  mediaUrl?: string | null;
  mediaFilename?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variables: Array<{ name: string; isRequired: boolean; description?: string | null; example?: string | null }>;
}

function SendTab({ numberId, connected, initialTo = "" }: { numberId: string; connected: boolean; initialTo?: string }) {
  type MsgType = "text" | "image" | "video" | "document" | "template";
  const [msgType, setMsgType] = useState<MsgType>("text");
  const [to, setTo] = useState(initialTo);

  useEffect(() => {
    if (initialTo) setTo(initialTo);
  }, [initialTo]);

  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [filename, setFilename] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDetail | null>(null);
  const [loadingTpl, setLoadingTpl] = useState(false);

  // Fetch template list when tab opened
  useEffect(() => {
    if (msgType === "template" && templates.length === 0) {
      fetch("/api/templates")
        .then(res => res.json())
        .then(data => Array.isArray(data) ? setTemplates(data) : null)
        .catch(() => {});
    }
  }, [msgType, templates.length]);

  // Fetch full template details when selection changes
  useEffect(() => {
    if (!templateId) { setSelectedTemplate(null); return; }
    setLoadingTpl(true);
    fetch(`/api/templates/${templateId}`)
      .then(res => res.json())
      .then((data: TemplateDetail) => {
        setSelectedTemplate(data);
        // Reset variables to empty map
        setTemplateVariables({});
      })
      .catch(() => {})
      .finally(() => setLoadingTpl(false));
  }, [templateId]);

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSend = async () => {
    if (!to.trim()) return;
    setSending(true);
    setResult(null);
    try {
      let res;
      if (msgType === "text") {
        res = await fetch(`/api/numbers/${numberId}/send/text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: to.trim(), text }),
        });
      } else if (msgType === "template") {
        if (!templateId) {
          setResult({ ok: false, msg: "Please select a template" });
          setSending(false);
          return;
        }
        res = await fetch(`/api/numbers/${numberId}/send/template`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: to.trim(), templateId, variables: templateVariables }),
        });
      } else {
        res = await fetch(`/api/numbers/${numberId}/send/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: to.trim(), url, type: msgType, caption, filename }),
        });
      }
      const data = await res!.json();
      setResult({ ok: res!.ok, msg: res!.ok ? "Message sent successfully!" : (data.error ?? "Failed") });
    } catch {
      setResult({ ok: false, msg: "Network error" });
    } finally {
      setSending(false);
    }
  };

  const tabs: { type: MsgType; icon: React.ElementType; label: string }[] = [
    { type: "text", icon: MessageSquare, label: "Text" },
    { type: "image", icon: ImageIcon, label: "Image" },
    { type: "video", icon: Video, label: "Video" },
    { type: "document", icon: FileText, label: "Document" },
    { type: "template", icon: FileText, label: "Template" },
  ];

  const inputCls = "app-input";

  // Resolve preview values
  const resolveVars = (s: string) =>
    s.replace(/\{([^}]+)\}/g, (_, n) => templateVariables[n.trim()] || "");

  const previewText = msgType === "template"
    ? (selectedTemplate?.content ?? "")
    : msgType === "text" ? text : "";

  const resolvedMediaUrl = selectedTemplate?.mediaUrl
    ? resolveVars(selectedTemplate.mediaUrl) || selectedTemplate.mediaUrl
    : null;

  const resolvedFilename = selectedTemplate?.mediaFilename
    ? resolveVars(selectedTemplate.mediaFilename) || selectedTemplate.mediaFilename
    : null;

  const showPreview = (msgType === "text" && text.trim()) ||
    (msgType === "template" && !!selectedTemplate);

  const previewVars = msgType === "template" ? templateVariables : {};

  return (
    <div className="space-y-4">
      {!connected && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
          <p className="text-amber-700 text-sm">Connect your WhatsApp first to send messages.</p>
        </div>
      )}

      <div className={cn("gap-4", showPreview ? "grid grid-cols-1 lg:grid-cols-2" : "flex flex-col max-w-xl mx-auto w-full")}>
        {/* ── Form ── */}
        <div className="app-card p-5">
          {/* Type tabs */}
          <div className="mb-5 flex gap-1 rounded-lg bg-[#f3f5fb] p-1">
            {tabs.map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => setMsgType(type)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all",
                  msgType === type ? "bg-[#546dfe] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* To */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Penerima</label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="628123456789 atau 120363xxxxxx@g.us"
              className={inputCls}
            />
          </div>

          {/* Text */}
          {msgType === "text" && (
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Pesan</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                placeholder="Ketik pesan..."
                className={inputCls + " resize-none"}
              />
            </div>
          )}

          {/* Template */}
          {msgType === "template" && (
            <div className="space-y-3 mb-4">
              <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500">Template</label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className={inputCls + " cursor-pointer"}
                >
                  <option value="">— Pilih template —</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {loadingTpl && (
                  <div className="flex items-center gap-2 py-1 text-xs text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading...
                </div>
              )}

              {selectedTemplate && !loadingTpl && (
                <>
                  {selectedTemplate.description && (
                    <p className="rounded-lg border border-[#e5ebf5] bg-[#f8fafc] px-3 py-2 text-xs text-slate-500">
                      {selectedTemplate.description}
                    </p>
                  )}
                  {selectedTemplate.variables.length > 0 && (
                    <div className="space-y-3 pt-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Variabel</p>
                      {selectedTemplate.variables.map(v => (
                        <div key={v.name}>
                          <label className="mb-1.5 flex items-center gap-1.5 text-xs text-slate-600">
                            <code className="rounded bg-[#eef1ff] px-1.5 py-0.5 font-mono text-[#4358d8]">{`{${v.name}}`}</code>
                            {v.isRequired && <span className="text-red-400 font-medium">*</span>}
                            {v.description && <span className="text-slate-400">· {v.description}</span>}
                          </label>
                          <input
                            value={templateVariables[v.name] ?? ""}
                            onChange={(e) => setTemplateVariables(prev => ({ ...prev, [v.name]: e.target.value }))}
                            placeholder={v.example ?? `Isi ${v.name}...`}
                            className={inputCls}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Media URL */}
          {msgType !== "text" && msgType !== "template" && (
            <>
              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  URL {msgType === "image" ? "Gambar" : msgType === "video" ? "Video" : "File"}
                </label>
                <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className={inputCls} />
              </div>
              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Caption (opsional)</label>
                <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption..." className={inputCls} />
              </div>
              {msgType === "document" && (
                <div className="mb-3">
                  <label className="mb-1.5 block text-xs font-medium text-slate-500">Nama File (opsional)</label>
                  <input value={filename} onChange={(e) => setFilename(e.target.value)} placeholder="dokumen.pdf" className={inputCls} />
                </div>
              )}
            </>
          )}

          {result && (
            <div className={cn(
              "rounded-xl px-4 py-3 mb-4 flex items-center gap-2",
              result.ok ? "border border-[#cfd7ff] bg-[#eef1ff]" : "bg-red-50 border border-red-200"
            )}>
              <div className={cn("h-1.5 w-1.5 flex-shrink-0 rounded-full", result.ok ? "bg-[#546dfe]" : "bg-red-500")} />
              <p className={result.ok ? "text-sm font-medium text-[#4358d8]" : "text-sm text-red-600"}>
                {result.msg}
              </p>
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={!connected || sending}
            className="app-button-primary w-full disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Mengirim..." : "Kirim Pesan"}
          </button>
        </div>

        {/* ── WA Preview ── */}
        {showPreview && (
          <div className="flex flex-col">
            <p className="mb-2 px-0.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Preview WhatsApp</p>
            {/* Phone frame */}
            <div className="app-card flex-1 overflow-hidden">
              {/* WA chat header */}
              <div className="bg-[#128C7E] px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{to.trim() || "Penerima"}</p>
                  <p className="text-white/60 text-xs">online</p>
                </div>
              </div>
              {/* Chat area */}
              <div
                className="p-4 min-h-[200px]"
                style={{ backgroundColor: "#e5ddd5" }}
              >
                <div className="flex justify-end">
                  <div className="bg-[#d9fdd3] rounded-xl rounded-tr-sm px-3 py-2 max-w-[85%] shadow-sm min-w-[120px]">
                    {/* Media preview */}
                    {selectedTemplate?.mediaType && (
                      <WAMediaPreview
                        mediaType={selectedTemplate.mediaType}
                        mediaUrl={resolvedMediaUrl}
                        filename={resolvedFilename}
                      />
                    )}
                    {/* Text */}
                    {previewText && (
                      <p
                        className="text-[#111b21] text-sm leading-relaxed break-words"
                        dangerouslySetInnerHTML={{ __html: renderWAPreview(previewText, previewVars) }}
                      />
                    )}
                    {/* Timestamp */}
                    <p className="text-[#54656f] text-[10px] text-right mt-1">
                      {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      {" ✓✓"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Webhook Tab ─────────────────────────────────────────────────────────────
function WebhookTab({ numberId, initialUrl }: { numberId: string; initialUrl: string | null }) {
  const [webhookUrl, setWebhookUrl] = useState(initialUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/numbers/${numberId}/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ webhookUrl }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputCls = "app-input flex-1";

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="app-card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-800">
          <Webhook className="w-4 h-4 text-[#546dfe]" />
          Webhook URL
        </h2>
        <div className="flex gap-3">
          <input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-server.com/webhook"
            className={inputCls}
          />
          <button
            onClick={save}
            disabled={saving}
            className={cn(
              "rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
              saved
                ? "bg-[#546dfe] text-white"
                : "bg-slate-900 text-white hover:bg-slate-700"
            )}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? "Saved!" : "Save"}
          </button>
        </div>
        <p className="text-gray-400 text-xs mt-2">
          Incoming messages will be forwarded as POST to this URL.
        </p>

        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
            <p className="mb-1 text-xs font-mono text-slate-500">Teks (<code className="text-slate-700">conversation</code>)</p>
            <pre className="overflow-x-auto text-xs font-mono text-[#4358d8]">{`{ "event": "message", "data": {
  "from": "628xxx@s.whatsapp.net", "fromMe": false,
  "type": "conversation", "text": "Halo!", "timestamp": 1234567890
}}`}</pre>
          </div>
          <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
            <p className="mb-1 text-xs font-mono text-slate-500">Gambar / Video / Stiker</p>
            <pre className="overflow-x-auto text-xs font-mono text-[#4358d8]">{`{ "event": "message", "data": {
  "from": "628xxx@s.whatsapp.net", "type": "imageMessage",
  "text": "caption jika ada",
  "media": { "url": "https://mmg.whatsapp.net/...",
    "mimetype": "image/jpeg", "fileSize": 123456 }
}}`}</pre>
          </div>
          <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
            <p className="mb-1 text-xs font-mono text-slate-500">Audio / Voice note</p>
            <pre className="overflow-x-auto text-xs font-mono text-[#4358d8]">{`{ "event": "message", "data": {
  "type": "audioMessage",
  "media": { "url": "...", "mimetype": "audio/ogg; codecs=opus",
    "seconds": 12, "ptt": true }
}}`}</pre>
          </div>
          <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
            <p className="mb-1 text-xs font-mono text-slate-500">Dokumen / File</p>
            <pre className="overflow-x-auto text-xs font-mono text-[#4358d8]">{`{ "event": "message", "data": {
  "type": "documentMessage",
  "media": { "url": "...", "mimetype": "application/pdf",
    "filename": "dokumen.pdf", "fileSize": 204800 }
}}`}</pre>
          </div>
          <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
            <p className="mb-1 text-xs font-mono text-slate-500">Lokasi / Maps</p>
            <pre className="overflow-x-auto text-xs font-mono text-[#4358d8]">{`{ "event": "message", "data": {
  "type": "locationMessage",
  "location": { "latitude": -6.2088, "longitude": 106.8456,
    "name": "Jakarta", "address": "..." }
}}`}</pre>
          </div>
          <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
            <p className="mb-1 text-xs font-mono text-slate-500">Kontak</p>
            <pre className="overflow-x-auto text-xs font-mono text-[#4358d8]">{`{ "event": "message", "data": {
  "type": "contactMessage",
  "contact": { "displayName": "John Doe", "vcard": "BEGIN:VCARD..." }
}}`}</pre>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="app-card p-5">
          <h2 className="mb-3 text-sm font-medium text-slate-800">Incoming Messages</h2>
          <div className="space-y-2">
            {messages.map((msg) => (
              <div key={msg.id} className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs font-mono">{msg.toFrom}</span>
                  <span className="text-gray-400 text-xs">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                </div>
                {msg.content && <p className="text-gray-700 text-sm mt-1">{msg.content}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Groups Tab ───────────────────────────────────────────────────────────────
interface Group {
  id: string;
  name: string;
  participantCount: number;
  description: string | null;
}

function GroupsTab({ numberId, connected, onSendTo }: { numberId: string; connected: boolean; onSendTo: (jid: string) => void }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const fetchGroups = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/numbers/${numberId}/groups`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to fetch groups"); return; }
      setGroups(data);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const copyJid = (jid: string) => {
    navigator.clipboard.writeText(jid);
    setCopied(jid);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {!connected && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
          <p className="text-yellow-700 text-sm">Connect your WhatsApp first to view groups.</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-sm">
          {groups.length > 0 ? `${groups.length} groups found` : "Click refresh to load groups"}
        </p>
        <button
          onClick={fetchGroups}
          disabled={!connected || loading}
          className="app-button-primary disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Loading..." : "Load Groups"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {groups.length > 0 && (
        <div className="app-card divide-y divide-[#eef3f8]">
          {groups.map((g) => (
            <div key={g.id} className="px-5 py-4 flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#eef1ff]">
                <Users className="h-5 w-5 text-[#546dfe]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 font-medium text-sm">{g.name}</p>
                {g.description && (
                  <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{g.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-gray-400 text-xs font-mono truncate">{g.id}</code>
                  <button
                    onClick={() => copyJid(g.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  >
                    {copied === g.id ? <Check className="w-3.5 h-3.5 text-[#546dfe]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-gray-400 text-xs mt-0.5">{g.participantCount} members</p>
              </div>
              <button
                onClick={() => onSendTo(g.id)}
                className="app-button-primary px-3 py-1.5 text-xs flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </div>
          ))}
        </div>
      )}

      {groups.length === 0 && !loading && !error && connected && (
        <div className="app-card py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-[#f3f5fb]">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-400 font-medium">No groups loaded</p>
          <p className="text-gray-400 text-sm mt-1">Click &quot;Load Groups&quot; to fetch your WhatsApp groups</p>
        </div>
      )}
    </div>
  );
}

// ─── API Tab ─────────────────────────────────────────────────────────────────
function ApiTab({ numberId, apiKey: initialKey, userApiKey: initialUserKey }: {
  numberId: string;
  apiKey: string;
  userApiKey: string | null;
}) {
  const [apiKey, setApiKey] = useState(initialKey);           // number_key
  const [userApiKey, setUserApiKey] = useState(initialUserKey ?? ""); // api_key
  const [regenerating, setRegen] = useState(false);
  const [regenUser, setRegenUser] = useState(false);

  const regen = async () => {
    setRegen(true);
    const res = await fetch(`/api/numbers/${numberId}/apikey`, { method: "POST" });
    const data = await res.json();
    if (data.apiKey) setApiKey(data.apiKey);
    setRegen(false);
  };

  const regenUserKey = async () => {
    setRegenUser(true);
    const res = await fetch("/api/user/apikey", { method: "POST" });
    const data = await res.json();
    if (data.apiKey) setUserApiKey(data.apiKey);
    setRegenUser(false);
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com";

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* api_key — User level */}
      <div className="app-card p-5">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-800">
          <Key className="w-4 h-4 text-[#546dfe]" />
          API Key
        </h2>
        <p className="text-gray-400 text-xs mb-3">Milik akun kamu — sama untuk semua nomor WA</p>
        {userApiKey ? (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5">
            <code className="flex-1 truncate text-sm font-mono text-[#4358d8]">{userApiKey}</code>
            <CopyButton text={userApiKey} />
          </div>
        ) : (
          <p className="text-yellow-600 text-xs mb-2">Belum ada — klik Generate di bawah</p>
        )}
        <button
          onClick={regenUserKey}
          disabled={regenUser}
          className="mt-1 flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${regenUser ? "animate-spin" : ""}`} />
          {userApiKey ? "Regenerate" : "Generate"}
        </button>
      </div>

      {/* number_key — per WaNumber */}
      <div className="app-card-soft p-5">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-800">
          <Key className="w-4 h-4 text-blue-500" />
          Number Key
        </h2>
        <p className="text-gray-400 text-xs mb-3">Khusus untuk nomor WA ini saja</p>
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-[#d8deef] bg-white px-3 py-2.5">
          <code className="text-blue-600 text-sm font-mono flex-1 truncate">{apiKey}</code>
          <CopyButton text={apiKey} />
        </div>
        <button
          onClick={regen}
          disabled={regenerating}
          className="mt-1 flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`} />
          Regenerate
        </button>
      </div>

      {/* PHP Example */}
      <div className="app-card p-5">
        <h2 className="mb-3 text-sm font-medium text-slate-800">Contoh PHP</h2>
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3 text-xs font-mono text-[#4358d8]">{`$data = [
  "api_key"    => "${userApiKey || "YOUR-API-KEY"}",
  "number_key" => "${apiKey}",
  "phone_no"   => "628123456789",
  "message"    => "Halo!",
];
$curl = curl_init();
curl_setopt_array($curl, [
  CURLOPT_URL            => '${baseUrl}/api/v1/send_message',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_CUSTOMREQUEST  => 'POST',
  CURLOPT_POSTFIELDS     => json_encode($data),
  CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
]);
$response = json_decode(curl_exec($curl));
curl_close($curl);`}</pre>
      </div>
    </div>
  );
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────
function ProfileTab({
  numberId,
  info,
  onSaved,
}: {
  numberId: string;
  info: NumberInfo;
  onSaved: () => void;
}) {
  // Edit fields
  const [label, setLabel] = useState(info.label);
  const [phoneNumber, setPhoneNumber] = useState(info.phoneNumber ?? "");
  const [description, setDescription] = useState(info.description ?? "");
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  // Notes
  const [notes, setNotes] = useState<WaNumberNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Reminders
  const [reminders, setReminders] = useState<WaNumberReminder[]>([]);
  const [reminderDesc, setReminderDesc] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [addingReminder, setAddingReminder] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/numbers/${numberId}/notes`).then(r => r.json()),
      fetch(`/api/numbers/${numberId}/reminders`).then(r => r.json()),
    ]).then(([n, r]) => {
      if (Array.isArray(n)) setNotes(n);
      if (Array.isArray(r)) setReminders(r);
    }).catch(() => {});
  }, [numberId]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await fetch(`/api/numbers/${numberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, phoneNumber, description }),
      });
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/numbers/${numberId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote.trim() }),
      });
      const note = await res.json();
      setNotes(prev => [note, ...prev]);
      setNewNote("");
    } finally {
      setAddingNote(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    await fetch(`/api/numbers/${numberId}/notes?noteId=${noteId}`, { method: "DELETE" });
  };

  const addReminder = async () => {
    if (!reminderDesc.trim() || !reminderDate) return;
    setAddingReminder(true);
    try {
      const res = await fetch(`/api/numbers/${numberId}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: reminderDesc.trim(), dueDate: reminderDate }),
      });
      const reminder = await res.json();
      setReminders(prev => [...prev, reminder].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
      setReminderDesc("");
      setReminderDate("");
    } finally {
      setAddingReminder(false);
    }
  };

  const toggleReminder = async (reminderId: string, isCompleted: boolean) => {
    setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, isCompleted } : r));
    await fetch(`/api/numbers/${numberId}/reminders`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reminderId, isCompleted }),
    });
  };

  const deleteReminder = async (reminderId: string) => {
    setReminders(prev => prev.filter(r => r.id !== reminderId));
    await fetch(`/api/numbers/${numberId}/reminders?reminderId=${reminderId}`, { method: "DELETE" });
  };

  const inputCls = "app-input";
  const pending = reminders.filter(r => !r.isCompleted);
  const completed = reminders.filter(r => r.isCompleted);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* ── Edit Info ── */}
      <div className="space-y-5">
        <div className="app-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Pencil className="w-4 h-4 text-[#546dfe]" />
            Edit Info Nomor
          </h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Nama / Label</label>
              <input value={label} onChange={e => setLabel(e.target.value)} className={inputCls} placeholder="Nama nomor..." />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Nomor HP</label>
              <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className={inputCls} placeholder="628xxx (opsional, biasanya otomatis dari WA)" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-500">Context / Deskripsi</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                className={inputCls + " resize-none"}
                placeholder="Kegunaan nomor ini, target audience, catatan penting..."
              />
            </div>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="app-button-primary w-full"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : savedOk ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? "Menyimpan..." : savedOk ? "Tersimpan!" : "Simpan Perubahan"}
            </button>
          </div>
        </div>

        {/* ── Reminders ── */}
        <div className="app-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Bell className="w-4 h-4 text-[#546dfe]" />
            Reminders
            {pending.length > 0 && (
              <span className="ml-auto rounded-full bg-[#eef1ff] px-2 py-0.5 text-xs font-bold text-[#546dfe]">
                {pending.length}
              </span>
            )}
          </h2>

          {/* Add reminder */}
          <div className="mb-4 space-y-2 rounded-xl border border-[#e5ebf5] bg-[#f8fafc] p-3">
            <input
              value={reminderDesc}
              onChange={e => setReminderDesc(e.target.value)}
              placeholder="Deskripsi reminder..."
              className={inputCls}
            />
            <div className="flex gap-2">
              <input
                type="datetime-local"
                value={reminderDate}
                onChange={e => setReminderDate(e.target.value)}
                className={inputCls + " flex-1"}
              />
              <button
                onClick={addReminder}
                disabled={addingReminder || !reminderDesc.trim() || !reminderDate}
                className="app-button-primary disabled:opacity-50"
              >
                {addingReminder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {pending.map(r => (
              <div key={r.id} className="flex items-start gap-3 rounded-lg border border-[#e5ebf5] bg-white px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={r.isCompleted}
                  onChange={e => toggleReminder(r.id, e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-[#546dfe]"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-800">{r.description}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {new Date(r.dueDate).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <button onClick={() => deleteReminder(r.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {pending.length === 0 && (
              <p className="py-3 text-center text-xs text-slate-400">Tidak ada reminder aktif</p>
            )}
            {completed.length > 0 && (
              <details className="pt-1">
                <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600">
                  {completed.length} selesai
                </summary>
                <div className="mt-2 space-y-1.5">
                  {completed.map(r => (
                    <div key={r.id} className="flex items-start gap-3 rounded-lg px-3 py-2 opacity-50">
                      <input
                        type="checkbox"
                        checked
                        onChange={e => toggleReminder(r.id, e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded accent-[#546dfe]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm line-through text-slate-500">{r.description}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(r.dueDate).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      </div>
                      <button onClick={() => deleteReminder(r.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>
      </div>

      {/* ── Interaction Notes ── */}
      <div className="app-card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <BookOpen className="w-4 h-4 text-[#546dfe]" />
          Interaction Notes
        </h2>

        <div className="mb-4">
          <textarea
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            rows={3}
            placeholder="Catat interaksi, kejadian penting, atau hal yang perlu diingat..."
            className={inputCls + " resize-none"}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addNote(); }}
          />
          <button
            onClick={addNote}
            disabled={addingNote || !newNote.trim()}
            className="mt-2 app-button-primary w-full disabled:opacity-50"
          >
            {addingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Tambah Catatan
          </button>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {notes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <BookOpen className="mb-2 w-8 h-8 opacity-30" />
              <p className="text-sm">Belum ada catatan</p>
            </div>
          )}
          {notes.map(note => (
            <div key={note.id} className="group rounded-xl border border-[#e5ebf5] bg-[#f8fafc] p-3">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  {new Date(note.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                </p>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NumberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("connection");
  const [sendTo, setSendTo] = useState("");
  const [info, setInfo] = useState<NumberInfo | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref pattern: always points to the latest openSSE closure (avoids stale captures)
  const openSSERef = useRef<() => void>(() => {});

  const handleSendToGroup = (jid: string) => {
    setSendTo(jid);
    setActiveTab("send");
  };

  const fetchInfo = useCallback(async () => {
    try {
      const [res, meRes] = await Promise.all([
        fetch(`/api/numbers/${id}/status`),
        fetch("/api/auth/me"),
      ]);
      if (!res.ok) { router.push("/numbers"); return; }
      const [data, meData] = await Promise.all([res.json(), meRes.json()]);
      setInfo({ ...data, userApiKey: meData.apiKey ?? null });
    } catch { /* ignore */ }
  }, [id, router]);

  // Keep ref up to date with latest closures on every render
  openSSERef.current = () => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    esRef.current?.close();

    const es = new EventSource(`/api/numbers/${id}/sse`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setInfo((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: data.status ?? prev.status,
            qr: data.qr !== undefined ? data.qr : prev.qr,
            stats: data.stats ?? prev.stats,
            webhookUrl: data.webhookUrl !== undefined ? data.webhookUrl : prev.webhookUrl,
          };
        });
      } catch { /* ignore */ }
    };

    es.onerror = () => {
      es.close();
      // Auto-reconnect after 3 s — handles Vercel's maxDuration timeout
      // so QR scanning continues even if the SSE connection cycles.
      reconnectTimerRef.current = setTimeout(() => openSSERef.current(), 3000);
    };
  };

  // SSE for real-time updates
  useEffect(() => {
    fetchInfo();
    openSSERef.current();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      esRef.current?.close();
    };
  }, [id, fetchInfo]);

  if (!info) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  const tabs: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: "connection", icon: QrCode, label: "Connection" },
    { id: "send", icon: Send, label: "Send" },
    { id: "groups", icon: Users, label: "Groups" },
    { id: "webhook", icon: Webhook, label: "Webhook" },
    { id: "api", icon: Key, label: "API" },
    { id: "profile", icon: BookOpen, label: "Profile" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/numbers")}
          className="mb-5 flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Semua Nomor
        </button>

        <div className="app-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg",
                info.status === "connected" ? "bg-[#eef1ff]" : "bg-[#f3f5fb]"
              )}>
                <MessageSquare className={cn("w-6 h-6", info.status === "connected" ? "text-[#546dfe]" : "text-slate-400")} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{info.label}</h1>
                <p className="text-gray-400 text-sm mt-0.5">
                  {info.phoneNumber ? `+${info.phoneNumber}` : "Belum terhubung"}
                </p>
              </div>
            </div>
            <StatusBadge status={info.status} />
          </div>

          {info.stats && (
            <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#546dfe]" />
                <span className="text-gray-500 text-xs">{info.stats.sent.toLocaleString()} terkirim</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-gray-500 text-xs">{info.stats.received.toLocaleString()} diterima</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="app-card mb-6 p-1.5">
        <div className="flex gap-1">
          {tabs.map(({ id: tabId, icon: Icon, label }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-md py-2.5 text-sm font-medium transition-all",
                activeTab === tabId
                  ? "bg-[#546dfe] text-white shadow-sm"
                  : "text-slate-500 hover:bg-[#f7f9fd] hover:text-slate-700"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "connection" && (
        <ConnectionTab numberId={id} info={info} reload={fetchInfo} onConnect={() => openSSERef.current()} />
      )}
      {activeTab === "send" && (
        <SendTab numberId={id} connected={info.status === "connected"} initialTo={sendTo} />
      )}
      {activeTab === "groups" && (
        <GroupsTab numberId={id} connected={info.status === "connected"} onSendTo={handleSendToGroup} />
      )}
      {activeTab === "webhook" && (
        <WebhookTab numberId={id} initialUrl={info.webhookUrl} />
      )}
      {activeTab === "api" && (
        <ApiTab numberId={id} apiKey={info.apiKey} userApiKey={info.userApiKey ?? null} />
      )}
      {activeTab === "profile" && (
        <ProfileTab numberId={id} info={info} onSaved={fetchInfo} />
      )}
    </div>
  );
}
