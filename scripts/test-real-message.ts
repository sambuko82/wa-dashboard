/**
 * Simulates a real incoming WA message and runs full draft pipeline.
 * Uses a real customer from the JVTO API and a realistic message body.
 */
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { extractRequest } from "../src/lib/jvto-request-extractor";
import { matchContext } from "../src/lib/jvto-context-matcher";
import { renderDraft } from "../src/lib/jvto-template-renderer";
import { verifyDraft } from "../src/lib/jvto-verification-guard";

// Real-world customer messages (from WhatsApp inquiry patterns)
const testMessages = [
  {
    label: "Booking inquiry — specific destinations + pax",
    phone: "628123456789",
    message: "Hello, I'd like to book Ijen and Bromo tour for 2 people. We're arriving in Surabaya on June 15. How much does it cost for 3 days?",
  },
  {
    label: "Post-booking — packing question",
    phone: "6282244788833",
    message: "Hi, we're flying in next week for the Ijen tour. What clothes should we pack? Is it cold at the crater?",
  },
  {
    label: "Klook customer — gas mask question",
    phone: "6281234567890",
    message: "Hi I booked through Klook for Ijen blue fire tour. Is gas mask included or do I need to bring my own?",
  },
  {
    label: "Indonesian — Tumpak Sewu inquiry",
    phone: "6281298765432",
    message: "Halo, saya mau tanya untuk paket Tumpak Sewu dan Bromo dari Surabaya untuk 4 orang berapa ya? Rencana tanggal 20 Juni.",
  },
  {
    label: "Cancellation policy question",
    phone: "6285678901234",
    message: "Hi, if my flight gets cancelled, can I get a refund for the tour? Or is there a rescheduling option?",
  },
];

console.log("=".repeat(60));
console.log("JVTO Draft Engine — Real Message Simulation");
console.log("=".repeat(60) + "\n");

for (const test of testMessages) {
  console.log(`📨 ${test.label}`);
  console.log(`   Phone: ${test.phone}`);
  console.log(`   Message: "${test.message.slice(0, 80)}${test.message.length > 80 ? "…" : ""}"`);
  console.log();

  const extracted = extractRequest(test.message);
  const matched = matchContext(extracted);
  const rendered = renderDraft(matched, extracted);
  const verification = verifyDraft(rendered.draft, matched, extracted);

  const riskEmoji = { low: "🟢", medium: "🟡", high: "🔴" }[verification.riskLevel];
  const statusEmoji = { passed: "✓", needs_review: "⚠", blocked: "✗" }[verification.verificationStatus];

  console.log(`   Lang: ${extracted.lang} | Destinations: [${extracted.destinations.join(", ")}] | QuestionType: ${extracted.questionType}`);
  console.log(`   Matched: ${matched.packageSlug ?? "none"} (${Math.round(matched.confidence * 100)}%) → ${rendered.draftType}`);
  console.log(`   Risk: ${riskEmoji} ${verification.riskLevel} | Status: ${statusEmoji} ${verification.verificationStatus}`);
  if (verification.failedRules.length) console.log(`   Failed: ${verification.failedRules.join(", ")}`);
  if (verification.notesForStaff.length) console.log(`   Note: ${verification.notesForStaff[0]}`);
  console.log();
  console.log("   DRAFT:");
  console.log("   " + rendered.draft.replace(/\n/g, "\n   "));
  console.log();
  console.log("   Sources: " + rendered.sourceRefs.slice(0, 2).join(", "));
  console.log("-".repeat(60) + "\n");
}
