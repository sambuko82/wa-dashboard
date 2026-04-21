"use client";

import { useRef, useState, useCallback } from "react";
import { Bold, Italic, Strikethrough, Code, Smile, ChevronDown, ChevronUp } from "lucide-react";

// ─── WhatsApp emoji set ───────────────────────────────────────────────────────
const EMOJIS = [
  "😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇",
  "🙂","😉","😌","😍","🥰","😘","😎","🤩","🥳","😢",
  "😭","😡","🤔","💭","✅","❌","⚠️","💯","🔥","⭐",
  "🌟","💫","✨","🎉","🎊","🎯","👋","🤝","🙏","👍",
  "👎","💪","❤️","💚","💛","🧡","🚗","✈️","🏠","📱",
  "💻","📊","📈","📋","📌","💰","💳","📦","🎁","🔑",
  "🔒","💡","🔔","📢","📞","📧","💬","📅","🗓️","⏰",
  "⌛","⏳","🌍","🌱","🌺","☕","🍕","🛒","🟢","🔴",
];

// ─── Preview renderer ─────────────────────────────────────────────────────────
function renderPreview(text: string): string {
  let s = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  s = s
    .replace(/```([\s\S]*?)```/g, "<code class=\"font-mono text-xs bg-gray-100 rounded px-0.5\">$1</code>")
    .replace(/\*([^*\n]+)\*/g, "<strong>$1</strong>")
    .replace(/_([^_\n]+)_/g, "<em>$1</em>")
    .replace(/~([^~\n]+)~/g, "<del>$1</del>")
    .replace(/\{([^}]+)\}/g, "<span class=\"inline-block bg-amber-100 text-amber-700 font-mono text-xs rounded px-1 mx-0.5\">{$1}</span>")
    .replace(/\n/g, "<br/>");

  return s;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  value: string;
  onChange: (v: string) => void;
  variableNames?: string[];
  rows?: number;
  placeholder?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function TemplateEditor({ value, onChange, variableNames = [], rows = 8, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Insert text at cursor / replace selection
  const insertAt = useCallback((before: string, after = "") => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = el.value.slice(start, end);
    const next = el.value.slice(0, start) + before + selected + after + el.value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + before.length + selected.length;
      el.setSelectionRange(cursor, cursor);
    });
  }, [onChange]);

  const wrapFormat = useCallback((prefix: string, suffix: string) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = el.value.slice(start, end);
    const next = el.value.slice(0, start) + prefix + selected + suffix + el.value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, end + prefix.length);
    });
  }, [onChange]);

  return (
    <div className="overflow-hidden rounded-lg border border-[#d8deef] bg-white">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[#e6eaf4] bg-[#f7f9fd] px-3 py-2">

        {/* Format buttons */}
        <div className="mr-1 flex items-center gap-0.5 border-r border-[#d8deef] pr-2">
          <ToolBtn title="Bold (*text*)" onClick={() => wrapFormat("*", "*")}>
            <Bold className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn title="Italic (_text_)" onClick={() => wrapFormat("_", "_")}>
            <Italic className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn title="Strikethrough (~text~)" onClick={() => wrapFormat("~", "~")}>
            <Strikethrough className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn title="Monospace (```text```)" onClick={() => wrapFormat("```", "```")}>
            <Code className="w-3.5 h-3.5" />
          </ToolBtn>
        </div>

        {/* Variable chips */}
        {variableNames.length > 0 && (
          <div className="mr-1 flex items-center gap-1 border-r border-[#d8deef] pr-2">
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Var:</span>
            {variableNames.map((v) => (
              <button
                key={v}
                type="button"
                title={`Insert {${v}}`}
                onClick={() => insertAt(`{${v}}`)}
                className="rounded-md bg-[#eef1ff] px-1.5 py-0.5 font-mono text-[11px] text-[#546dfe] transition-colors hover:bg-[#dde4ff]"
              >
                {`{${v}}`}
              </button>
            ))}
          </div>
        )}

        {/* Emoji toggle */}
        <div className="relative ml-auto">
          <ToolBtn title="Emoji" onClick={() => setShowEmoji(!showEmoji)}>
            <Smile className="w-3.5 h-3.5" />
          </ToolBtn>
          {showEmoji && (
            <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-lg border border-[#d8deef] bg-white p-2 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.28)]">
              <div className="grid grid-cols-10 gap-0.5">
                {EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => { insertAt(em); setShowEmoji(false); }}
                    className="rounded p-0.5 text-lg leading-none transition-colors hover:bg-[#f2f5fb]"
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Textarea ── */}
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder ?? "Tulis pesan template…\nContoh: Halo {nama}! Pesanan {kode_pesanan} sudah siap. 🎉"}
        className="w-full resize-y bg-white px-4 py-3 font-mono text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
        onClick={() => setShowEmoji(false)}
      />

      {/* ── Format hint ── */}
      <div className="flex flex-wrap items-center gap-3 border-t border-[#eef2f7] bg-[#fafbfe] px-4 py-2">
        <span className="text-[11px] text-slate-400">Format WA:</span>
        {[["*bold*","font-bold"],["_italic_","italic"],["~coret~","line-through"],["```mono```","font-mono text-xs"]].map(([ex, cls]) => (
          <span key={ex} className={`text-[11px] text-slate-500 ${cls}`}>{ex}</span>
        ))}
        <span className="ml-auto text-[11px] text-slate-400">Variabel: <code className="text-[#546dfe]">{"{nama_variable}"}</code></span>
      </div>

      {/* ── Preview ── */}
      <div className="border-t border-[#d8deef]">
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-slate-500 transition-colors hover:bg-[#fafbfe]"
        >
          <span>Preview</span>
          {showPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {showPreview && (
          <div className="px-4 pb-4">
            {value.trim() ? (
              <div className="max-w-sm rounded-lg border border-[#d8deef] bg-[#f7f9fd] px-4 py-3 text-sm text-slate-800">
                <div
                  dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
                  className="leading-relaxed"
                />
              </div>
            ) : (
              <p className="text-xs italic text-slate-400">Tulis pesan untuk melihat preview…</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="rounded p-1.5 text-slate-500 transition-colors hover:bg-[#e9edf6] hover:text-slate-800"
    >
      {children}
    </button>
  );
}
