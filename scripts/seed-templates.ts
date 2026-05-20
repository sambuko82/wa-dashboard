/**
 * Seed templates for userId: cmnjl9le70000zcahlltdh8fq
 * Run: npx tsx scripts/seed-templates.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { jvtoTemplatePack } from "./jvto-template-pack";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required to seed templates.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  connectionTimeoutMillis: 10_000,
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = new PrismaClient({ adapter: new PrismaPg(pool) as any });

const USER_ID = "cmny7c38a00006lql90lg6yve";

// ─── Template definitions ─────────────────────────────────────────────────────

const legacyTemplates = [
  // ── 1. Trip Media Reminder Crew ───────────────────────────────────────────
  {
    name: "Trip Media Reminder Crew",
    description: "Kirim link media trip + daftar crew ke grup, dengan banner image",
    content: [
      "*Trip Media {customer_name},*",
      "🌐 {media_link}",
      "",
      "🧗‍♂️ *CREW:*",
      "{crew}",
    ].join("\n"),
    mediaType: "image",
    mediaUrl: "https://legacy.javavolcano-touroperator.com/assets/img/banner.jpeg",
    mediaFilename: null,
    variables: [
      { name: "customer_name", isRequired: true,  description: "Nama customer / tamu",                        example: "John Doe" },
      { name: "media_link",    isRequired: true,  description: "Link album/media trip",                       example: "https://drive.google.com/..." },
      { name: "crew",          isRequired: true,  description: "Daftar crew (format: *1. Nama*\\n*2. Nama*)", example: "*1. Budi (Ijen Guide)*\n*2. Sandi*\n" },
    ],
  },

  // ── 2. Reminder Payment ───────────────────────────────────────────────────
  {
    name: "Reminder Payment",
    description: "Reminder sisa pembayaran (balance) ke customer sebelum trip",
    content: [
      "*[JVTO] Payment Reminder — Balance Payment Required* ⏰",
      "",
      "Hi _{customer_name}_, this is a reminder that your booking is confirmed and the *remaining balance* is still unpaid.",
      "",
      "*Booking Details*",
      "- *Booking ID:* {booking_code}",
      "- *Tour Package:* {package_name}",
      "- *Travel Dates:* {travel_date_start} - {travel_date_end}",
      "- *Trip Day 1:* {travel_date_start}",
      "- *Pickup Location:* {pickup_location}",
      "- *Guests (Pax):* {total_pax}",
      "- *Status:* Confirmed (Deposit Paid)",
      "",
      "*Payment Summary*",
      "- *Total Amount:* IDR {total_amount}",
      "- *Deposit Paid:* IDR {deposit_paid}",
      "- *Outstanding Balance:* IDR {outstanding_balance}",
      "",
      "*Balance Payment Deadline*",
      "- *Card:* {card_due_date} *(no later than 5 days before Day 1)*",
      "- *Bank Transfer / Wise:* {transfer_due_date} *(no later than 3 days before Day 1)*",
      "",
      "*Pay the Balance*",
      "- *Card Payment:* 👉 {invoice_url}",
      "- *Bank Transfer / Wise instructions:* 👉 https://javavolcano-touroperator.com/my-booking/{booking_url}",
      "",
      "*Notes*",
      "- Full payment is required before the trip so we can finalize all operational arrangements.",
      "- Please pay before the deadline to avoid disruptions.",
      "",
      "*Need help?* Reply to this chat or contact:",
      "- WhatsApp: +62 822-4478-8833",
      "- Email: hello@javavolcano-touroperator.com",
      "",
      "*Security:* JVTO will never ask for your OTP/PIN. Please use only official links shared by JVTO.",
      "",
      "— JVTO Team",
    ].join("\n"),
    mediaType: null,
    mediaUrl: null,
    mediaFilename: null,
    variables: [
      { name: "customer_name",      isRequired: true,  description: "Nama customer",                            example: "Budi Santoso" },
      { name: "booking_code",       isRequired: true,  description: "Kode booking",                             example: "JVTO-20250115-001" },
      { name: "package_name",       isRequired: true,  description: "Nama paket tour",                          example: "Bromo Sunrise Private Tour" },
      { name: "travel_date_start",  isRequired: true,  description: "Tanggal mulai (d M Y)",                    example: "15 Jan 2025" },
      { name: "travel_date_end",    isRequired: true,  description: "Tanggal selesai (d M Y)",                  example: "17 Jan 2025" },
      { name: "pickup_location",    isRequired: true,  description: "Lokasi penjemputan",                       example: "Hotel Aria Gajayana Malang" },
      { name: "total_pax",          isRequired: true,  description: "Jumlah peserta",                           example: "4" },
      { name: "total_amount",       isRequired: true,  description: "Total tagihan (sudah diformat)",           example: "5.000.000" },
      { name: "deposit_paid",       isRequired: true,  description: "Deposit yang sudah dibayar (diformat)",    example: "2.000.000" },
      { name: "outstanding_balance",isRequired: true,  description: "Sisa tagihan (diformat)",                  example: "3.000.000" },
      { name: "card_due_date",      isRequired: true,  description: "Deadline bayar via kartu",                 example: "10 Jan 2025" },
      { name: "transfer_due_date",  isRequired: true,  description: "Deadline bayar via transfer",              example: "12 Jan 2025" },
      { name: "invoice_url",        isRequired: true,  description: "URL invoice kartu kredit",                 example: "https://pay.javavolcano-touroperator.com/inv/abc123" },
      { name: "booking_url",        isRequired: true,  description: "URL unik halaman my-booking",              example: "abc123xyz" },
    ],
  },

  // ── 3. Thank You Message ──────────────────────────────────────────────────
  {
    name: "Thank You Message",
    description: "Pesan terima kasih setelah trip selesai, dengan link trip portal",
    content: [
      "Hello {customer_name} 🌟",
      "",
      "*Your Journey with JVTO Concludes!* 🏜",
      "",
      "Thank you so much for choosing *Java Volcano Tour Operator* for your adventure!",
      "We truly hope you had a fun and unforgettable trip in Indonesia.",
      "",
      "📸 Your Trip Memories:",
      "All the fantastic pictures from your trip are ready for you to view and download! Access them directly on your personalized trip dashboard:",
      "🌐 https://javavolcano-touroperator.com/my-booking/{booking_url}",
      "",
      "✍ Share Your Experience:",
      "Your feedback is invaluable to us and incredibly helpful to future travelers. Please take a moment to leave a review on Google or Trustpilot (link also available on portal).",
      "",
      "We hope to welcome you on another adventure soon!",
      "",
      "Many thanks,",
      "The JVTO Team",
    ].join("\n"),
    mediaType: null,
    mediaUrl: null,
    mediaFilename: null,
    variables: [
      { name: "customer_name", isRequired: true, description: "Nama customer",                    example: "Budi Santoso" },
      { name: "booking_url",   isRequired: true, description: "URL unik halaman my-booking",      example: "abc123xyz" },
    ],
  },

  // ── END ──────────────────────────────────────────────────────────────────
];

const templates = [...legacyTemplates, ...jvtoTemplatePack];

// ─── Insert ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nSeeding ${templates.length} templates for user ${USER_ID}...\n`);

  for (const tpl of templates) {
    // Check if template with same name already exists for this user
    const existing = await db.template.findFirst({
      where: { userId: USER_ID, name: tpl.name },
    });

    if (existing) {
      console.log(`  ⚠️  "${tpl.name}" already exists (id: ${existing.id}), skipping.`);
      continue;
    }

    const created = await db.template.create({
      data: {
        name:          tpl.name,
        description:   tpl.description,
        content:       tpl.content,
        mediaType:     tpl.mediaType,
        mediaUrl:      tpl.mediaUrl,
        mediaFilename: tpl.mediaFilename,
        isActive:      true,
        userId:        USER_ID,
        variables: {
          create: tpl.variables.map((v) => ({
            name:        v.name,
            isRequired:  v.isRequired,
            description: v.description,
            example:     v.example,
          })),
        },
      },
    });

    console.log(`  ✅ "${tpl.name}" created  →  id: ${created.id}`);
    for (const v of tpl.variables) {
      console.log(`       {${v.name}}  ${v.isRequired ? "(required)" : "(optional)"}`);
    }
  }

  console.log("\nDone.\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); await pool.end(); });
