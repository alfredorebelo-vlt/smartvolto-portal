import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const { PrismaClient } = await import("../src/generated/prisma/client.ts");
const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const deleted = await prisma.toolData.deleteMany({});
console.log(`✓ ${deleted.count} registo(s) de ToolData eliminados.`);
await prisma.$disconnect();
