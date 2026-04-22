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
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  let crm = await getCrmContact(customerId);
  if (!crm) {
    crm = await db.jvtoCrmContact.create({ data: { jvtoCustomerId: customerId } });
  }

  const note = await db.jvtoCrmNote.create({
    data: { crmContactId: crm.id, content: content.trim() },
  });
  return NextResponse.json(note, { status: 201 });
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
  const noteId = new URL(req.url).searchParams.get("noteId");
  if (!noteId) return NextResponse.json({ error: "noteId required" }, { status: 400 });

  const crm = await getCrmContact(customerId);
  if (!crm) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.jvtoCrmNote.delete({ where: { id: noteId, crmContactId: crm.id } });
  return NextResponse.json({ success: true });
}
