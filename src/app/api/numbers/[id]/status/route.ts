import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getWaClient } from "@/lib/wa-client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const number = await db.waNumber.findUnique({ where: { id } });
  if (!number) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role !== "ADMIN" && number.userId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Use in-memory client if it exists; otherwise return disconnected status from DB
  // (avoids creating a new WA socket just to serve a status page load)
  const client = getWaClient(id);
  if (client) {
    return NextResponse.json({ ...client.getStatus(), label: number.label, apiKey: number.apiKey });
  }

  return NextResponse.json({
    status: "disconnected",
    user: null,
    stats: { sent: 0, received: 0, startTime: Date.now() },
    uptime: 0,
    webhookUrl: number.webhookUrl,
    hasQr: false,
    qr: null,
    label: number.label,
    apiKey: number.apiKey,
    phoneNumber: number.phoneNumber,
  });
}
