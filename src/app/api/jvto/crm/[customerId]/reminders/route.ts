import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

async function getCrmContact(customerId: string) {
  return db.jvtoCrmContact.findUnique({ where: { jvtoCustomerId: customerId } });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const session = await getSession();
  if (!session || (!session.isJvto && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { customerId } = await params;
  const { description, dueDate } = await req.json();
  if (!description?.trim() || !dueDate) {
    return NextResponse.json({ error: "description and dueDate required" }, { status: 400 });
  }

  let crm = await getCrmContact(customerId);
  if (!crm) {
    crm = await db.jvtoCrmContact.create({ data: { jvtoCustomerId: customerId } });
  }

  const reminder = await db.jvtoCrmReminder.create({
    data: { crmContactId: crm.id, description: description.trim(), dueDate: new Date(dueDate) },
  });
  return NextResponse.json(reminder, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const session = await getSession();
  if (!session || (!session.isJvto && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { customerId } = await params;
  const { reminderId, isCompleted } = await req.json();
  if (!reminderId) return NextResponse.json({ error: "reminderId required" }, { status: 400 });

  const crm = await getCrmContact(customerId);
  if (!crm) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.jvtoCrmReminder.update({
    where: { id: reminderId, crmContactId: crm.id },
    data: { isCompleted },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const session = await getSession();
  if (!session || (!session.isJvto && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { customerId } = await params;
  const reminderId = new URL(req.url).searchParams.get("reminderId");
  if (!reminderId) return NextResponse.json({ error: "reminderId required" }, { status: 400 });

  const crm = await getCrmContact(customerId);
  if (!crm) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.jvtoCrmReminder.delete({ where: { id: reminderId, crmContactId: crm.id } });
  return NextResponse.json({ success: true });
}
