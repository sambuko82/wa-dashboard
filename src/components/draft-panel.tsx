"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface DraftResult {
  id: string | null;
  draft: string;
  draftType: string;
  matchedContext: {
    packageSlug: string | null;
    packageName: string | null;
    confidence: number;
  };
  riskLevel: "low" | "medium" | "high";
  verificationStatus: "passed" | "needs_review" | "blocked";
  checks: Record<string, boolean>;
  failedRules: string[];
  sourceRefs: string[];
  notesForStaff: string[];
}

interface DraftPanelProps {
  phone: string;
  customerId?: string;
  selectedNumberId?: string;
  onSend?: (text: string) => void;
}

// ── Check label map ────────────────────────────────────────────────────────

const CHECK_LABELS: Record<string, string> = {
  package_exists: "Package exists",
  package_url_present: "Package URL included",
  duration_matches: "Duration matches",
  origin_finish_matches: "Origin/finish matches",
  destinations_match: "Destinations match",
  itinerary_order_valid: "Itinerary order valid",
  vehicle_crew_claim: "Vehicle/crew claim correct",
  hotel_claim_supported: "Hotel claim supported",
  no_invented_inclusions: "No invented inclusions",
  no_manual_price_quote: "No manual price quote",
  no_discount_promise: "No discount promise",
  no_refund_promise: "No refund promise",
  no_transport_only: "No transport-only offer",
  no_weather_guarantee: "No weather/Blue Fire guarantee",
  no_safety_guarantee: "No uncaveated safety claim",
  no_klook_policy_claim: "No unsupported Klook claim",
  draft_is_draft: "Draft pending review",
  reply_language_is_english_by_default: "Language: English (default)",
  no_mixed_language_unless_required: "No mixed language",
  follows_jvto_brand_voice: "Follows JVTO brand voice",
  no_generic_or_unverified_claims: "No generic claims",
};

// ── Component ──────────────────────────────────────────────────────────────

