import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const { PrismaClient } = await import("../src/generated/prisma/client.ts");
const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const existing = await prisma.dashboardWidget.count();
if (existing > 0) {
  console.log(`Já existem ${existing} widgets — skipping.`);
  await prisma.$disconnect();
  process.exit(0);
}

const widgets = [
  // Coluna principal (col=1)
  {
    type: "announcements",
    title: "Anúncios da empresa",
    config: { limit: 4 },
    col: 1, order: 0, isActive: true, roleIds: [], cacheTtl: 120,
  },
  {
    type: "kpi_n8n",
    title: "KPIs operacionais",
    config: {
      webhookUrl: "",
      metrics: [
        { key: "reservas",      label: "Reservas",       format: "number" },
        { key: "receita",       label: "Receita",        format: "currency", prefix: "€" },
        { key: "frota_ativa",   label: "Frota activa",   format: "number" },
        { key: "taxa_ocupacao", label: "Ocupação",       format: "percent", suffix: "%" },
      ],
    },
    col: 1, order: 1, isActive: false, roleIds: [], cacheTtl: 300,
  },
  // Coluna lateral (col=2)
  {
    type: "quick_links",
    title: "Ações rápidas",
    config: {
      links: [
        { label: "Pipedrive",   url: "https://app.pipedrive.com",      icon: "external-link", color: "#1a1a2e" },
        { label: "Sesame",      url: "https://app.sesamehr.com",       icon: "external-link", color: "#6c63ff" },
        { label: "Drive",       url: "https://drive.google.com",       icon: "external-link", color: "#0f9d58" },
        { label: "Calendário",  url: "https://calendar.google.com",    icon: "external-link", color: "#4285f4" },
        { label: "Gmail",       url: "https://mail.google.com",        icon: "external-link", color: "#ea4335" },
        { label: "n8n",         url: "https://n8n.io",                 icon: "external-link", color: "#ff6d5a" },
      ],
    },
    col: 2, order: 0, isActive: true, roleIds: [], cacheTtl: 3600,
  },
  {
    type: "birthdays",
    title: "Aniversários",
    config: { daysAhead: 30 },
    col: 2, order: 1, isActive: true, roleIds: [], cacheTtl: 3600,
  },
  {
    type: "calendar_events",
    title: "Próximos eventos",
    config: { calendarIds: [], daysAhead: 7, maxEvents: 5 },
    col: 2, order: 2, isActive: false, roleIds: [], cacheTtl: 300,
  },
];

for (const w of widgets) {
  await prisma.dashboardWidget.create({ data: w });
  console.log(`✓ ${w.title} (${w.type}) — ${w.isActive ? "activo" : "inactivo"}`);
}

console.log(`\n${widgets.length} widgets criados.`);
await prisma.$disconnect();
