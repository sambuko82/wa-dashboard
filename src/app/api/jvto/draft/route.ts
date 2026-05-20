/**
 * JVTO Knowledge-to-Reply Engine — Draft API
 * POST /api/jvto/draft
 * Body: { phone: string, message: string, customerId?: string }
 * Returns: draft + risk level + verification + source refs
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/jvto-utils";
import { extractRequest } from "@/lib/jvto-request-extractor";
import { matchContext } from "@/lib/jvto-context-matcher";
import { renderDraft } from "@/lib/jvto-template-renderer";
import { verifyDraft } from "@/lib/jvto-verification-guard";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (!session.isJvto && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { phone?: string; message?: string; customerId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { phone, message, customerId } = body;
  if (!phone || !message) {
    return NextResponse.json({ error: "phone and message are required" }, { status: 400 });
  }

  const normalizedPhone = normalizePhone(phone);

  // Fetch last 10 messages for context
  const chatHistory = await db.messageLog.findMany({
    where: { toFrom: normalizedPhone },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { direction: true, content: true },
  });

  // Extract package slug from CRM notes if customerId provided
  const crmContext: { packageSlug?: string | null } = {};
  if (customerId) {
    try {
      const crm = await db.jvtoCrmContact.findUnique({
        where: { jvtoCustomerId: customerId },
        select: { notes: true },
      });
      if (crm?.notes) {
        const slugM = crm.notes.match(/package[:\s]+([a-z0-9-/]+)/i);
        if (slugM) crmContext.packageSlug = slugM[1];
      }
    } catch {
      // CRM not found — continue without it
    }
  }

  // Pipeline: extract → match → render → verify
  let extracted, matched, rendered, verification;
  try {
    extracted = extractRequest(message, crmContext);
    matched = matchContext(extracted);
    rendered = renderDraft(matched, extracted);
    verification = verifyDraft(rendered.draft, matched, extracted);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Context index error";
    return NextResponse.json(
      { error: msg, hint: "Run: npm run build:context" },
      { status: 503 }
    );
  }

  // Persist draft (best-effort — don't fail the response if DB write fails)
  let draftId: string | null = null;
  try {
    const saved = await db.jvtoReplyDraft.create({
      data: {
        phone: normalizedPhone,
        incomingMessage: message,
        draft: rendered.draft,
        draftType: rendered.draftType,
        templateId: rendered.templateId,
        packageSlug: matched.packageSlug,
        confidence: matched.confidence,
        riskLevel: verification.riskLevel,
        verificationStatus: verification.verificationStatus,
        checks: verification.checks,
        failedRules: verification.failedRules,
        notesForStaff: verification.notesForStaff,
        sourceRefs: [...new Set([...rendered.sourceRefs, ...verification.sourceRefs])],
      },
    });
    draftId = saved.id;
  } catch {
    // DB write failed — still return the draft
  }

  const allSourceRefs = [...new Set([...rendered.sourceRefs, ...verification.sourceRefs])];

  return NextResponse.json({
    id: draftId,
    draft: rendered.draft,
    draftType: rendered.draftType,
    matchedContext: {
      packageSlug: matched.packageSlug,
      packageName: matched.packageName,
      confidence: matched.confidence,
    },
    riskLevel: verification.riskLevel,
    verificationStatus: verification.verificationStatus,
    checks: verification.checks,
    failedRules: verification.failedRules,
    sourceRefs: allSourceRefs,
    notesForStaff: verification.notesForStaff,
  });
}

// Mark sent — called after staff sends the draft
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || (!session.isJvto && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.jvtoReplyDraft.update({
    where: { id },
    data: { sentAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
