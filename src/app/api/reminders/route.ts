import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reminders = await db.reminder.findMany({
    where: {
      contact: {
        waNumber: { userId: session.userId }
      },
      isCompleted: false,
    },
    include: {
      contact: true
    },
    orderBy: { dueDate: "asc" }
  });

  return NextResponse.json(reminders);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactId, description, dueDate } = await req.json();

  if (!contactId || !description || !dueDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Ensure contact belongs to user
  const contact = await db.contact.findUnique({
    where: { id: contactId },
    include: { waNumber: true }
  });

  if (!contact || contact.waNumber.userId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reminder = await db.reminder.create({
    data: {
      contactId,
      description,
      dueDate: new Date(dueDate),
    }
  });

  return NextResponse.json(reminder);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, isCompleted } = await req.json();

  const reminder = await db.reminder.findUnique({
    where: { id },
    include: { contact: { include: { waNumber: true } } }
  });

  if (!reminder || reminder.contact.waNumber.userId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await db.reminder.update({
    where: { id },
    data: { isCompleted }
  });

  return NextResponse.json(updated);
}
