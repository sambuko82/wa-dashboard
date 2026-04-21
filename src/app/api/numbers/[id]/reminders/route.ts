import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

async function getAuthorizedNumber(id: string, userId: string, role: string) {
  const n = await db.waNumber.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!n) return null;
  if (role !== "ADMIN" && n.userId !== userId) return null;
  return n;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!await getAuthorizedNumber(id, session.userId, session.role)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const reminders = await db.waNumberReminder.findMany({
    where: { waNumberId: id },
    orderBy: { dueDate: "asc" },
  });
  return NextResponse.json(reminders);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!await getAuthorizedNumber(id, session.userId, session.role)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { description, dueDate } = await req.json();
  if (!description?.trim() || !dueDate) {
    return NextResponse.json({ error: "description and dueDate required" }, { status: 400 });
  }

  const reminder = await db.waNumberReminder.create({
    data: { waNumberId: id, description: description.trim(), dueDate: new Date(dueDate) },
  });
  return NextResponse.json(reminder, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!await getAuthorizedNumber(id, session.userId, session.role)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { reminderId, isCompleted } = await req.json();
  if (!reminderId) return NextResponse.json({ error: "reminderId required" }, { status: 400 });

  const updated = await db.waNumberReminder.update({
    where: { id: reminderId },
    data: { isCompleted },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!await getAuthorizedNumber(id, session.userId, session.role)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const reminderId = new URL(req.url).searchParams.get("reminderId");
  if (!reminderId) return NextResponse.json({ error: "reminderId required" }, { status: 400 });

  await db.waNumberReminder.delete({ where: { id: reminderId } });
  return NextResponse.json({ success: true });
}
