import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const contact = await db.contact.findUnique({
    where: { id },
    include: {
      labels: true,
      adminNotes: { orderBy: { createdAt: "desc" } },
      reminders: { orderBy: { dueDate: "asc" } },
      waNumber: { select: { userId: true, label: true, phoneNumber: true } },
    },
  });

  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (contact.waNumber.userId !== session.userId && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(contact);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const contact = await db.contact.findUnique({
    where: { id },
    include: { waNumber: { select: { userId: true } } }
  });

  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (contact.waNumber.userId !== session.userId && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.contact.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, email, notes, labelIds } = body;

  const contact = await db.contact.findUnique({
    where: { id },
    include: { waNumber: { select: { userId: true } } }
  });

  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (contact.waNumber.userId !== session.userId && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await db.contact.update({
    where: { id },
    data: {
      name,
      email,
      notes,
      labels: labelIds ? {
        set: labelIds.map((lid: string) => ({ id: lid }))
      } : undefined,
    },
    include: { 
      labels: true,
      reminders: {
        orderBy: { dueDate: "asc" }
      }
    }
  });

  return NextResponse.json(updated);
}
