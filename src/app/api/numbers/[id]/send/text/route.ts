import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOrCreateWaClient, waitForConnected } from "@/lib/wa-client";
import { isJvtoPhone, normalizePhone } from "@/lib/jvto-utils";

export async function POST(
  req: NextRequest,
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

  try {
    const { to, text } = await req.json();
    if (!to || !text) {
      return NextResponse.json(
        { error: "Missing required fields: to, text" },
        { status: 400 }
      );
    }

    const client = await getOrCreateWaClient(id);
    if (client.status !== "connected") {
      const ok = await waitForConnected(client, 15_000);
      if (!ok) return NextResponse.json({ error: "WhatsApp is not connected" }, { status: 400 });
    }
    const result = await client.sendText(to, text);

    if (isJvtoPhone(to)) {
      await db.messageLog.create({
        data: {
          numberId: id,
          direction: "OUT",
          toFrom: normalizePhone(to),
          content: text,
          mediaType: null,
        },
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send" },
      { status: 500 }
    );
  }
}