export default function DraftPanel({ phone, customerId, selectedNumberId, onSend }: DraftPanelProps) {
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<DraftResult | null>(null);
  const [editedDraft, setEditedDraft] = useState("");
  const [showChecks, setShowChecks] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const latestMessage = ""; // caller passes the latest incoming message text

  async function handleGenerate(incomingMessage?: string) {
    if (!incomingMessage && !phone) return;
    setGenerating(true);
    setError(null);
    setResult(null);

    // Read latest incoming message from the DOM if not passed
    const msg = incomingMessage || prompt("Paste the customer's message to generate a draft:") || "";
    if (!msg.trim()) { setGenerating(false); return; }

    try {
      const res = await fetch("/api/jvto/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message: msg, customerId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Draft generation failed");
      }
      const data: DraftResult = await res.json();
      setResult(data);
      setEditedDraft(data.draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Draft generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend() {
    if (!result || !editedDraft.trim() || result.verificationStatus === "blocked") return;
    if (!selectedNumberId) { setError("No WA number selected — pick one from the send form above."); return; }
    setSending(true);
    try {
      const res = await fetch("/api/jvto/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numberId: selectedNumberId, phone, message: editedDraft.trim() }),
      });
      if (!res.ok) throw new Error("Send failed");
      // Mark draft as sent
      if (result.id) {
        await fetch("/api/jvto/draft", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: result.id }),
        });
      }
      onSend?.(editedDraft.trim());
      setResult(null);
      setEditedDraft("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(editedDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const riskColor = {
    low: "bg-emerald-100 text-emerald-700 border-emerald-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    high: "bg-red-100 text-red-700 border-red-200",
  };

  const statusIcon = result
    ? result.verificationStatus === "passed"
      ? <ShieldCheck className="h-4 w-4 text-emerald-600" />
      : result.verificationStatus === "needs_review"
        ? <AlertTriangle className="h-4 w-4 text-amber-600" />
        : <ShieldAlert className="h-4 w-4 text-red-600" />
    : null;

  const statusLabel = result
    ? result.verificationStatus === "passed" ? "Passed"
    : result.verificationStatus === "needs_review" ? "Needs Review"
    : "Blocked"
    : "";

  const statusColor = result
    ? result.verificationStatus === "passed" ? "text-emerald-700"
    : result.verificationStatus === "needs_review" ? "text-amber-700"
    : "text-red-700"
    : "";

  const failedChecks = result
    ? Object.entries(result.checks).filter(([, v]) => !v)
    : [];

  const passedChecks = result
    ? Object.entries(result.checks).filter(([, v]) => v)
    : [];

  return (
    <div className="rounded-xl border border-[#e6eaf4] bg-[#fafbfe] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-[#546dfe]" />
          AI Draft
        </div>
        {result && (
          <button
            onClick={() => { setResult(null); setEditedDraft(""); setError(null); }}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Generate button */}
      {!result && (
        <button
          onClick={() => handleGenerate()}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#546dfe] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4558e0] disabled:opacity-50"
        >
          {generating
            ? <><Loader2 className="h-4 w-4 animate-spin" />Generating draft…</>
            : <><Sparkles className="h-4 w-4" />Generate Draft</>
          }
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Draft output */}
      {result && (
        <div className="space-y-3">
          {/* Draft textarea */}
          <textarea
            value={editedDraft}
            onChange={e => setEditedDraft(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-[#d8deef] bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#546dfe]/30 resize-y"
          />

          {/* Risk + Status row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-md border px-2 py-0.5 text-xs font-semibold", riskColor[result.riskLevel])}>
              {result.riskLevel === "low" ? "● Low risk" : result.riskLevel === "medium" ? "⚠ Medium risk" : "✗ High risk"}
            </span>
            <span className={cn("flex items-center gap-1 text-xs font-semibold", statusColor)}>
              {statusIcon}
              {statusLabel}
            </span>
            {result.matchedContext.packageSlug && (
              <span className="rounded-md bg-[#eef1ff] px-2 py-0.5 text-xs font-medium text-[#546dfe]">
                {result.matchedContext.packageSlug}
                {" "}
                <span className="opacity-60">
                  ({Math.round(result.matchedContext.confidence * 100)}%)
                </span>
              </span>
            )}
          </div>

          {/* Failed rules (always visible if any) */}
          {failedChecks.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1">
              {failedChecks.map(([key]) => (
                <div key={key} className="flex items-start gap-1.5 text-xs text-red-700">
                  <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{CHECK_LABELS[key] ?? key}</span>
                </div>
              ))}
            </div>
          )}

          {/* Notes for staff */}
          {result.notesForStaff.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1">
              {result.notesForStaff.map((note, i) => (
                <p key={i} className="text-xs text-amber-800">• {note}</p>
              ))}
            </div>
          )}

          {/* Verification detail (collapsible) */}
          <button
            onClick={() => setShowChecks(p => !p)}
            className="flex w-full items-center justify-between text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            <span>Verification ({passedChecks.length}/{Object.keys(result.checks).length} passed)</span>
            {showChecks ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {showChecks && (
            <div className="rounded-lg border border-[#e6eaf4] bg-white p-3 grid grid-cols-1 gap-1">
              {Object.entries(result.checks).map(([key, pass]) => (
                <div key={key} className={cn("flex items-center gap-1.5 text-xs", pass ? "text-slate-600" : "text-red-600 font-medium")}>
                  {pass
                    ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    : <X className="h-3.5 w-3.5 shrink-0 text-red-500" />
                  }
                  {CHECK_LABELS[key] ?? key}
                </div>
              ))}
            </div>
          )}

          {/* Source refs (collapsible) */}
          {result.sourceRefs.length > 0 && (
            <>
              <button
                onClick={() => setShowSources(p => !p)}
                className="flex w-full items-center justify-between text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                <span>Sources ({result.sourceRefs.length})</span>
                {showSources ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {showSources && (
                <div className="rounded-lg border border-[#e6eaf4] bg-white px-3 py-2 space-y-0.5">
                  {result.sourceRefs.map((s, i) => (
                    <p key={i} className="text-xs text-slate-500 font-mono truncate">{s}</p>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-[#d8deef] bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-[#f0f2f8]"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copied!" : "Copy"}
            </button>

            <button
              onClick={handleSend}
              disabled={sending || result.verificationStatus === "blocked" || !editedDraft.trim()}
              title={result.verificationStatus === "blocked" ? "Fix failed rules before sending" : "Send via WhatsApp"}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition",
                result.verificationStatus === "blocked"
                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                  : "bg-[#546dfe] text-white hover:bg-[#4558e0]"
              )}
            >
              {sending
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Sending…</>
                : <><Send className="h-3.5 w-3.5" />Send</>
              }
            </button>

            <button
              onClick={() => handleGenerate()}
              disabled={generating}
              className="flex items-center gap-1.5 rounded-lg border border-[#d8deef] bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-[#f0f2f8] disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
