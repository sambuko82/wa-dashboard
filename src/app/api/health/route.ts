import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const t0 = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      dbMs: Date.now() - t0,
      region: process.env.VERCEL_REGION ?? process.env.AWS_REGION ?? "unknown",
      node: process.version,
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      dbMs: Date.now() - t0,
      error: e instanceof Error ? e.message : String(e),
    }, { status: 500 });
  }
}
