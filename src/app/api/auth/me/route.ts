import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch fresh apiKey from DB (not stored in JWT)
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { apiKey: true },
  });

  return NextResponse.json({
    id: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
    isJvto: session.isJvto ?? false,
    apiKey: user?.apiKey ?? null,
  });
}
