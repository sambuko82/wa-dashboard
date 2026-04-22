/**
 * JVTO CRM local data — per customer.
 * Stores pipeline, labels, notes, reminders linked by jvtoCustomerId.
 * GET  /api/jvto/crm/:customerId
 * PATCH /api/jvto/crm/:customerId   { pipelineStageId?, labelIds?, notes? }
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireJvto(session: { isJvto: boolean; role: string } | null) {
  if (!session) return false;
  return session.isJvto || session.role === "ADMIN";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const session = await getSession();
  if (!await requireJvto(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { customerId } = await params;

  let crm = await db.jvtoCrmContact.findUnique({
    where: { jvtoCustomerId: customerId },
    include: {
      labels: true,
      adminNotes: { orderBy: { createdAt: "desc" } },
      reminders: { orderBy: { dueDate: "asc" } },
      pipelineStage: { select: { id: true, name: true, color: true } },
    },
  });

  if (!crm) {
    // Auto-create on first access
    crm = await db.jvtoCrmContact.create({
      data: { jvtoCustomerId: customerId },
      include: {
        labels: true,
        adminNotes: { orderBy: { createdAt: "desc" } },
        reminders: { orderBy: { dueDate: "asc" } },
        pipelineStage: { select: { id: true, name: true, color: true } },
      },
    });
  }

  return NextResponse.json(crm);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const session = await getSession();
  if (!await requireJvto(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { customerId } = await params;
  const { pipelineStageId, labelIds, notes } = await req.json();

  const updated = await db.jvtoCrmContact.upsert({
    where: { jvtoCustomerId: customerId },
    create: {
      jvtoCustomerId: customerId,
      ...(notes !== undefined ? { notes } : {}),
      ...(pipelineStageId !== undefined ? { pipelineStageId: pipelineStageId || null } : {}),
      ...(labelIds ? { labels: { connect: labelIds.map((id: string) => ({ id })) } } : {}),
    },
    update: {
      ...(notes !== undefined ? { notes } : {}),
      ...(pipelineStageId !== undefined ? { pipelineStageId: pipelineStageId || null } : {}),
      ...(labelIds ? { labels: { set: labelIds.map((id: string) => ({ id })) } } : {}),
    },
    include: {
      labels: true,
      pipelineStage: { select: { id: true, name: true, color: true } },
    },
  });

  return NextResponse.json(updated);
}
