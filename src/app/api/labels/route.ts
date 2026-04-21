import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const labels = await db.label.findMany({
    where: { userId: session.userId },
    include: {
      _count: {
        select: { contacts: true }
      }
    },
    orderBy: { name: "asc" }
  });

  return NextResponse.json(labels);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, color } = await req.json();

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const label = await db.label.create({
    data: {
      name,
      color: color || "#546dfe",
      userId: session.userId,
    }
  });

  return NextResponse.json(label);
}
