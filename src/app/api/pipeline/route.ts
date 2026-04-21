import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stages = await db.pipelineStage.findMany({
    where: { userId: session.userId },
    orderBy: { order: "asc" },
    include: {
      contacts: {
        include: {
          labels: true,
          _count: {
            select: { messages: true }
          }
        }
      }
    }
  });

  return NextResponse.json(stages);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactId, stageId } = await req.json();

  if (!contactId) return NextResponse.json({ error: "Contact ID is required" }, { status: 400 });

  // Ensure contact belongs to user
  const contact = await db.contact.findUnique({
    where: { id: contactId },
    include: { waNumber: true }
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
