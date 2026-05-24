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
  const socketPath = process.env.MARIADB_SOCKET_PATH;

  let adapter: InstanceType<typeof PrismaMariaDb>;

  if (socketPath) {
    // cPanel shared hosting: MariaDB only accepts Unix socket connections.
    // Parse DATABASE_URL to extract credentials and connect via socket instead of TCP.
    const url = getDbUrl();
    const match = url.match(/mariadb:\/\/([^:]+):([^@]+)@[^/]+\/([^?]+)/);
    if (match) {
      const [, user, password, database] = match;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      adapter = new PrismaMariaDb({ socketPath, user, password, database } as any);
    } else {
      adapter = new PrismaMariaDb(url);
    }
  } else {
    adapter = new PrismaMariaDb(getDbUrl());
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any);
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
