import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const JVTO_API = process.env.JVTO_API_URL ?? "https://legacy.javavolcano-touroperator.com/api/web";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.isJvto && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const res = await fetch(`${JVTO_API}/customers/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "JVTO API error" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/jvto/customers/:id]", err);
    return NextResponse.json({ error: "Failed to fetch JVTO customer" }, { status: 500 });
  }
}
