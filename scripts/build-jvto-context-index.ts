#!/usr/bin/env node
// scripts/build-jvto-context-index.ts
// Run: npm run build:context
// Env: WIKI_PATH=E:\Users\JAVA VOLCANO\llm-wiki

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// ── Env ────────────────────────────────────────────────────────────────────

const envFile = join(process.cwd(), ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf-8").split("\n")) {
    const eq = line.indexOf("=");
    if (eq > 0 && !line.startsWith("#")) {
      const key = line.slice(0, eq).trim();
      const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const WIKI = process.env.WIKI_PATH;
if (!WIKI) { console.error("❌ WIKI_PATH not set in .env.local"); process.exit(1); }

const OUT = join(process.cwd(), "compiled", "jvto-context");
mkdirSync(OUT, { recursive: true });

function read(rel: string) { return readFileSync(join(WIKI!, rel), "utf-8"); }
function write(name: string, data: unknown) {
  writeFileSync(join(OUT, name), JSON.stringify(data, null, 2), "utf-8");
  const count = Array.isArray(data) ? `${(data as unknown[]).length} items` : "object";
  console.log(`✓ ${name} (${count})`);
}

interface IndexItem {
  id: string;
  title: string;
  summary: string;
  fields: Record<string, unknown>;
  sourceRefs: string[];
  riskNotes?: string[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const INCLUSIONS_BASE = [
  "Private AC transport (MPV or Hiace based on group size)",
  "Professional driver + English-speaking escort guide",
  "All entrance fees and permits for listed locations",
  "Daily mineral water in vehicle",
  "JVTO travel T-shirt (1 per participant)",
  "Full pickup to drop-off service",
  "Meals as stated in itinerary",
];
const INCLUSIONS_IJEN = [
  "Gas masks + trekking poles at Ijen Crater",
  "Ijen health-screening coordination (when BBKSDA access rules require it)",
];
const INCLUSIONS_BROMO = ["Private 4WD Jeep for Bromo crater area"];
const INCLUSIONS_BALI = ["Ferry crossing Bali–Java (Gilimanuk–Ketapang)"];
const EXCLUSIONS = [
  "International / domestic flights",
  "Tips for driver and guide",
  "Personal expenses (snacks, souvenirs, laundry)",
  "Travel insurance",
  "Indonesian VISA (if applicable)",
  "Meals not stated in itinerary",
];
const VEHICLE_ALLOCATION = {
  "1-3": "1x MPV (Toyota Avanza or similar)",
  "4-9": "1x Toyota Hiace (16-seat minibus)",
  "10-11": "1x Hiace + 1x MPV",
};

// ── Index 1: packages ──────────────────────────────────────────────────────

function extractDests(slug: string): string[] {
  const s = slug.toLowerCase();
  const d: string[] = [];
  if (s.includes("ijen")) d.push("ijen");
  if (s.includes("bromo")) d.push("bromo");
  if (s.includes("madakaripura")) d.push("madakaripura");
  if (s.includes("tumpak")) d.push("tumpak-sewu");
  if (s.includes("papuma")) d.push("papuma");
  if (s.includes("malang")) d.push("malang");
  if (s.includes("taman-safari") || s.includes("prigen")) d.push("taman-safari");
  return d;
}

function parseRoute(notation: string, rawSlug: string) {
  if (notation) {
    const parts = notation.split("→");
    if (parts.length === 2) {
      return {
        origin: parts[0].trim() === "SUB" ? "surabaya" : "bali",
        finish: parts[1].trim() === "SUB" ? "surabaya" : "bali",
      };
    }
  }
  const s = rawSlug.toLowerCase();
  const isBali = s.startsWith("bali/") || s.startsWith("tours/from-bali/");
  return { origin: isBali ? "bali" : "surabaya", finish: isBali ? "bali" : "surabaya" };
}

function parsePricingTable(section: string): Record<string, number> {
  const tiers: Record<string, number> = {};
  const lines = section.split("\n").filter(l => l.trim().startsWith("|"));
  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i].split("|").map(c => c.trim()).filter(Boolean);
    if (cells.length < 2) continue;
    const key = cells[0].replace(/\s*\(solo\)\s*/i, "").trim();
    const price = parseInt(cells[1].replace(/,/g, ""));
    if (!isNaN(price) && price > 0) tiers[key] = price;
  }
  return tiers;
}

function buildUrl(rawSlug: string, origin: string): string {
  const base = "https://javavolcano-touroperator.com";
  if (rawSlug.startsWith("tours/")) return `${base}/${rawSlug}`;
  if (origin === "bali") return `${base}/tours/from-bali/${rawSlug}`;
  return `${base}/tours/from-surabaya/${rawSlug}`;
}

function buildPackagesIndex(): IndexItem[] {
  const pricingMd = read("wiki/products/packages-full-pricing.md");
  const items: IndexItem[] = [];
  const sections = pricingMd.split(/\n(?=### `)/);

  for (const sec of sections) {
    if (!sec.startsWith("### `")) continue;
    const headingLine = sec.split("\n")[0];
    const m = headingLine.match(/^### `([^`]+)` — ([^(]+?)(?:\s*\(([^)]+)\))?\s*$/);
    if (!m) continue;

    const rawSlug = m[1].trim();
    // Skip dual-slug student heading lines
    if (rawSlug.includes(" and ")) continue;

    const description = m[2].trim();
    const { origin, finish } = parseRoute(m[3] ?? "", rawSlug);
    const durM = rawSlug.match(/(\d+)d(\d+)n$/i);
    const duration_days = durM ? parseInt(durM[1]) : 1;
    const duration_nights = durM ? parseInt(durM[2]) : 0;

    // Clean slug for matching (strip path prefix)
    const cleanSlug = rawSlug.replace(/^tours\/(?:from-\w+\/|student-package\/)/, "");
    const destinations = extractDests(cleanSlug);
    const ijen_relevant = destinations.includes("ijen");
    const bromo_relevant = destinations.includes("bromo");

    items.push({
      id: cleanSlug,
      title: description,
      summary: `${duration_days}D${duration_nights}N ${origin}→${finish}. Destinations: ${destinations.join(", ")}`,
      fields: {
        slug: cleanSlug,
        rawSlug,
        name: description,
        duration_days,
        duration_nights,
        origin,
        finish,
        destinations,
        ijen_relevant,
        bromo_relevant,
        pax_tiers: parsePricingTable(sec),
        url: buildUrl(rawSlug, origin),
        inclusions: [
          ...INCLUSIONS_BASE,
          ...(ijen_relevant ? INCLUSIONS_IJEN : []),
          ...(bromo_relevant ? INCLUSIONS_BROMO : []),
          ...(origin === "bali" ? INCLUSIONS_BALI : []),
        ],
        exclusions: EXCLUSIONS,
        vehicle_allocation: VEHICLE_ALLOCATION,
        isStudent: rawSlug.includes("student-package"),
        isSpecialty: rawSlug.includes("taman-safari"),
      },
      sourceRefs: ["wiki/products/packages-full-pricing.md", "wiki/products/packages-overview.md"],
    });
  }

  return items;
}

// ── Index 2: itineraries ───────────────────────────────────────────────────

function buildItinerariesIndex(): IndexItem[] {
  const md = read("wiki/products/packages-itineraries.md");
  const items: IndexItem[] = [];
  const sections = md.split(/\n(?=#{2,3} `)/);

  for (const sec of sections) {
    const headingM = sec.match(/^#{2,3} `([^`]+)`/);
    if (!headingM) continue;
    const rawSlug = headingM[1];
    const cleanSlug = rawSlug.replace(/^tours\/(?:from-\w+\/|student-package\/)/, "");

    const days: Array<{ day: number; title: string; meals: string; hotel: string }> = [];
    const tableMatch = sec.match(/\| Day[\s\S]*?(?=\n\n|\n#{2,3}|$)/);
    if (tableMatch) {
      const rows = tableMatch[0].split("\n").filter(l => l.trim().startsWith("|"));
      for (let i = 2; i < rows.length; i++) {
        const cells = rows[i].split("|").map(c => c.trim()).filter(Boolean);
        if (cells.length < 2) continue;
        const dayNum = parseInt(cells[0]);
        if (isNaN(dayNum)) continue;
        days.push({ day: dayNum, title: cells[1] ?? "", meals: cells[2] ?? "", hotel: cells[3] ?? "" });
      }
    }
    if (days.length === 0) continue;

    items.push({
      id: cleanSlug,
      title: `Itinerary: ${cleanSlug}`,
      summary: `${days.length}-day itinerary`,
      fields: {
        packageSlug: cleanSlug,
        days,
        total_days: days.length,
        hotels: [...new Set(days.map(d => d.hotel).filter(Boolean))],
      },
      sourceRefs: ["wiki/products/packages-itineraries.md"],
    });
  }
  return items;
}

// ── Index 3: operational-facts ─────────────────────────────────────────────

function buildOperationalFactsIndex(): IndexItem[] {
  return [
    {
      id: "temperatures",
      title: "Destination Temperatures",
      summary: "Temperature ranges at key JVTO destinations",
      fields: {
        bromo: { celsius: "5–15°C", fahrenheit: "41–59°F", when: "Pre-dawn sunrise slot" },
        ijen: { celsius: "10–15°C", fahrenheit: "50–59°F", when: "Midnight departure + crater rim" },
      },
      sourceRefs: ["wiki/content/operational-facts.md"],
    },
    {
      id: "travel-times",
      title: "Estimated Travel Times",
      summary: "Key route travel time estimates",
      fields: {
        "surabaya-to-bromo": "~3 hours",
        "ijen-to-surabaya": "5–6 hours",
        "tumpak-sewu-to-bromo": "3–4 hours",
        "bali-to-ijen": "5–7 hours",
        caveat: "Estimates. Actual time varies with traffic, weather, ferry schedule.",
      },
      sourceRefs: ["wiki/content/operational-facts.md"],
    },
    {
      id: "timing-guidelines",
      title: "Arrival & Departure Timing",
      summary: "Pickup and flight timing guidelines",
      fields: {
        day1_latest_pickup: "16:00 WIB",
        last_day_flight_min: "18:00 WIB",
        last_day_flight_recommended: "20:00 WIB",
        applies_to: "All Surabaya-origin and Surabaya-finish packages",
      },
      sourceRefs: ["wiki/content/operational-facts.md"],
    },
    {
      id: "ijen-closure",
      title: "Ijen Closure Schedule",
      summary: "Regular and irregular Ijen closure schedule",
      fields: {
        regular_closure: "First Friday of every month — crater closed to visitors",
        additional_closures: "Issued by BBKSDA East Java based on volcanic gas levels",
        jvto_policy: "Follows official BBKSDA announcements — no bypass",
        check_url: "bbksdajatim.org",
      },
      sourceRefs: ["wiki/content/operational-facts.md"],
    },
    {
      id: "ijen-practical",
      title: "Ijen Practical Facts",
      summary: "Practical facts for Ijen hike",
      fields: {
        health_screening_location: "Nurse visits guest hotel the evening before the hike (Bondowoso/Banyuwangi area)",
        trek_difficulty: "Moderate — ~1.5–2 hours each way, steep rocky trail",
        gas_mask: "Provided by JVTO as standard inclusion on all Ijen packages",
        no_qr_no_access: "No Valid QR Code = No Crater Zone Access (BBKSDA SE.1658/KSA.9/2024)",
        trolley_ojek: "Available on-site at extra cost — NOT a JVTO inclusion",
      },
      sourceRefs: ["wiki/content/operational-facts.md"],
    },
    {
      id: "support-hours",
      title: "Customer Support Hours",
      summary: "JVTO support availability",
      fields: {
        hours: "08:00–22:00 WIB (GMT+7) daily",
        whatsapp: "+62 822-4478-8833",
        email: "hello@javavolcano-touroperator.com",
      },
      sourceRefs: ["wiki/content/operational-facts.md"],
    },
    {
      id: "transport-only-policy",
      title: "Transport-Only / Partial Tour Policy",
      summary: "JVTO does not offer transport-only services",
      fields: {
        policy: "Not offered",
        reason: "End-to-end quality control is the operational model",
        redirect: "Guests seeking driver-only or car rental should use a different provider",
      },
      sourceRefs: ["wiki/content/operational-facts.md"],
      riskNotes: ["Transport-only request → no_transport_only verification flag"],
    },
    {
      id: "cancellation-policy",
      title: "Cancellation & Refund Policy",
      summary: "JVTO cancellation rules",
      fields: {
        gte_48h: "100% Travel Credit (no expiry, transferable, giftable)",
        lt_48h: "Fully forfeited — no Travel Credit",
        cash_refund: "NOT available for guest-initiated cancellation",
        closure_policy: "Official closure → safe alternative route, reschedule, or destination-fee adjustment",
        rescheduling: "One free reschedule ≥48h before Day 1, same package, subject to availability",
      },
      sourceRefs: ["wiki/products/packages-overview.md"],
      riskNotes: ["No refund promise in draft — any refund question must be escalated"],
    },
    {
      id: "payment-policy",
      title: "Payment Policy",
      summary: "Deposit and balance payment terms",
      fields: {
        deposit: "20% of total booking value (card via secure JVTO link)",
        close_departure_rule: "If Day 1 within 14 days, JVTO may require up to 100% full payment",
        card_balance_deadline: "No later than 5 days before Day 1",
        bank_wire_deadline: "No later than 3 days before Day 1",
        cash: "Only if approved in writing in advance",
      },
      sourceRefs: ["wiki/products/packages-overview.md"],
    },
    {
      id: "micro-customization",
      title: "Tour Customization Policy",
      summary: "What JVTO can and cannot customize",
      fields: {
        allowed: [
          "Room type change (twin vs double)",
          "Hotel room category upgrade (may cost extra)",
          "Optional on-site activities (horse riding at Bromo, trolley ojek at Ijen)",
          "Adjust pickup time to fit flight/train schedule",
        ],
        not_allowed: [
          "Changing main destination sequence or route",
          "Significantly altering package duration",
          "Vehicle-only or transport-only services",
        ],
      },
      sourceRefs: ["wiki/content/operational-facts.md"],
    },
  ];
}

// ── Index 4: canned-responses ──────────────────────────────────────────────

function inferQuestionType(id: string, title: string): string {
  const s = (id + " " + title).toLowerCase();
  if (s.includes("refund") || s.includes("cancel") || s.includes("closure")) return "POLICY";
  if (s.includes("price") || s.includes("harga") || s.includes("quot")) return "PRICING";
  if (s.includes("proposal") || s.includes("payment") || s.includes("deposit")) return "BOOKING";
  if (s.includes("complaint") || s.includes("objection")) return "COMPLAINT";
  if (s.includes("pack") || s.includes("what to bring") || s.includes("dress") || s.includes("reminder")) return "SAFETY";
  if (s.includes("custom") || s.includes("jadwal khusus")) return "POLICY";
  return "INQUIRY";
}

function buildCannedResponsesIndex(): IndexItem[] {
  const md = read("wiki/ops/canned-responses.md");
  const items: IndexItem[] = [];
  let currentStage = "UNKNOWN";

  const sections = md.split(/\n(?=### )/);

  for (const sec of sections) {
    // Track ## stage headings within section
    const stageM = sec.match(/^## (STAGE \d+[^\n]*)/m);
    if (stageM) currentStage = stageM[1].trim().split(" — ")[0].trim();

    const headingM = sec.match(/^### ([A-Z]+-\d+[A-Z]?) · ([^\n`]+)/);
    if (!headingM) continue;

    const templateId = headingM[1].trim();
    const title = headingM[2].trim();
    const tagMatches = sec.match(/`\[([^\]]+)\]`/g) ?? [];
    const tags = tagMatches.map(t => t.replace(/`\[|\]`/g, "").trim());

    // Extract EN and ID bodies from backtick code blocks after language markers
    const idM = sec.match(/\*\*\[ID\]\*\*\s*\n```[^\n]*\n([\s\S]*?)```/);
    const enM = sec.match(/\*\*\[EN\]\*\*\s*\n```[^\n]*\n([\s\S]*?)```/);
    const bodyId = idM ? idM[1].trim() : "";
    const bodyEn = enM ? enM[1].trim() : "";

    // Extract variables from [CAPS] and {lower} patterns
    const allBody = bodyId + " " + bodyEn;
    const varMatches = allBody.match(/\[[A-Z][A-Z\s]{2,}\]|\{[a-z_]+\}/g) ?? [];
    const variables = [...new Set(varMatches)];

    items.push({
      id: templateId,
      title,
      summary: `${currentStage}: ${title}`,
      fields: {
        templateId,
        stage: currentStage,
        tags,
        isAuto: tags.includes("Auto"),
        questionType: inferQuestionType(templateId, title),
        lang: { en: bodyEn, id: bodyId },
        variables,
        channel: tags.includes("EMAIL") ? "email" : "whatsapp",
      },
      sourceRefs: ["wiki/ops/canned-responses.md"],
    });
  }

  return items;
}

// ── Index 5: reply-guards ──────────────────────────────────────────────────

function buildReplyGuardsIndex(): IndexItem[] {
  return [
    {
      id: "no_price_quote",
      title: "No manual price quote",
      summary: "Never quote specific IDR prices in a draft",
      fields: {
        trigger_keywords: ["IDR", "Rp", "harga", "price", "biaya", "cost", "per person", "per orang"],
        trigger_patterns: ["\\bIDR\\s*[\\d,]+", "\\bRp\\.?\\s*[\\d.,]+"],
        risk_level: "high",
        block: true,
        notes_for_staff: "Share the package URL instead. Staff confirms pax-tier price from packages-full-pricing.",
      },
      sourceRefs: ["wiki/ops/2026-05-14-whatsapp-rules-engine.md"],
      riskNotes: ["Hard rule #1: price quote → escalate_sam"],
    },
    {
      id: "no_discount_promise",
      title: "No discount promise",
      summary: "Never promise discounts",
      fields: {
        trigger_keywords: ["diskon", "discount", "price reduction", "cheaper", "potongan harga", "special price", "promo"],
        risk_level: "high",
        block: true,
        notes_for_staff: "FOC policy (18+/35+/50+ pax direct bookings) is the only canonical concession.",
      },
      sourceRefs: ["wiki/ops/2026-05-14-whatsapp-rules-engine.md"],
    },
    {
      id: "no_refund_promise",
      title: "No refund promise",
      summary: "Never promise cash refunds",
      fields: {
        trigger_keywords: ["refund", "uang kembali", "money back", "pengembalian uang", "reimburse"],
        risk_level: "high",
        block: true,
        notes_for_staff: "Explain Travel Credit policy (≥48h before Day 1). Cash refund not available.",
      },
      sourceRefs: ["wiki/ops/2026-05-14-whatsapp-rules-engine.md"],
    },
    {
      id: "no_transport_only",
      title: "No transport-only offer",
      summary: "Never offer driver-only or transport-only services",
      fields: {
        trigger_keywords: ["jemput saja", "driver only", "transport only", "car only", "kendaraan saja", "supir saja", "vehicle only"],
        risk_level: "high",
        block: true,
        notes_for_staff: "JVTO operates end-to-end packages only. Redirect to full package.",
      },
      sourceRefs: ["wiki/content/operational-facts.md"],
    },
    {
      id: "no_weather_guarantee",
      title: "No blue fire / weather / sunrise guarantee",
      summary: "Never guarantee natural phenomena",
      fields: {
        trigger_keywords: ["guaranteed blue fire", "pasti blue fire", "guaranteed sunrise", "100% visible", "blue fire guaranteed"],
        risk_level: "high",
        block: true,
        notes_for_staff: "Approved: 'Blue Fire is a natural phenomenon subject to weather and gas activity.'",
        approved_phrase: "Blue Fire is a natural phenomenon subject to weather and gas activity.",
      },
      sourceRefs: ["wiki/content/brand-voice.md"],
    },
    {
      id: "no_safety_guarantee",
      title: "No uncaveated safety guarantee",
      summary: "Never guarantee absolute safety",
      fields: {
        trigger_keywords: ["100% safe", "absolutely safe", "aman 100%", "no risk", "risk-free", "completely safe"],
        risk_level: "high",
        block: true,
        notes_for_staff: "Describe specific safety measures (gas masks, health screening, guide experience) instead.",
      },
      sourceRefs: ["wiki/content/brand-voice.md"],
    },
    {
      id: "no_klook_policy_claim",
      title: "No unsupported Klook policy claim",
      summary: "Redirect Klook change/refund to Klook CS",
      fields: {
        trigger_keywords: ["klook refund", "klook cancel", "klook change", "klook policy"],
        risk_level: "high",
        block: false,
        notes_for_staff: "For Klook date changes or refunds, redirect to Klook CS: https://www.klook.com/contact-us",
        approved_template: "klook_change_redirect",
      },
      sourceRefs: ["wiki/ops/2026-05-14-whatsapp-rules-engine.md"],
    },
    {
      id: "no_invented_inclusions",
      title: "No invented inclusions",
      summary: "Only state inclusions present in the matched package",
      fields: {
        known_exceptions: [
          "Helmets at Madakaripura = local site management, NOT JVTO",
          "Medical screening = conditional on BBKSDA rules, not mandatory",
          "Horse riding at Bromo = optional extra, not included",
        ],
        risk_level: "medium",
        block: false,
        notes_for_staff: "Verify each inclusion claim against packages-overview.md inclusions list.",
      },
      sourceRefs: ["wiki/products/packages-overview.md"],
    },
    {
      id: "package_exists",
      title: "Package existence check",
      summary: "Mentioned package must exist in packages.index.json",
      fields: {
        risk_level: "medium",
        block: false,
        notes_for_staff: "If package not found, use clarification draft. Do not invent package names.",
      },
      sourceRefs: ["wiki/products/packages-overview.md"],
    },
    {
      id: "duration_matches",
      title: "Duration matches official package",
      summary: "Stated duration must match official package.duration_days",
      fields: {
        risk_level: "medium",
        block: false,
        notes_for_staff: "Tumpak Sewu cannot fit 3D2N with Bromo + Ijen. Check route feasibility.",
      },
      sourceRefs: ["wiki/products/packages-itineraries.md"],
    },
    {
      id: "no_auto_send",
      title: "Draft must not imply auto-send",
      summary: "System never auto-sends — always pending human review",
      fields: {
        risk_level: "low",
        block: true,
        notes_for_staff: "Review and approve draft before clicking Send.",
      },
      sourceRefs: ["wiki/ops/2026-05-14-whatsapp-rules-engine.md"],
    },
  ];
}

// ── Index 6: brand-voice ───────────────────────────────────────────────────

function buildBrandVoiceIndex(): object {
  return {
    id: "jvto-brand-voice",
    title: "JVTO Brand Voice",
    summary: "Brand voice rules for all customer-facing WhatsApp drafts",
    fields: {
      default_language: "en",
      language_detection: {
        en: "DEFAULT — use for all customer drafts unless message is clearly Indonesian",
        id: "Only if incoming message contains ≥3 Indonesian-specific keywords",
        no_mix: "Never mix languages in one draft",
      },
      tone: "Direct, professional, evidence-led. Never sell — inform.",
      style: "WhatsApp-ready: short, scannable, package-first. No generic travel-agent phrasing.",
      registers: {
        whatsapp: "Style B — 'we' voice, concrete promises, evidence-anchored. Concise.",
        email: "Style A — dense, fact-led, citation-first.",
      },
      voice_attributes: {
        direct: true,
        evidence_led: true,
        transparent: true,
        no_fluff: true,
        no_superlatives: true,
      },
      forbidden_phrases: [
        "blue fire guaranteed",
        "100% blue fire visible",
        "mandatory health screening",
        "jvto provides police escort",
        "world-class",
        "best in class",
        "we care about your safety",
        "amazing experience",
        "unforgettable journey",
        "trust us",
        "authentic indonesia",
        "hidden gem",
        "incredible",
        "exclusive experience",
      ],
      approved_phrases: {
        blue_fire: "Blue Fire is a natural phenomenon subject to weather and gas activity.",
        ijen_screening: "JVTO coordinates clinic workflow when access rules require it.",
        health_certificate: "Ijen access rules can require a recent local health certificate.",
        gas_mask: "Gas masks provided by JVTO.",
        private_tours: "100% private — no shared groups",
        price_format: "IDR X,XXX,XXX/person",
        all_inclusive: "All-inclusive — no surprise local payments",
      },
      key_phrases: [
        "Tourist Police-led",
        "100% private — no shared groups",
        "Licensed operator, NIB 1102230032918",
        "Health-screening coordination",
        "All-inclusive — no surprise local payments",
      ],
      whatsapp_format: {
        greeting_template: "Hi [Name] 😊",
        default_sign_off: "— JVTO",
        utm_tracking: "?utm_source=whatsapp",
        length: "short, scannable — 3–7 lines for simple replies",
        structure: "Direct answer → Package/policy detail → CTA",
        no_mixed_language: true,
      },
      positioning_rules: {
        no_transport_only: true,
        no_blue_fire_guarantee: true,
        no_weather_guarantee: true,
        no_sunrise_guarantee: true,
        no_invented_prices: true,
        no_invented_policies: true,
        all_tours_private: true,
        redirect_booking_to_website: true,
        utm_tracking_on_links: true,
      },
      language_detection_keywords: {
        indonesian: [
          "halo", "saya", "mau", "kami", "boleh", "tolong", "mohon",
          "terima kasih", "berapa", "untuk", "dari", "dengan", "atau",
          "apakah", "bagaimana", "paket", "harga", "tanggal", "orang",
          "hari", "malam", "perjalanan",
        ],
        threshold: 3,
      },
    },
    sourceRefs: [
      "wiki/content/brand-voice.md",
      "wiki/ops/canned-responses.md",
      "Raw/JVTO_Verified_Customer_Reply_Skill.md",
    ],
    riskNotes: [
      "Forbidden phrase detected → verificationStatus = blocked",
      "Wrong language for context → verificationStatus = needs_review",
    ],
  };
}

// ── Main ───────────────────────────────────────────────────────────────────

function main() {
  console.log(`\nBuilding JVTO context indexes from: ${WIKI}`);
  console.log(`Output: ${OUT}\n`);
  write("packages.index.json", buildPackagesIndex());
  write("itineraries.index.json", buildItinerariesIndex());
  write("operational-facts.index.json", buildOperationalFactsIndex());
  write("canned-responses.index.json", buildCannedResponsesIndex());
  write("reply-guards.index.json", buildReplyGuardsIndex());
  write("brand-voice.index.json", buildBrandVoiceIndex());
  console.log("\n✅ All context indexes built.");
}

main();
