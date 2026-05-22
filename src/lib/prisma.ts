import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDbUrl(): string {
  const url = process.env.DATABASE_URL ?? "";
  // @prisma/adapter-mariadb requires mariadb:// prefix; convert mysql:// if needed
  return url.startsWith("mysql://") ? "mariadb://" + url.slice(8) : url;
}

function createPrismaClient() {
  const adapter = new PrismaMariaDb(getDbUrl());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any);
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
