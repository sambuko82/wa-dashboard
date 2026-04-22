/**
 * GET /api/jvto/chat?phone=8618683022768&page=1
 * Returns MessageLog entries for a given phone number (both IN and OUT).
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/jvto-utils";

const PAGE_SIZE = 30;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || (!session.isJvto && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const rawPhone = searchParams.get("phone");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  if (!rawPhone) return NextResponse.json({ error: "phone required" }, { status: 400 });

  const phone = normalizePhone(rawPhone);

  const [messages, total] = await Promise.all([
    db.messageLog.findMany({
      where: { toFrom: phone },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        direction: true,
        toFrom: true,
        content: true,
        mediaType: true,
        createdAt: true,
        number: { select: { id: true, label: true, phoneNumber: true } },
      },
    }),
    db.messageLog.count({ where: { toFrom: phone } }),
  ]);

  return NextResponse.json({
    messages,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  });
}
