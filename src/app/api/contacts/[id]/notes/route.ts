import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { content } = await req.json();

  if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 });

  const contact = await db.contact.findUnique({
    where: { id },
    include: { waNumber: true }
  });

  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (contact.waNumber.userId !== session.userId && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const note = await db.contactNote.create({
    data: {
      contactId: id,
      content,
    }
  });

  return NextResponse.json(note);
}
