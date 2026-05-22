import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { readFileSync } from "fs";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const { PrismaClient } = await import("../src/generated/prisma/client.ts");
const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const existing = await prisma.tool.findUnique({ where: { slug: "gestao-de-turnos" } });
if (existing) {
  console.log("Ferramenta já existe:", existing.name);
} else {
  const html = readFileSync("./public/tools/turnos.html", "utf-8");
  const tool = await prisma.tool.create({
    data: {
      slug: "gestao-de-turnos",
      name: "Gestão de Turnos",
      description: "Escalas, colaboradores e alertas laborais por base",
      content: html,
      isActive: true,
      order: 0,
      roleIds: [],
    },
  });
  console.log("✓ Ferramenta criada:", tool.name);
}

await prisma.$disconnect();
