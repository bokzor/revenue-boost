import { PrismaClient, Prisma } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient;
}

// In TEST_MODE, use STAGING_DATABASE_URL if available (set by dev-test-local.sh)
// This ensures we connect to the staging database even when Vite loads .env
const databaseUrl = process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL;

if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient({
      datasourceUrl: databaseUrl,
    });
  }
}

const prisma = global.prismaGlobal ?? new PrismaClient({
  datasourceUrl: databaseUrl,
});

export { Prisma };
export default prisma;
