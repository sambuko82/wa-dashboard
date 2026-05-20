import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local", override: true });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  const cols = await db.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'MessageLog' ORDER BY ordinal_position
  `;
  console.log("MessageLog cols:", cols.map(c => c.column_name).join(", "));

  const userCount = await db.user.count();
  console.log("User count:", userCount);

  await db.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
