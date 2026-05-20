import { getCannedResponses } from "./jvto-context-loader";
import type { ExtractedRequest } from "./jvto-request-extractor";
import type { MatchedContext } from "./jvto-context-matcher";

export interface RenderedDraft {
  draft: string;
  draftType: string;
  templateId: string | null;
  sourceRefs: string[];
}

interface CannedTemplate {
  id: string;
  fields: {
    templateId: string;
    stage: string;
    questionType: string;
    lang: { en: string; id: string };
    variables: string[];
    isAuto: boolean;
  };
}

// questionType → preferred template IDs (in priority order)
const TYPE_TEMPLATES: Record<string, string[]> = {
  INQUIRY:   ["T-2", "D-1", "T-1"],
  PRICING:   ["OB-1"],
  BOOKING:   ["P-1", "U-2"],
  POLICY:    ["OB-3", "OB-4"],
  COMPLAINT: ["OB-3"],
  SAFETY:    ["PB-1"],
  UNKNOWN:   ["T-2"],
};

export function renderDraft(
  matched: MatchedContext,
  req: ExtractedRequest
): RenderedDraft {
  const templates = getCannedResponses() as unknown as CannedTemplate[];
  const lang = req.lang;

  // Risk signals take priority — even before clarification
  if (req.riskSignals.includes("transport-only")) {
    return renderTransportOnlyGuard(lang, matched);
  }
  if (req.riskSignals.includes("refund")) {
    return renderRefundGuard(lang, templates);
  }

  if (matched.draftType === "clarification_needed") {
    return renderClarification(lang, templates);
  }

  // For INQUIRY with confident match, render package recommendation directly
  if (req.questionType === "INQUIRY" && matched.confidence >= 0.5) {
    return renderFallback(matched, lang);
  }

  const template = selectTemplate(templates, req.questionType);

  if (!template) {
    return renderFallback(matched, lang);
  }

  const raw = lang === "id" ? template.fields.lang.id : template.fields.lang.en;
  const filled = substituteVars(raw, matched, req);

  return {
    draft: filled,
    draftType: matched.draftType,
    templateId: template.id,
    sourceRefs: ["wiki/ops/canned-responses.md", ...matched.sourceRefs],
  };
}

function selectTemplate(templates: CannedTemplate[], questionType: string): CannedTemplate | null {
  const preferred = TYPE_TEMPLATES[questionType] ?? TYPE_TEMPLATES.UNKNOWN;
  for (const id of preferred) {
    const t = templates.find(t => t.id === id);
    if (t) return t;
  }
  return null;
}

function substituteVars(body: string, matched: MatchedContext, req: ExtractedRequest): string {
  let out = body;

  // Destination
  const destStr =
    req.destinations.length > 0
      ? req.destinations.map(d => d.charAt(0).toUpperCase() + d.slice(1).replace("-", " ")).join(", ")
      : (matched.packageData?.destinations as string[] | undefined)?.join(", ") ?? "[fill: destination]";
  out = out.replace(/\[DESTINATION\]|\[DESTINASI\]/gi, destStr);

  // Package name
  const pkgName = matched.packageName ?? "[fill: package name]";
  out = out.replace(/\[(?:PACKAGE NAME|NAMA PAKET(?: STANDARD)?)\]/gi, pkgName);
  out = out.replace(/\[NAMA PAKET PREMIUM\]|\[PREMIUM PACKAGE NAME\]/gi, `${pkgName} (Premium Hotels)`);

  // Duration
  const days = matched.packageData?.duration_days;
  const nights = matched.packageData?.duration_nights;
  const durStr = days ? `${days}D${nights}N` : "[fill: duration]";
  out = out.replace(/\[X hari Y malam\]|\[X days Y nights\]|\[DURATION\]/gi, durStr);

  // Pax
  const paxStr = req.pax ? String(req.pax) : "[fill: pax count]";
  out = out.replace(/\[(?:PAX COUNT|JUMLAH PAX)\]|X orang/gi, paxStr);

  // Package URL with UTM
  const url = matched.packageData?.url as string | undefined;
  if (url) {
    const utmUrl = `${url}?utm_source=whatsapp`;
    out = out.replace(/\[(?:PACKAGE URL|LINK)\]/gi, utmUrl);
  }

  // Remaining [CAPS] → [fill: name]
  out = out.replace(/\[([A-Z][A-Z\s]{2,})\]/g, (_, name: string) => `[fill: ${name.toLowerCase()}]`);

  return out.trim();
}

