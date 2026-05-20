import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local", override: true });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const db = new PrismaClient({ adapter });
  const rows = await db.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;
  console.log("All tables:");
  rows.forEach(r => console.log(" ", r.tablename));
  await db.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
