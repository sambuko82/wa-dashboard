export type QuestionType =
  | "INQUIRY"
  | "PRICING"
  | "BOOKING"
  | "POLICY"
  | "COMPLAINT"
  | "SAFETY"
  | "UNKNOWN";

export interface ExtractedRequest {
  destinations: string[];
  startCity: string | null;
  finishCity: string | null;
  pax: number | null;
  duration: number | null;
  packageSlug: string | null;
  klookRef: string | null;
  questionType: QuestionType;
  riskSignals: string[];
  lang: "en" | "id";
  rawMessage: string;
}

const DEST_MAP: [string, string][] = [
  ["kawah ijen", "ijen"], ["blue fire", "ijen"], ["ijen", "ijen"],
  ["mount bromo", "bromo"], ["gunung bromo", "bromo"], ["bromo", "bromo"],
  ["tumpak sewu", "tumpak-sewu"], ["tumpak-sewu", "tumpak-sewu"], ["tumpak", "tumpak-sewu"],
  ["madakaripura waterfall", "madakaripura"], ["madakaripura", "madakaripura"],
  ["papuma beach", "papuma"], ["papuma", "papuma"],
  ["malang city", "malang"], ["malang", "malang"],
  ["taman safari", "taman-safari"], ["prigen", "taman-safari"],
];

// Word-boundary-safe Indonesian keywords (min 4 chars to avoid English substring collisions)
const ID_KEYWORDS = [
  "halo", "saya", "mau", "kami", "boleh", "tolong", "mohon",
  "berapa", "untuk", "dari", "dengan", "atau", "apakah", "bagaimana",
  "paket", "harga", "tanggal", "orang", "hari", "malam", "perjalanan",
  "ingin", "bisa", "sudah", "belum", "nanti",
  "tidak", "juga", "lebih", "juga", "diskon", "wisata", "pesan",
  "terima kasih", "jumlah", "rencana", "besar", "kecil",
];

// Tested as word-boundary substrings only (longer forms prevent false matches)
const ID_WORD_BOUNDARIES = ID_KEYWORDS.filter(k => k.length >= 4);

const RISK_MAP: [string, string][] = [
  ["diskon", "discount"], ["discount", "discount"], ["price reduction", "discount"],
  ["potongan harga", "discount"], ["special price", "discount"], ["promo", "discount"],
  ["refund", "refund"], ["uang kembali", "refund"], ["money back", "refund"],
  ["pengembalian uang", "refund"], ["reimburse", "refund"],
  ["jemput saja", "transport-only"], ["driver only", "transport-only"],
  ["transport only", "transport-only"], ["car only", "transport-only"],
  ["kendaraan saja", "transport-only"], ["supir saja", "transport-only"],
  ["vehicle only", "transport-only"], ["just transport", "transport-only"],
  ["guaranteed blue fire", "weather-guarantee"], ["pasti blue fire", "weather-guarantee"],
  ["guaranteed sunrise", "weather-guarantee"], ["blue fire guaranteed", "weather-guarantee"],
  ["100% safe", "safety-guarantee"], ["aman 100%", "safety-guarantee"],
  ["absolutely safe", "safety-guarantee"],
];

export function extractRequest(
  message: string,
  crmContext?: { packageSlug?: string | null }
): ExtractedRequest {
  const msg = message.toLowerCase();

  // Language detection — Indonesian if ≥3 ID keywords matched (word-boundary safe)
  const idCount = ID_WORD_BOUNDARIES.filter(kw => {
    const rx = new RegExp(`(?:^|\\s|[^a-z])${kw}(?:$|\\s|[^a-z])`, "i");
    return rx.test(msg);
  }).length;
  const lang: "en" | "id" = idCount >= 3 ? "id" : "en";

  // Destinations (preserve order, deduplicate)
  const destinations: string[] = [];
  for (const [kw, dest] of DEST_MAP) {
    if (msg.includes(kw) && !destinations.includes(dest)) destinations.push(dest);
  }

  // Origin city
  let startCity: string | null = null;
  if (
    msg.includes("dari surabaya") || msg.includes("from surabaya") ||
    msg.includes("surabaya") || msg.includes(" sub ")
  ) {
    startCity = "surabaya";
  } else if (
    msg.includes("dari bali") || msg.includes("from bali") || msg.includes("bali")
  ) {
    startCity = "bali";
  }

  // Finish city
  let finishCity: string | null = startCity;
  if (
    msg.includes("to bali") || msg.includes("ke bali") ||
    msg.includes("ending in bali") || msg.includes("finish in bali") ||
    msg.includes("end in bali")
  ) {
    finishCity = "bali";
  } else if (msg.includes("to surabaya") || msg.includes("ke surabaya")) {
    finishCity = "surabaya";
  }

  // Duration
  let duration: number | null = null;
  const durM = msg.match(/(\d+)\s*(?:days?|hari)/i);
  if (durM) duration = parseInt(durM[1]);

  // Pax
  let pax: number | null = null;
  const paxM = msg.match(/(\d+)\s*(?:orang|pax|people|person|traveler|guest)/i);
  if (paxM) pax = parseInt(paxM[1]);

  // Question type (first match wins)
  let questionType: QuestionType = "INQUIRY";
  if (/\b(?:harga|price|berapa|how much|cost|biaya|pricing|quote)\b/.test(msg)) {
    questionType = "PRICING";
  } else if (/\b(?:bayar|payment|deposit|booking|book|konfirmasi|confirm|dp|pay)\b/.test(msg)) {
    questionType = "BOOKING";
  } else if (/\b(?:cancel|refund|policy|kebijakan|batal|uang kembali|reschedule)\b/.test(msg)) {
    questionType = "POLICY";
  } else if (/\b(?:complaint|complain|problem|issue|wrong|salah|masalah|keluhan)\b/.test(msg)) {
    questionType = "COMPLAINT";
  } else if (/\b(?:safe|safety|aman|bahaya|danger|health|sehat|bring|bawa|pack|pakai|wear)\b/.test(msg)) {
    questionType = "SAFETY";
  }

  // Risk signals
  const riskSignals: string[] = [];
  for (const [kw, risk] of RISK_MAP) {
    if (msg.includes(kw) && !riskSignals.includes(risk)) riskSignals.push(risk);
  }

  // Klook detection
  const klookRef = /\bklook\b/i.test(message) ? "klook-detected" : null;

  return {
    destinations,
    startCity,
    finishCity,
    pax,
    duration,
    packageSlug: crmContext?.packageSlug ?? null,
    klookRef,
    questionType,
    riskSignals,
    lang,
    rawMessage: message,
  };
}
