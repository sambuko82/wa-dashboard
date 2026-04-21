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

  const notes = await db.waNumberNote.findMany({
    where: { waNumberId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(notes);
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

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const note = await db.waNumberNote.create({
    data: { waNumberId: id, content: content.trim() },
  });
  return NextResponse.json(note, { status: 201 });
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

  const noteId = new URL(req.url).searchParams.get("noteId");
  if (!noteId) return NextResponse.json({ error: "noteId required" }, { status: 400 });

  await db.waNumberNote.delete({ where: { id: noteId } });
  return NextResponse.json({ success: true });
}
