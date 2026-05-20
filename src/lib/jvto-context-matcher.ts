import { getPackages, getItineraries, getOperationalFacts, type IndexItem } from "./jvto-context-loader";
import type { ExtractedRequest } from "./jvto-request-extractor";

export interface MatchedContext {
  packageSlug: string | null;
  packageName: string | null;
  confidence: number;
  packageData: Record<string, unknown> | null;
  itineraryData: Record<string, unknown> | null;
  relevantFacts: Record<string, unknown>[];
  draftType: string;
  sourceRefs: string[];
}

export function matchContext(req: ExtractedRequest): MatchedContext {
  const packages = getPackages();
  const itineraries = getItineraries();
  const opFacts = getOperationalFacts();

  // Direct slug lookup (from CRM context or Klook mapping)
  if (req.packageSlug) {
    const pkg = packages.find(
      p => p.id === req.packageSlug || p.fields.rawSlug === req.packageSlug
    );
    if (pkg) {
      return buildResult(pkg, itineraries, opFacts, 1.0, req.questionType, req.riskSignals);
    }
  }

  // Score all packages against request
  let best: { pkg: IndexItem; score: number } | null = null;

  for (const pkg of packages) {
    const f = pkg.fields;
    let score = 0;

    // Destination overlap (0–0.5)
    const pkgDests = (f.destinations as string[]) ?? [];
    if (req.destinations.length > 0) {
      const overlap = req.destinations.filter(d => pkgDests.includes(d)).length;
      const union = new Set([...req.destinations, ...pkgDests]).size;
      score += (overlap / union) * 0.5;
    }

    // Duration proximity (0–0.25)
    if (req.duration && f.duration_days) {
      const diff = Math.abs((f.duration_days as number) - req.duration);
      if (diff === 0) score += 0.25;
      else if (diff === 1) score += 0.1;
    }

    // Origin match (0–0.15)
    if (req.startCity && f.origin === req.startCity) score += 0.15;

    // Finish match (0–0.1)
    if (req.finishCity && f.finish === req.finishCity) score += 0.1;

    // Penalise student/specialty for generic inquiries
    if (f.isStudent || f.isSpecialty) score -= 0.1;

    if (!best || score > best.score) best = { pkg, score };
  }

  const confidence = best?.score ?? 0;

  if (confidence < 0.3 || !best) {
    return {
      packageSlug: null,
      packageName: null,
      confidence: 0,
      packageData: null,
      itineraryData: null,
      relevantFacts: pickFacts(opFacts, req.destinations),
      draftType: "clarification_needed",
      sourceRefs: ["wiki/products/packages-overview.md"],
    };
  }

  return buildResult(best.pkg, itineraries, opFacts, confidence, req.questionType, req.riskSignals);
}

function buildResult(
  pkg: IndexItem,
  itineraries: IndexItem[],
  opFacts: IndexItem[],
  confidence: number,
  questionType: string,
  riskSignals: string[]
): MatchedContext {
  const itinerary = itineraries.find(i => i.id === pkg.id);
  const dests = (pkg.fields.destinations as string[]) ?? [];

  return {
    packageSlug: pkg.id,
    packageName: pkg.title,
    confidence,
    packageData: pkg.fields,
    itineraryData: itinerary?.fields ?? null,
    relevantFacts: pickFacts(opFacts, dests),
    draftType: toDraftType(questionType, confidence, riskSignals),
    sourceRefs: [...pkg.sourceRefs, ...(itinerary?.sourceRefs ?? [])],
  };
}

function pickFacts(opFacts: IndexItem[], dests: string[]): Record<string, unknown>[] {
  return opFacts
    .filter(f => {
      if (dests.includes("ijen") && (f.id === "ijen-practical" || f.id === "ijen-closure")) return true;
      if (dests.includes("bromo") && f.id === "temperatures") return true;
      if (f.id === "timing-guidelines" || f.id === "transport-only-policy") return true;
      return false;
    })
    .map(f => ({ id: f.id, ...f.fields }));
}

function toDraftType(qt: string, confidence: number, riskSignals: string[]): string {
  if (confidence < 0.3) return "clarification_needed";
  if (riskSignals.includes("transport-only")) return "transport_only_guard";
  if (riskSignals.includes("refund")) return "refund_adjustment_guard";
  if (riskSignals.includes("discount")) return "pricing_guard";
  switch (qt) {
    case "PRICING": return "pricing_guard";
    case "BOOKING": return "booking_confirmation";
    case "POLICY": return "policy_explanation";
    case "COMPLAINT": return "complaint_escalation";
    case "SAFETY": return "safety_information";
    default: return "package_match";
  }
}
