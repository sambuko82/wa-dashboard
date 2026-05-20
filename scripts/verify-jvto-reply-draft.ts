import "dotenv/config";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: ".env.local", override: true });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const rows = await db.$queryRaw<Array<{ column_name: string; data_type: string }>>`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'JvtoReplyDraft'
    ORDER BY ordinal_position
  `;

  if (rows.length === 0) {
    console.error("❌ JvtoReplyDraft table not found.");
    process.exit(1);
  }

  console.log(`✅ JvtoReplyDraft exists — ${rows.length} columns:`);
  for (const r of rows) {
    console.log(`   ${r.column_name} (${r.data_type})`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
