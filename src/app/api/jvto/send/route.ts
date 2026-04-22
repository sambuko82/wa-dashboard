/**
 * POST /api/jvto/send
 * { numberId, phone, message }
 * Sends a WhatsApp message from a specific WA number to a JVTO customer.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOrCreateWaClient, waitForConnected } from "@/lib/wa-client";
import { isJvtoPhone, normalizePhone } from "@/lib/jvto-utils";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (!session.isJvto && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { numberId, phone, message } = await req.json();

  if (!numberId || !phone || !message?.trim()) {
    return NextResponse.json({ error: "numberId, phone, and message required" }, { status: 400 });
  }

  if (!isJvtoPhone(phone)) {
    return NextResponse.json({ error: "Not a JVTO customer phone" }, { status: 400 });
  }

  const number = await db.waNumber.findUnique({
    where: { id: numberId },
    select: { id: true, userId: true, phoneNumber: true, label: true },
  });
  if (!number) return NextResponse.json({ error: "WA number not found" }, { status: 404 });

  try {
    const client = await getOrCreateWaClient(numberId);
    if (client.status !== "connected") {
      const ok = await waitForConnected(client, 10_000);
      if (!ok) return NextResponse.json({ error: "WhatsApp is not connected" }, { status: 400 });
    }

    await client.sendText(phone, message.trim());

    // Save to MessageLog
    await db.messageLog.create({
      data: {
        numberId,
        direction: "OUT",
        toFrom: normalizePhone(phone),
        content: message.trim(),
        mediaType: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/jvto/send]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send" },
      { status: 500 }
    );
  }
}
