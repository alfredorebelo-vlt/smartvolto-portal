import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { readFileSync } from "fs";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const { PrismaClient } = await import("../src/generated/prisma/client.ts");
const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const html = readFileSync("./public/tools/turnos.html", "utf-8");
const result = await prisma.tool.updateMany({
  where: { slug: "gestao-de-turnos" },
  data: { content: html },
});
console.log(`✓ Actualizado ${result.count} registo(s).`);
await prisma.$disconnect();
