import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local", override: true });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  const msgs = await db.messageLog.findMany({
    where: { direction: "IN", content: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, toFrom: true, content: true, createdAt: true },
  });
  if (msgs.length === 0) { console.log("No incoming messages in MessageLog yet."); }
  else {
    msgs.forEach(m => {
      console.log(`[${m.createdAt.toISOString()}] FROM: ${m.toFrom}`);
      console.log(`  "${m.content?.slice(0, 120)}"`);
      console.log();
    });
  }
  await db.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
