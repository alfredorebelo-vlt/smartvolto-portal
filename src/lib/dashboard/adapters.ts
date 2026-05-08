// Adaptadores server-side por tipo de widget
// Cada adaptador recebe a config e devolve dados normalizados

import { prisma } from "@/lib/prisma";
import type {
  AnnouncementsConfig, BirthdaysConfig, KpiN8nConfig,
  QuickLinksConfig, WidgetConfig, WidgetType,
} from "./types";

export type AdapterResult = { ok: true; data: unknown } | { ok: false; error: string };

export async function fetchWidgetData(
  type: WidgetType,
  config: WidgetConfig,
): Promise<AdapterResult> {
  try {
    switch (type) {
      case "announcements": return fetchAnnouncements(config as AnnouncementsConfig);
      case "birthdays":     return fetchBirthdays(config as BirthdaysConfig);
      case "kpi_n8n":       return fetchKpiN8n(config as KpiN8nConfig);
      case "quick_links":   return { ok: true, data: (config as QuickLinksConfig).links };
      case "calendar_events":
      case "tasks":
        return { ok: true, data: { useClientFetch: true } };
      case "drive_recent": return { ok: true, data: { useClientFetch: true } };
      case "iframe_embed": return { ok: true, data: null };
      default:
        return { ok: false, error: `Tipo desconhecido: ${type}` };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro interno" };
  }
}

/* ---- announcements ---- */
async function fetchAnnouncements(config: AnnouncementsConfig): Promise<AdapterResult> {
  const items = await prisma.announcement.findMany({
    orderBy: { publishedAt: "desc" },
    take: config.limit ?? 5,
    include: {
      author: {
        select: { id: true, name: true, givenName: true, familyName: true, image: true, jobTitle: true },
      },
    },
  });
  return { ok: true, data: items };
}

/* ---- birthdays ---- */
async function fetchBirthdays(config: BirthdaysConfig): Promise<AdapterResult> {
  const limit = config.limit ?? 3;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const users = await prisma.user.findMany({
    where: { status: "ACTIVE", dateOfBirth: { not: null } },
    select: {
      id: true, name: true, givenName: true, familyName: true, image: true,
      jobTitle: true, dateOfBirth: true,
    },
  });

  const upcoming = users
    .map((u) => {
      const bday = new Date(u.dateOfBirth!);
      const thisYear = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
      const target = thisYear >= todayStart ? thisYear : new Date(now.getFullYear() + 1, bday.getMonth(), bday.getDate());
      const diffDays = Math.round((target.getTime() - todayStart.getTime()) / 86400000);
      return {
        id: u.id,
        name: u.givenName && u.familyName ? `${u.givenName} ${u.familyName}` : (u.name ?? ""),
        image: u.image,
        jobTitle: u.jobTitle,
        date: target.toISOString().split("T")[0],
        daysUntil: diffDays,
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, limit);

  return { ok: true, data: upcoming };
}

/* ---- kpi_n8n ---- */
async function fetchKpiN8n(config: KpiN8nConfig): Promise<AdapterResult> {
  if (!config.webhookUrl) return { ok: false, error: "webhookUrl não configurado" };

  const res = await fetch(config.webhookUrl, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return { ok: false, error: `Webhook devolveu ${res.status}` };

  const raw = await res.json();

  // Extract each metric via dot-notation path
  const metrics = (config.metrics ?? []).map((m) => {
    const value = getNestedValue(raw, m.key);
    const trend = m.trendKey ? getNestedValue(raw, m.trendKey) : undefined;
    return { ...m, value, trend };
  });

  return { ok: true, data: { raw, metrics } };
}

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}
