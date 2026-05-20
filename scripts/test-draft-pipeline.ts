/**
 * Tests the draft pipeline end-to-end (no HTTP, no auth required).
 * Run: npx tsx scripts/test-draft-pipeline.ts
 */
import "dotenv/config";
import { config } from "dotenv";

config({ path: ".env.local", override: true });

import { extractRequest } from "../src/lib/jvto-request-extractor";
import { matchContext } from "../src/lib/jvto-context-matcher";
import { renderDraft } from "../src/lib/jvto-template-renderer";
import { verifyDraft } from "../src/lib/jvto-verification-guard";

interface TestCase {
  label: string;
  message: string;
  expectedVerificationStatus?: string;
  expectedRiskLevel?: string;
  expectedDraftType?: string;
  expectedFailedRules?: string[];
}

const cases: TestCase[] = [
  {
    label: "Normal inquiry — Bromo Ijen 3D SUB 2pax",
    message: "Hi, we want to visit Bromo and Ijen for 3 days from Surabaya, 2 people.",
    expectedVerificationStatus: "passed",
    expectedRiskLevel: "low",
  },
  {
    label: "Indonesian inquiry — Bromo Ijen 3 hari",
    message: "Halo, saya mau ke Bromo dan Ijen 3 hari dari Surabaya untuk 2 orang.",
    expectedDraftType: "package_match",
  },
  {
    label: "BLOCKED — discount request",
    message: "minta diskon 20% untuk paket Bromo Ijen",
    expectedVerificationStatus: "blocked",
    expectedRiskLevel: "high",
    expectedFailedRules: ["no_discount_promise"],
  },
  {
    label: "BLOCKED — transport only",
    message: "jemput saja tanpa hotel, hanya driver saja",
    expectedVerificationStatus: "blocked",
    expectedRiskLevel: "high",
    expectedFailedRules: ["no_transport_only"],
  },
  {
    label: "Unknown route — clarification",
    message: "I want to visit a mountain very far from all your packages",
    expectedDraftType: "clarification_needed",
  },
  {
    label: "Policy — refund question",
    message: "If I cancel, can I get a refund?",
    expectedDraftType: "refund_adjustment_guard",
  },
  {
    label: "Safety — packing question",
    message: "What should I bring and wear to Ijen?",
    expectedDraftType: "safety_information",
    // needs_review is correct — PB-1 has [fill: name] unfilled → staff note
  },
];

let passed = 0;
let failed = 0;

for (const tc of cases) {
  const extracted = extractRequest(tc.message);
  const matched = matchContext(extracted);
  const rendered = renderDraft(matched, extracted);
  const verification = verifyDraft(rendered.draft, matched, extracted);

  const checks = [
    tc.expectedVerificationStatus
      ? verification.verificationStatus === tc.expectedVerificationStatus
      : true,
    tc.expectedRiskLevel
      ? verification.riskLevel === tc.expectedRiskLevel
      : true,
    tc.expectedDraftType
      ? rendered.draftType === tc.expectedDraftType
      : true,
    tc.expectedFailedRules
      ? tc.expectedFailedRules.every(r => verification.failedRules.includes(r))
      : true,
  ];

  const ok = checks.every(Boolean);
  if (ok) {
    passed++;
    console.log(`✓ ${tc.label}`);
    console.log(`  draftType=${rendered.draftType} risk=${verification.riskLevel} status=${verification.verificationStatus} lang=${extracted.lang}`);
    console.log(`  draft: ${rendered.draft.slice(0, 80).replace(/\n/g, " ")}…`);
  } else {
    failed++;
    console.log(`✗ ${tc.label}`);
    console.log(`  draftType=${rendered.draftType} risk=${verification.riskLevel} status=${verification.verificationStatus} lang=${extracted.lang}`);
    console.log(`  failedRules=${JSON.stringify(verification.failedRules)}`);
    console.log(`  draft: ${rendered.draft.slice(0, 80).replace(/\n/g, " ")}…`);
    if (tc.expectedVerificationStatus) console.log(`  expected status: ${tc.expectedVerificationStatus}, got: ${verification.verificationStatus}`);
    if (tc.expectedRiskLevel)          console.log(`  expected risk: ${tc.expectedRiskLevel}, got: ${verification.riskLevel}`);
    if (tc.expectedDraftType)          console.log(`  expected draftType: ${tc.expectedDraftType}, got: ${rendered.draftType}`);
    if (tc.expectedFailedRules)        console.log(`  expected failedRules to include: ${tc.expectedFailedRules}`);
  }
  console.log();
}

console.log(`─────────────────────────────────`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