function renderClarification(lang: "en" | "id", templates: CannedTemplate[]): RenderedDraft {
  const t2 = templates.find(t => t.id === "T-2");
  if (t2) {
    const body = lang === "id" ? t2.fields.lang.id : t2.fields.lang.en;
    if (body) {
      return { draft: body.trim(), draftType: "clarification_needed", templateId: "T-2", sourceRefs: ["wiki/ops/canned-responses.md"] };
    }
  }
  const draft =
    lang === "id"
      ? "Halo! Untuk membantu lebih baik, boleh share:\n\n1. Destinasi yang diminati\n2. Tanggal perjalanan\n3. Jumlah peserta\n\nTim kami akan balas segera."
      : "Hi 😊\n\nTo help you better, could you share:\n\n1. Destination(s) of interest\n2. Planned travel date\n3. Number of travelers\n\nOur team will reply shortly.";
  return { draft, draftType: "clarification_needed", templateId: null, sourceRefs: ["wiki/ops/canned-responses.md"] };
}

function renderTransportOnlyGuard(lang: "en" | "id", matched: MatchedContext): RenderedDraft {
  const draft =
    lang === "id"
      ? "Halo! JVTO menyediakan paket wisata lengkap — bukan layanan transport saja.\n\nSemua paket sudah mencakup kendaraan AC privat, pengemudi, pemandu, tiket masuk, hotel, dan sarapan.\n\nAda paket yang sesuai dengan rencana perjalanan Anda?"
      : "Hi 😊\n\nJVTO operates end-to-end private tour packages — we don't offer transport-only or driver-only services.\n\nAll packages include private AC transport, driver, guide, entrance fees, accommodation, and breakfast.\n\nWould you like to see which package fits your trip?";
  return {
    draft,
    draftType: "transport_only_guard",
    templateId: "OB-4",
    sourceRefs: ["wiki/content/operational-facts.md", "wiki/ops/canned-responses.md"],
  };
}

function renderRefundGuard(lang: "en" | "id", templates: CannedTemplate[]): RenderedDraft {
  const ob3 = templates.find(t => t.id === "OB-3");
  if (ob3) {
    const body = lang === "id" ? ob3.fields.lang.id : ob3.fields.lang.en;
    if (body) {
      return { draft: body.trim(), draftType: "refund_adjustment_guard", templateId: "OB-3", sourceRefs: ["wiki/ops/canned-responses.md"] };
    }
  }
  const draft =
    lang === "id"
      ? "Halo! Kebijakan JVTO untuk pembatalan:\n\n✅ Pembatalan ≥48 jam sebelum hari-H → Travel Credit 100% (tidak kedaluwarsa, bisa ditransfer)\n❌ Pembatalan <48 jam → hangus, tidak ada Travel Credit\n\nRefund tunai tidak tersedia untuk pembatalan oleh tamu.\n\nAda yang bisa kami bantu?"
      : "Hi 😊\n\nJVTO's cancellation policy:\n\n✅ Cancellation ≥48 hours before Day 1 → 100% Travel Credit (no expiry, transferable)\n❌ Cancellation <48 hours → forfeited, no Travel Credit\n\nCash refunds are not available for guest-initiated cancellations.\n\nIs there anything else we can help with?";
  return { draft, draftType: "refund_adjustment_guard", templateId: null, sourceRefs: ["wiki/products/packages-overview.md"] };
}

function renderFallback(matched: MatchedContext, lang: "en" | "id"): RenderedDraft {
  const url = matched.packageData?.url;
  const utmUrl = url ? `${url}?utm_source=whatsapp` : "https://javavolcano-touroperator.com/tours?utm_source=whatsapp";
  const draft =
    lang === "id"
      ? `Halo! Berikut paket yang paling sesuai:\n\n*${matched.packageName ?? "Lihat semua paket"}*\n${utmUrl}\n\nSemua tur 100% privat — tidak ada grup gabungan. Ada pertanyaan?`
      : `Hi 😊\n\nBased on your request, here's the best match:\n\n*${matched.packageName ?? "Browse all packages"}*\n${utmUrl}\n\nAll tours are 100% private — no shared groups.\n\nAny questions?`;
  return { draft, draftType: matched.draftType, templateId: null, sourceRefs: matched.sourceRefs };
}
