import { getBrandVoice } from "./jvto-context-loader";
import type { MatchedContext } from "./jvto-context-matcher";
import type { ExtractedRequest } from "./jvto-request-extractor";

export interface VerificationResult {
  riskLevel: "low" | "medium" | "high";
  verificationStatus: "passed" | "needs_review" | "blocked";
  checks: Record<string, boolean>;
  failedRules: string[];
  notesForStaff: string[];
  sourceRefs: string[];
}

// Rules 10–15 + brand voice rules trigger block
const BLOCKING_RULES = new Set([
  "no_manual_price_quote",
  "no_discount_promise",
  "no_refund_promise",
  "no_transport_only",
  "no_weather_guarantee",
  "no_safety_guarantee",
  "follows_jvto_brand_voice",
  "no_invented_inclusions",
]);

export function verifyDraft(
  draft: string,
  matched: MatchedContext,
  req: ExtractedRequest
): VerificationResult {
  const d = draft.toLowerCase();
  const bv = getBrandVoice() as { fields: { forbidden_phrases: string[]; language_detection_keywords: { indonesian: string[] } } };
  const checks: Record<string, boolean> = {};
  const failedRules: string[] = [];
  const notesForStaff: string[] = [];

  function fail(rule: string, note: string) {
    checks[rule] = false;
    failedRules.push(rule);
    notesForStaff.push(note);
  }

  // 1. package_exists
  checks.package_exists = matched.packageSlug != null || matched.draftType === "clarification_needed";
  if (!checks.package_exists) {
    fail("package_exists", "No matching package found. Use clarification template instead.");
  }

  // 2. package_url_present — only required for package_match drafts
  const hasUrl = draft.includes("javavolcano-touroperator.com");
  const needsUrl = matched.packageSlug != null &&
    matched.draftType !== "clarification_needed" &&
    matched.draftType !== "transport_only_guard" &&
    matched.draftType !== "refund_adjustment_guard";
  checks.package_url_present = !needsUrl || hasUrl;
  if (!checks.package_url_present) {
    const url = matched.packageData?.url as string | undefined;
    notesForStaff.push(`Package URL missing. Add: ${url ?? "package URL"}?utm_source=whatsapp`);
  }

  // 3. duration_matches
  const pkgDays = matched.packageData?.duration_days as number | undefined;
  if (pkgDays && req.duration && req.duration !== pkgDays) {
    const draftDayM = draft.match(/(\d+)\s*(?:day|hari)/i);
    const statedDays = draftDayM ? parseInt(draftDayM[1]) : null;
    checks.duration_matches = statedDays === null || statedDays === pkgDays;
    if (!checks.duration_matches) {
      notesForStaff.push(`Duration mismatch. Customer asked ${req.duration}D but package is ${pkgDays}D. Verify route feasibility.`);
    }
  } else {
    checks.duration_matches = true;
  }

  // 4. origin_finish_matches
  const pkgOrigin = matched.packageData?.origin as string | undefined;
  const pkgFinish = matched.packageData?.finish as string | undefined;
  const originOk = !pkgOrigin || !req.startCity || req.startCity === pkgOrigin;
  const finishOk = !pkgFinish || !req.finishCity || req.finishCity === pkgFinish;
  checks.origin_finish_matches = originOk && finishOk;
  if (!checks.origin_finish_matches) {
    notesForStaff.push(`Origin/finish mismatch. Package: ${pkgOrigin}→${pkgFinish}. Customer: ${req.startCity}→${req.finishCity}.`);
  }

  // 5. destinations_match
  const pkgDests = (matched.packageData?.destinations as string[]) ?? [];
  const missing = req.destinations.filter(d => !pkgDests.includes(d));
  checks.destinations_match = missing.length === 0;
  if (!checks.destinations_match) {
    notesForStaff.push(`Destinations not in matched package: ${missing.join(", ")}. Consider different package.`);
  }

  // 6. itinerary_order_valid
  const totalDays = matched.itineraryData?.total_days as number | undefined;
  if (totalDays) {
    const dayMentions = draft.match(/day (\d+)/gi) ?? [];
    const maxMentioned = dayMentions.length > 0
      ? Math.max(...dayMentions.map(m => parseInt(m.replace(/day /i, ""))))
      : 0;
    checks.itinerary_order_valid = maxMentioned <= totalDays;
    if (!checks.itinerary_order_valid) {
      notesForStaff.push(`Draft mentions Day ${maxMentioned} but package only has ${totalDays} days.`);
    }
  } else {
    checks.itinerary_order_valid = true;
  }

  // 7. vehicle_crew_claim
  const hasMpvClaim = d.includes("mpv") || d.includes("avanza");
  const hasHiaceClaim = d.includes("hiace");
  const pax = req.pax;
  let vehicleOk = true;
  if (pax) {
    if (hasMpvClaim && pax > 3) vehicleOk = false;
    if (hasHiaceClaim && pax < 4) vehicleOk = false;
  }
  checks.vehicle_crew_claim = vehicleOk;
  if (!vehicleOk) {
    notesForStaff.push(`Vehicle claim may not match pax (${pax}). MPV=1-3pax, Hiace=4-9pax.`);
  }

  // 8. hotel_claim_supported
  const hotelClaim = /\b(?:hotel|accommodation|stay|menginap|akomodasi)\b/i.test(draft);
  checks.hotel_claim_supported = !hotelClaim || matched.packageSlug != null;
  if (!checks.hotel_claim_supported) {
    notesForStaff.push("Hotel claim made but no package matched. Verify hotel details from itinerary.");
  }

  // 9. no_invented_inclusions (specific: helmet as JVTO inclusion at Madakaripura)
  const helmetMadaka = /helmet.*(?:madakaripura|jvto.*provide|we.*include)/i.test(draft);
  checks.no_invented_inclusions = !helmetMadaka;
  if (!checks.no_invented_inclusions) {
    fail("no_invented_inclusions", "Helmets at Madakaripura are provided by local site management — NOT JVTO. Remove this claim.");
  }

  // 10. no_manual_price_quote — check draft text
  const priceRx = /\bIDR\s*[\d,]+|\bRp\.?\s*[\d.,]+|[\d]{1,3}(?:,[\d]{3}){2,}/;
  checks.no_manual_price_quote = !priceRx.test(draft);
  if (!checks.no_manual_price_quote) {
    fail("no_manual_price_quote", "Specific price detected. Share the package URL instead — staff confirms pax-tier price before quoting.");
  }

  // 11. no_discount_promise — check draft text OR incoming message risk signal
  const discountKws = ["diskon", "discount", "price reduction", "potongan harga", "special price", "cheaper"];
  const discountInDraft = discountKws.some(kw => d.includes(kw));
  const discountInRequest = req.riskSignals.includes("discount");
  checks.no_discount_promise = !discountInDraft && !discountInRequest;
  if (!checks.no_discount_promise) {
    fail("no_discount_promise", "Discount request detected. Never promise discounts. Only FOC policy (18+/35+/50+ pax direct bookings) applies.");
  }

  // 12. no_refund_promise — check draft text OR incoming message risk signal
  const refundKws = ["uang kembali", "money back", "pengembalian uang", "reimburse"];
  const refundInDraft = refundKws.some(kw => d.includes(kw));
  const refundInRequest = req.riskSignals.includes("refund");
  checks.no_refund_promise = !refundInDraft && !refundInRequest;
  if (!checks.no_refund_promise) {
    fail("no_refund_promise", "Refund request detected. Explain Travel Credit policy (≥48h = 100% credit, transferable). Cash refund not available.");
  }

  // 13. no_transport_only — check draft text OR incoming message risk signal
  const transportKws = ["jemput saja", "driver only", "transport only", "kendaraan saja", "supir saja", "vehicle only", "driver-only"];
  const transportInDraft = transportKws.some(kw => d.includes(kw));
  const transportInRequest = req.riskSignals.includes("transport-only");
  checks.no_transport_only = !transportInDraft && !transportInRequest;
  if (!checks.no_transport_only) {
    fail("no_transport_only", "Transport-only request detected. JVTO operates end-to-end packages only. Redirect to full package.");
  }

  // 14. no_weather_guarantee
  const weatherKws = ["guaranteed blue fire", "pasti blue fire", "guaranteed sunrise", "100% visible", "blue fire guaranteed", "definitely see blue fire"];
  checks.no_weather_guarantee = !weatherKws.some(kw => d.includes(kw));
  if (!checks.no_weather_guarantee) {
    fail("no_weather_guarantee", "Weather guarantee detected. Use: 'Blue Fire is a natural phenomenon subject to weather and gas activity.'");
  }

  // 15. no_safety_guarantee
  const safetyKws = ["100% safe", "absolutely safe", "aman 100%", "no risk", "risk-free", "completely safe"];
  checks.no_safety_guarantee = !safetyKws.some(kw => d.includes(kw));
  if (!checks.no_safety_guarantee) {
    fail("no_safety_guarantee", "Blanket safety guarantee detected. Describe specific safety measures (gas masks, health screening) instead.");
  }

  // 16. no_klook_policy_claim
  const klookPolicy = /klook.*(?:refund|cancel|change|date|policy)/i.test(draft);
  checks.no_klook_policy_claim = !klookPolicy;
  if (!checks.no_klook_policy_claim) {
    notesForStaff.push("Klook policy claim detected. Use klook_change_redirect template: redirect to https://www.klook.com/contact-us");
  }

  // 17. draft_is_draft
  checks.draft_is_draft = true; // system never auto-sends

  // 18. reply_language_is_english_by_default
  const idWords = bv.fields.language_detection_keywords.indonesian;
  const detectedIdInDraft = idWords.filter(w => d.includes(w)).length >= 3;
  checks.reply_language_is_english_by_default = req.lang === "id" ? true : !detectedIdInDraft;
  if (!checks.reply_language_is_english_by_default) {
    notesForStaff.push("Message appears English but draft contains Indonesian. Check language before sending.");
  }

  // 19. no_mixed_language_unless_required — word boundary safe
  const idWordCount = idWords
    .filter(w => w.length >= 4)
    .filter(w => {
      const rx = new RegExp(`(?:^|\\s|[^a-z])${w}(?:$|\\s|[^a-z])`, "i");
      return rx.test(d);
    }).length;
  const hasIdWords = idWordCount >= 2;
  const hasEnWords = /\b(?:hi|hello|we|our|your|tour|package|booking|days?)\b/i.test(draft);
  checks.no_mixed_language_unless_required = !(hasIdWords && hasEnWords);
  if (!checks.no_mixed_language_unless_required) {
    notesForStaff.push("Mixed language detected. Draft should use one language only.");
  }

  // 20. follows_jvto_brand_voice
  const forbiddenUsed = bv.fields.forbidden_phrases.filter(f => d.includes(f.toLowerCase()));
  checks.follows_jvto_brand_voice = forbiddenUsed.length === 0;
  if (!checks.follows_jvto_brand_voice) {
    fail("follows_jvto_brand_voice", `Forbidden brand voice phrase(s): ${forbiddenUsed.join(", ")}. Remove before sending.`);
  }

  // 21. no_generic_or_unverified_claims
  const genericKws = ["world-class", "best in class", "amazing experience", "unforgettable", "trust us", "authentic indonesia", "hidden gem", "incredible", "we care about your safety"];
  const genericFound = genericKws.filter(kw => d.includes(kw));
  checks.no_generic_or_unverified_claims = genericFound.length === 0;
  if (!checks.no_generic_or_unverified_claims) {
    notesForStaff.push(`Generic/unverified phrase(s): ${genericFound.join(", ")}. Replace with specific facts.`);
  }

  // Scoring
  const isBlocked = failedRules.some(r => BLOCKING_RULES.has(r));
  const riskLevel: "low" | "medium" | "high" =
    isBlocked || req.riskSignals.length > 0 ? "high" :
    failedRules.length > 0 || notesForStaff.length > 0 ? "medium" :
    "low";

  const verificationStatus =
    isBlocked ? "blocked" :
    failedRules.length > 0 || notesForStaff.length > 0 ? "needs_review" :
    "passed";

  return {
    riskLevel,
    verificationStatus,
    checks,
    failedRules,
    notesForStaff,
    sourceRefs: [
      "wiki/ops/2026-05-14-whatsapp-rules-engine.md",
      "wiki/content/brand-voice.md",
      ...matched.sourceRefs,
    ],
  };
}
