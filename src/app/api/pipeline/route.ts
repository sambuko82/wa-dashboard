import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slim = new URL(req.url).searchParams.get("slim") === "true";

  if (slim) {
    // Lightweight: only id/name/color — no contacts loaded
    const stages = await db.pipelineStage.findMany({
      where: { userId: session.userId },
      orderBy: { order: "asc" },
      select: { id: true, name: true, color: true },
    });
    return NextResponse.json(stages);
  }

  const stages = await db.pipelineStage.findMany({
    where: { userId: session.userId },
    orderBy: { order: "asc" },
    include: {
      contacts: {
        include: {
          labels: true,
          _count: { select: { messages: true } },
        },
      },
    },
  });

  return NextResponse.json(stages);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, color } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const lastStage = await db.pipelineStage.findFirst({
    where: { userId: session.userId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const stage = await db.pipelineStage.create({
    data: {
      userId: session.userId,
      name: name.trim(),
      color: color ?? "#546dfe",
      order: (lastStage?.order ?? -1) + 1,
    },
  });

  return NextResponse.json(stage, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Stage ID required" }, { status: 400 });

  const stage = await db.pipelineStage.findUnique({ where: { id } });
  if (!stage || stage.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Unassign contacts before deleting
  await db.contact.updateMany({ where: { pipelineStageId: id }, data: { pipelineStageId: null } });
  await db.pipelineStage.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, name, color } = await req.json();
  if (!id) return NextResponse.json({ error: "Stage ID required" }, { status: 400 });

  const stage = await db.pipelineStage.findUnique({ where: { id } });
  if (!stage || stage.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await db.pipelineStage.update({
    where: { id },
    data: { ...(name ? { name } : {}), ...(color ? { color } : {}) },
  });

  return NextResponse.json(updated);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactId, stageId } = await req.json();

  if (!contactId) return NextResponse.json({ error: "Contact ID is required" }, { status: 400 });

  // Ensure contact belongs to user
  const contact = await db.contact.findUnique({
    where: { id: contactId },
    include: { waNumber: { select: { userId: true } } }
  });

  if (!contact || contact.waNumber.userId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await db.contact.update({
    where: { id: contactId },
    data: { pipelineStageId: stageId || null }
  });

  return NextResponse.json(updated);
}
