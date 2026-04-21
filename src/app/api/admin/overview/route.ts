import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [totalUsers, numbers] = await Promise.all([
    db.user.count(),
    db.waNumber.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Enrich numbers with live status
  const { getWaClient } = await import("@/lib/wa-client");
  const enrichedNumbers = numbers.map((n) => ({
    ...n,
    status: getWaClient(n.id)?.status ?? "disconnected",
  }));

  const connectedCount = enrichedNumbers.filter(
    (n) => n.status === "connected"
  ).length;

  return NextResponse.json({
    stats: {
      totalUsers,
      totalNumbers: numbers.length,
      connectedNumbers: connectedCount,
    },
    numbers: enrichedNumbers,
  });
}
