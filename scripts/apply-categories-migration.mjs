import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const { PrismaClient } = await import("../src/generated/prisma/client.ts");
const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

// Cria a tabela AnnouncementCategory se não existir
await prisma.$executeRawUnsafe(`
  CREATE TABLE IF NOT EXISTS \`AnnouncementCategory\` (
    \`id\` VARCHAR(191) NOT NULL,
    \`slug\` VARCHAR(191) NOT NULL,
    \`label\` VARCHAR(191) NOT NULL,
    \`color\` VARCHAR(191) NOT NULL,
    \`bg\` VARCHAR(191) NOT NULL,
    \`order\` INT NOT NULL DEFAULT 0,
    \`isActive\` BOOLEAN NOT NULL DEFAULT true,
    \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`AnnouncementCategory_slug_key\` (\`slug\`)
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
`);
console.log("✓ Tabela AnnouncementCategory criada (ou já existia).");

// Seed com categorias por defeito
const defaults = [
  { id: "cat-milestone", slug: "milestone", label: "Marco",      color: "#7C5A00", bg: "#FEF3D0", order: 0 },
  { id: "cat-launch",    slug: "launch",    label: "Lançamento", color: "#1A56A8", bg: "#E6F1FB", order: 1 },
  { id: "cat-people",    slug: "people",    label: "Pessoas",    color: "#7C3C00", bg: "#FEF0E7", order: 2 },
  { id: "cat-ops",       slug: "ops",       label: "Operações",  color: "#065F46", bg: "#D1FAE5", order: 3 },
  { id: "cat-tech",      slug: "tech",      label: "Tech",       color: "#4B4096", bg: "#EDE9FE", order: 4 },
];

for (const c of defaults) {
  const exists = await prisma.announcementCategory.findUnique({ where: { slug: c.slug } });
  if (!exists) {
    await prisma.announcementCategory.create({ data: c });
    console.log(`✓ Categoria criada: ${c.label}`);
  } else {
    console.log(`  Já existe: ${c.label}`);
  }
}

await prisma.$disconnect();
