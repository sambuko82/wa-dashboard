import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const JVTO_API = process.env.JVTO_API_URL ?? "https://legacy.javavolcano-touroperator.com/api/web";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isJvto && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "JVTO";
  const page = searchParams.get("page") ?? "1";

  try {
    const res = await fetch(
      `${JVTO_API}/customers?category=${category}&page=${page}`,
      { next: { revalidate: 60 } } // cache 60s
    );
    if (!res.ok) {
      return NextResponse.json({ error: "JVTO API error" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/jvto/customers]", err);
    return NextResponse.json({ error: "Failed to fetch JVTO customers" }, { status: 500 });
  }
}
