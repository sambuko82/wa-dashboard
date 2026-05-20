import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local", override: true });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  const expected = ["User", "WaNumber", "MessageLog", "Contact", "PipelineStage",
    "Reminder", "Label", "ContactNote", "Template", "TemplateVariable",
    "JvtoCrmContact", "JvtoCrmNote", "JvtoCrmReminder", "JvtoReplyDraft"];
  const rows = await db.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = ANY(${expected})
  `;
  const found = rows.map(r => r.tablename);
  console.log("Found:", found.join(", ") || "none");
  console.log("Missing:", expected.filter(t => !found.includes(t)).join(", ") || "none");
  await db.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
