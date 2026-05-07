// Tipos partilhados entre server e client para o sistema de dashboard dinâmico

export type WidgetType =
  | "announcements"
  | "birthdays"
  | "calendar_events"
  | "tasks"
  | "quick_links"
  | "kpi_n8n"
  | "drive_recent"
  | "iframe_embed";

// Config por tipo — o que o admin guarda no campo `config` (JSON)
export type AnnouncementsConfig = { limit: number };
export type BirthdaysConfig = { daysAhead: number };
export type CalendarEventsConfig = { calendarIds: string[]; daysAhead: number; maxEvents: number };
export type QuickLinksConfig = { links: { label: string; url: string; icon: string; color?: string }[] };
export type KpiN8nConfig = {
  webhookUrl: string;
  // Optional: multiple KPIs from same webhook
  metrics: {
    key: string;       // JSON path in response, e.g. "kpis.reservas"
    label: string;
    format: "number" | "currency" | "percent";
    prefix?: string;   // e.g. "€"
    suffix?: string;   // e.g. "%"
    trendKey?: string; // JSON path for trend value
  }[];
};
export type DriveRecentConfig = { folderId?: string; limit: number };
export type IframeEmbedConfig = { url: string; height: number };

export type TasksConfig = { showCompleted: boolean; maxTasks: number };

export type WidgetConfig =
  | AnnouncementsConfig
  | BirthdaysConfig
  | CalendarEventsConfig
  | TasksConfig
  | QuickLinksConfig
  | KpiN8nConfig
  | DriveRecentConfig
  | IframeEmbedConfig;

// Shape que o cliente recebe (sem dados — apenas metadados do widget)
export type WidgetMeta = {
  id: string;
  type: WidgetType;
  title: string;
  config: WidgetConfig;
  col: number;
  order: number;
  cacheTtl: number;
};

// Shape que /api/dashboard/widgets/[id]/data devolve
export type WidgetDataResult =
  | { ok: true; data: unknown; cachedAt: string }
  | { ok: false; error: string };
