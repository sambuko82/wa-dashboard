import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("DATABASE_URL:", process.env.DATABASE_URL?.replace(/:([^@]+)@/, ":***@"));

  // Check connection
  const tables = await db.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('User', 'WaNumber', 'MessageLog', 'JvtoReplyDraft')
    ORDER BY tablename
  `;
  console.log("Prisma tables found:", tables.map(t => t.tablename));

  if (tables.some(t => t.tablename === "User")) {
    const count = await db.user.count();
    console.log("User count:", count);
    const admin = await db.user.findUnique({ where: { email: "admin@admin.com" } });
    console.log("admin@admin.com exists:", !!admin, admin ? `role=${admin.role}` : "");
  } else {
    console.log("❌ User table missing — Prisma migrations not applied to this DB");
  }
}

main()
  .catch(e => { console.error("Error:", e.message); process.exit(1); })
  .finally(() => db.$disconnect());
