import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    max: 3,                      // limit connections per Lambda instance
    connectionTimeoutMillis: 8000, // fail fast if can't connect in 8s
    idleTimeoutMillis: 20000,    // release idle connections after 20s
    ssl: false,                  // disable SSL (plain TCP to private server)
  });
  return new PrismaClient({ adapter });
}

export const db: PrismaClient =
  global.__prisma ?? (global.__prisma = createPrismaClient());
