import { db as prisma } from "../src/lib/db";

async function main() {
  const users = await prisma.user.findMany();
  
  const defaultStages = [
    { name: "Lead Baru", color: "#3b82f6", order: 1 },
    { name: "Pendekatan", color: "#f59e0b", order: 2 },
    { name: "Negosiasi", color: "#8b5cf6", order: 3 },
    { name: "Closing (Won)", color: "#10b981", order: 4 },
    { name: "Gagal (Lost)", color: "#ef4444", order: 5 },
  ];

  for (const user of users) {
    const existing = await prisma.pipelineStage.findFirst({ where: { userId: user.id } });
    if (!existing) {
      console.log(`Seeding stages for user: ${user.email}`);
      for (const stage of defaultStages) {
        await prisma.pipelineStage.create({
          data: {
            ...stage,
            userId: user.id,
          }
        });
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
