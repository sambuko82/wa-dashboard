import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getWaClient, removeWaClient } from "@/lib/wa-client";
import fs from "fs";
import path from "path";

function getAuthPath(authDirRelative: string): string {
  if (process.env.VERCEL) {
    return path.join("/tmp", authDirRelative);
  }
  return path.join(process.cwd(), authDirRelative);
}

async function getAuthorizedNumber(numberId: string, userId: string, role: string) {
  const number = await db.waNumber.findUnique({ where: { id: numberId } });
  if (!number) return null;
  if (role !== "ADMIN" && number.userId !== userId) return null;
  return number;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const number = await getAuthorizedNumber(id, session.userId, session.role);
  if (!number) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const client = getWaClient(id);
  return NextResponse.json({ ...number, status: client?.status ?? "disconnected" });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const number = await getAuthorizedNumber(id, session.userId, session.role);
  if (!number) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { label, phoneNumber, description } = await req.json();

  const updated = await db.waNumber.update({
    where: { id },
    data: {
      ...(label?.trim() ? { label: label.trim() } : {}),
      ...(phoneNumber !== undefined ? { phoneNumber: phoneNumber || null } : {}),
      ...(description !== undefined ? { description: description || null } : {}),
    },
    select: { id: true, label: true, phoneNumber: true, description: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const number = await getAuthorizedNumber(id, session.userId, session.role);
    if (!number) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Disconnect and clean up client
    const client = getWaClient(id);
    if (client) {
      await client.disconnect().catch(() => {});
      removeWaClient(id);
    }

    // Remove auth directory
    const authPath = getAuthPath(number.authDir);
    if (fs.existsSync(authPath)) {
      fs.rmSync(authPath, { recursive: true, force: true });
    }

    await db.waNumber.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/numbers/:id]", err);
    return NextResponse.json({ error: "Gagal menghapus, coba lagi" }, { status: 503 });
  }
}
