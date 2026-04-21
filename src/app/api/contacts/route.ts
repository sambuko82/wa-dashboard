import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const numberId = searchParams.get("numberId");

  const contacts = await db.contact.findMany({
    where: {
      waNumber: {
        userId: session.userId,
        ...(numberId ? { id: numberId } : {}),
      },
    },
    include: {
      labels: true,
      _count: {
        select: { messages: true }
      }
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { waNumberId, phoneNumber, name, email, notes, labelIds } = body;

  if (!waNumberId || !phoneNumber) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Ensure the WA number belongs to the user
  const waNumber = await db.waNumber.findFirst({
    where: { id: waNumberId, userId: session.userId }
  });
  if (!waNumber) return NextResponse.json({ error: "WA Number not found" }, { status: 404 });

  const contact = await db.contact.upsert({
    where: {
      waNumberId_phoneNumber: {
        waNumberId,
        phoneNumber,
      },
    },
    create: {
      waNumberId,
      phoneNumber,
      name,
      email,
      notes,
      labels: labelIds ? {
        connect: labelIds.map((id: string) => ({ id }))
      } : undefined,
    },
    update: {
      name,
      email,
      notes,
      labels: labelIds ? {
        set: labelIds.map((id: string) => ({ id }))
      } : undefined,
    },
  });

  return NextResponse.json(contact);
}
