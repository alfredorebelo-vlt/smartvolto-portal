import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const { PrismaClient } = await import("../src/generated/prisma/client.ts");
const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const tool = await prisma.tool.findUnique({
  where: { slug: "gestao-de-turnos" },
  select: { id: true, name: true, content: true },
});

console.log("name:", tool?.name);
console.log("has VD.onLoad:", tool?.content.includes("VD.onLoad") ?? false);
console.log("has enableAutoSave:", tool?.content.includes("enableAutoSave") ?? false);
console.log("--- últimas 200 chars ---");
console.log(tool?.content.slice(-200));

// check ToolData table
const count = await prisma.toolData.count();
console.log("\nToolData rows:", count);

await prisma.$disconnect();
