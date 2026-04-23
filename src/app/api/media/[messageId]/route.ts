import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

function getMediaDir(): string {
  if (process.env.VERCEL) return "/tmp/wa-media";
  return path.join(process.cwd(), "public", "wa-media");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messageId } = await params;

  const log = await db.messageLog.findUnique({ where: { id: messageId } });
  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Ensure caller owns the WA number (or is admin)
  const number = await db.waNumber.findUnique({ where: { id: log.numberId } });
  if (!number) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.role !== "ADMIN" && number.userId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mediaData = log.mediaData as Record<string, unknown> | null;
  const localFile = mediaData?.localFile as string | undefined;
  if (!localFile) {
    return NextResponse.json({ error: "Media not available" }, { status: 404 });
  }

  const filePath = path.join(getMediaDir(), localFile);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }

  const buf = fs.readFileSync(filePath);
  const mimetype = (mediaData?.mimetype as string) ?? "application/octet-stream";

  return new NextResponse(buf, {
    headers: {
      "Content-Type": mimetype,
      "Content-Length": buf.length.toString(),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
