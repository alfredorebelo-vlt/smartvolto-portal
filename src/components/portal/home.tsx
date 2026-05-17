"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowUp, ArrowDown, Minus, ExternalLink, CalendarDays, Cake, Megaphone, Link2, AlertCircle, Loader2, HardDrive, Calendar, Mail, CheckSquare, Clock, MapPin, Circle, CircleCheck, Hash } from "lucide-react";
import { getInitials, getAvatarColor } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import type { WidgetMeta } from "@/lib/dashboard/types";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 19) return "Boa tarde";
  return "Boa noite";
}

type DriveIndicator = { usedGb: number; totalGb: number | null; percent: number | null };
type CalEvent = { id: string | null | undefined; summary: string | null | undefined; start: string | null | undefined; htmlLink: string | null | undefined; isAllDay: boolean };
type CalIndicator = { events: CalEvent[]; count: number };
type GmailIndicator = { unread: number };
type TasksIndicator = { overdue: number };
type Indicators = { drive?: DriveIndicator | null; calendar?: CalIndicator | null; gmail?: GmailIndicator | null; tasks?: TasksIndicator | null; needsReauth?: boolean };

export function Home() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firstName = (session?.user as any)?.givenName ?? session?.user?.name?.split(" ")[0] ?? "";

  const [widgets, setWidgets] = useState<WidgetMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [indicators, setIndicators] = useState<Indicators | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/widgets")
      .then((r) => r.json())
      .then((d) => { setWidgets(d.widgets ?? []); setLoading(false); })
      .catch(() => setLoading(false));

    fetch("/api/home/indicators")
      .then((r) => r.json())
      .then((d) => setIndicators(d))
      .catch(() => null);
  }, []);

  const col1 = widgets.filter((w) => w.col === 1);
  const col2 = widgets.filter((w) => w.col === 2);
  const hasWidgets = col1.length > 0 || col2.length > 0;

  return (
    <div className="flex min-h-full flex-col gap-4 bg-[var(--muted)] p-4 sm:gap-6 sm:p-6 lg:p-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
        <div
          className="pointer-events-none absolute -right-16 -top-16 size-[160px] rounded-full sm:size-[220px]"
          style={{ background: "linear-gradient(135deg, rgba(255,196,41,0.2), rgba(242,146,32,0.33))", filter: "blur(8px)" }}
        />
        <div className="relative">
          <div className="vd-eyebrow mb-2">
            {new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <h2
            className="m-0 text-2xl font-bold text-[var(--vd-blue-500)] dark:text-[var(--foreground)] sm:text-3xl lg:text-4xl"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em", lineHeight: 1.05 }}
          >
            {getGreeting()}{firstName ? `, ${firstName}` : ""}
            <span className="text-[var(--vd-orange-500)]">.</span>
          </h2>

          {/* Indicadores Google Workspace */}
          {indicators && !indicators.needsReauth && (
            <div className="mt-4 flex flex-wrap gap-2">
              {/* Drive */}
              {indicators.drive && (
                <a
                  href="https://drive.google.com/drive/quota"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors hover:bg-[var(--muted)]",
                    indicators.drive.percent !== null && indicators.drive.percent > 80
                      ? "border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                      : "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]"
                  )}
                >
                  <HardDrive className="size-3.5 shrink-0" />
                  <span>
                    Drive:{" "}
                    <strong style={{ fontFamily: "var(--font-mono)" }}>
                      {indicators.drive.usedGb} GB
                      {indicators.drive.totalGb ? ` / ${indicators.drive.totalGb} GB` : ""}
                      {indicators.drive.percent !== null ? ` (${indicators.drive.percent}%)` : ""}
                    </strong>
                  </span>
                </a>
              )}

              {/* Calendar */}
              {indicators.calendar && (
                indicators.calendar.count === 0 ? (
                  <span className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-xs font-medium text-[var(--muted-foreground)]">
                    <Calendar className="size-3.5 shrink-0" />
                    Sem eventos hoje
                  </span>
                ) : (
                  <a
                    href="https://calendar.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
                  >
                    <Calendar className="size-3.5 shrink-0" />
                    <span>
                      <strong style={{ fontFamily: "var(--font-mono)" }}>{indicators.calendar.count}</strong> evento{indicators.calendar.count !== 1 ? "s" : ""} hoje
                      {indicators.calendar.events[0]?.summary ? ` — ${indicators.calendar.events[0].summary}` : ""}
                    </span>
                    <ExternalLink className="size-3 shrink-0 opacity-60" />
                  </a>
                )
              )}

              {/* Gmail */}
              {indicators.gmail && (
                indicators.gmail.unread === 0 ? (
                  <span className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-xs font-medium text-[var(--muted-foreground)]">
                    <Mail className="size-3.5 shrink-0" />
                    Sem emails por ler
                  </span>
                ) : (
                  <a
                    href="https://mail.google.com/mail/u/0/#inbox"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                  >
                    <Mail className="size-3.5 shrink-0" />
                    <span>
                      <strong style={{ fontFamily: "var(--font-mono)" }}>{indicators.gmail.unread}</strong> email{indicators.gmail.unread !== 1 ? "s" : ""} por ler
                    </span>
                    <ExternalLink className="size-3 shrink-0 opacity-60" />
                  </a>
                )
              )}

              {/* Tasks */}
              {indicators.tasks && indicators.tasks.overdue > 0 && (
                <a
                  href="https://tasks.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400"
                >
                  <CheckSquare className="size-3.5 shrink-0" />
                  <span>
                    <strong style={{ fontFamily: "var(--font-mono)" }}>{indicators.tasks.overdue}</strong> tarefa{indicators.tasks.overdue !== 1 ? "s" : ""} em atraso
                  </span>
                  <ExternalLink className="size-3 shrink-0 opacity-60" />
                </a>
              )}

              {/* Reauth hint — apenas quando tem scope mas faltam dados */}
              {!indicators.drive && !indicators.calendar && !indicators.gmail && !indicators.tasks && (
                <a
                  href="/api/auth/reauthorize?callbackUrl=/"
                  className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Renovar sessão para ver indicadores
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Widgets */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => <WidgetSkeleton key={i} />)}
          </div>
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => <WidgetSkeleton key={i} />)}
          </div>
        </div>
      ) : !hasWidgets ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center text-sm text-[var(--muted-foreground)]">
          Nenhum widget configurado. Vai a <strong>Administração → Dashboard</strong> para adicionar.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-4">
            {col1.map((w) => <WidgetRenderer key={w.id} widget={w} />)}
          </div>
          <div className="flex flex-col gap-4">
            {col2.map((w) => <WidgetRenderer key={w.id} widget={w} />)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Widget Renderer — carrega dados e despacha para o componente certo ---- */

function WidgetRenderer({ widget }: { widget: WidgetMeta }) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // quick_links não precisa de chamada ao servidor
    if (widget.type === "quick_links") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setData((widget.config as any).links ?? []);
      setState("ok");
      return;
    }
    fetch(`/api/dashboard/widgets/${widget.id}/data`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) { setData(d.data); setState("ok"); }
        else { setError(d.error ?? "Erro"); setState("error"); }
      })
      .catch(() => { setError("Erro de rede"); setState("error"); });
  }, [widget.id, widget.type, widget.config]);

  if (state === "loading") return <WidgetSkeleton title={widget.title} />;
  if (state === "error") return <WidgetError title={widget.title} error={error} />;

  switch (widget.type) {
    case "announcements":   return <AnnouncementsWidget title={widget.title} data={data} />;
    case "birthdays":       return <BirthdaysWidget title={widget.title} data={data} />;
    case "kpi_n8n":         return <KpiWidget title={widget.title} data={data} />;
    case "quick_links":     return <QuickLinksWidget title={widget.title} data={data} />;
    case "calendar_events": return <CalendarEventsWidget title={widget.title} widget={widget} />;
    case "tasks":           return <TasksWidget title={widget.title} widget={widget} />;
    case "drive_recent":    return <DriveRecentWidget title={widget.title} widget={widget} />;
    case "slack_channel":   return <SlackChannelWidget title={widget.title} data={data} />;
    case "iframe_embed": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cfg = widget.config as any;
      return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          <WidgetHeader title={widget.title} />
          <iframe src={cfg.url} height={cfg.height ?? 300} className="w-full border-0" />
        </div>
      );
    }
    default: return null;
  }
}

/* ---- Widget: Anúncios ---- */

type AnnouncementItem = {
  id: string; title: string; content: string; publishedAt: string;
};

function AnnouncementsWidget({ title, data }: { title: string; data: unknown }) {
  const items = (data as AnnouncementItem[]) ?? [];
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <WidgetHeader title={title} icon={<Megaphone className="size-3.5 text-[var(--vd-blue-500)]" />} />
      <div className="divide-y divide-[var(--border)]">
        {items.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">Sem anúncios.</p>
        )}
        {items.map((a) => {
          const plain = a.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
          const date = new Date(a.publishedAt).toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
          return (
            <div key={a.id} className="px-4 py-3.5">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="m-0 text-sm font-semibold text-[var(--foreground)]">{a.title}</p>
                <span className="shrink-0 text-[10px] text-[var(--muted-foreground)]">{date}</span>
              </div>
              <p className="m-0 line-clamp-2 text-xs text-[var(--muted-foreground)]">{plain}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Widget: Aniversários ---- */

type BirthdayItem = { id: string; name: string; image: string | null; jobTitle: string | null; date: string; daysUntil: number };

function BirthdaysWidget({ title, data }: { title: string; data: unknown }) {
  const items = (data as BirthdayItem[]) ?? [];
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <WidgetHeader title={title} icon={<Cake className="size-3.5 text-[var(--vd-orange-500)]" />} />
      <div className="flex flex-col gap-0 divide-y divide-[var(--border)]">
        {items.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">Sem aniversários próximos.</p>
        )}
        {items.map((b) => {
          const initials = getInitials(b.name.split(" ")[0] ?? "", b.name.split(" ").slice(-1)[0] ?? "");
          const bg = getAvatarColor(b.id);
          const label = b.daysUntil === 0 ? "hoje!" : b.daysUntil === 1 ? "amanhã" : `em ${b.daysUntil} dias`;
          return (
            <div key={b.id} className="flex items-center gap-3 px-4 py-2.5">
              {b.image
                ? <img src={b.image} alt="" className="size-8 rounded-full object-cover" />
                : <span className="grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: bg }}>{initials}</span>
              }
              <div className="flex-1 min-w-0">
                <p className="m-0 text-sm font-semibold text-[var(--foreground)] truncate">{b.name}</p>
                {b.jobTitle && <p className="m-0 text-[11px] text-[var(--muted-foreground)] truncate">{b.jobTitle}</p>}
              </div>
              <span className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                b.daysUntil === 0
                  ? "bg-[var(--vd-orange-50)] text-[var(--vd-orange-500)]"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)]"
              )}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Widget: KPI n8n ---- */

type KpiMetric = { key: string; label: string; format: string; prefix?: string; suffix?: string; value: unknown; trend: unknown };

function KpiWidget({ title, data }: { title: string; data: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metrics: KpiMetric[] = (data as any)?.metrics ?? [];

  function formatValue(m: KpiMetric): string {
    const v = m.value;
    if (v === undefined || v === null) return "—";
    const num = Number(v);
    if (isNaN(num)) return String(v);
    const formatted = m.format === "currency"
      ? num.toLocaleString("pt-PT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      : m.format === "percent"
      ? num.toFixed(1)
      : num.toLocaleString("pt-PT");
    return `${m.prefix ?? ""}${formatted}${m.suffix ?? ""}`;
  }

  function trendIcon(trend: unknown) {
    const n = Number(trend);
    if (isNaN(n) || trend === null || trend === undefined) return <Minus className="size-3" />;
    if (n > 0) return <ArrowUp className="size-3 text-[var(--vd-success)]" />;
    if (n < 0) return <ArrowDown className="size-3 text-red-500" />;
    return <Minus className="size-3" />;
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <WidgetHeader title={title} />
      <div className="grid grid-cols-2 gap-px bg-[var(--border)] overflow-hidden rounded-b-xl">
        {metrics.map((m) => (
          <div key={m.key} className="bg-[var(--card)] px-4 py-3.5">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{m.label}</div>
            <div className="mt-1 text-2xl font-bold text-[var(--vd-blue-500)] dark:text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.015em" }}>
              {formatValue(m)}
            </div>
            {m.trend !== undefined && m.trend !== null && (
              <div className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-[var(--muted-foreground)]">
                {trendIcon(m.trend)}
                <span>{String(m.trend)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Widget: Calendar Events ---- */

type CalendarEvent = {
  id: string | null;
  summary: string;
  start: string | null;
  end: string | null;
  isAllDay: boolean;
  htmlLink: string | null;
  calendarName: string | null;
  calendarColor: string | null;
  location: string | null;
  meetLink: string | null;
};

function CalendarEventsWidget({ title, widget }: { title: string; widget: WidgetMeta }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calState, setCalState] = useState<"loading" | "ok" | "error" | "noauth">("loading");

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cfg = widget.config as any;
    const days = cfg.daysAhead ?? 7;
    const max = cfg.maxEvents ?? 5;
    fetch(`/api/calendar/events?mode=personal&days=${days}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error === "drive_auth_required" || d.error === "calendar_scope_missing") {
          setCalState("noauth");
        } else if (d.error) {
          setCalState("error");
        } else {
          setEvents((d.events ?? []).slice(0, max));
          setCalState("ok");
        }
      })
      .catch(() => setCalState("error"));
  }, [widget.config]);

  function formatTime(iso: string | null, isAllDay: boolean) {
    if (!iso) return "";
    if (isAllDay) return "Dia inteiro";
    return new Date(iso).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  }

  function dayLabel(iso: string | null) {
    if (!iso) return "";
    const d = new Date(iso);
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return "Hoje";
    if (d.toDateString() === tomorrow.toDateString()) return "Amanhã";
    return d.toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" });
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-3.5 text-[var(--vd-blue-500)]" />
          <span className="text-sm font-bold text-[var(--foreground)]">{title}</span>
        </div>
        <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-semibold text-[var(--vd-blue-500)] hover:underline">
          Abrir
        </a>
      </div>

      {calState === "loading" && (
        <div className="flex flex-col gap-2 p-4">
          {[1,2,3].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-[var(--muted)]" />)}
        </div>
      )}

      {calState === "noauth" && (
        <div className="px-4 py-5 text-center">
          <p className="text-xs text-[var(--muted-foreground)]">Sessão sem permissão para o Calendar.</p>
          <a href="/api/auth/reauthorize?callbackUrl=/" className="mt-2 inline-block text-xs font-semibold text-[var(--vd-blue-500)] hover:underline">
            Renovar sessão
          </a>
        </div>
      )}

      {calState === "error" && (
        <div className="flex items-center gap-2 px-4 py-4 text-xs text-red-500">
          <AlertCircle className="size-3.5 shrink-0" /> Erro ao carregar eventos
        </div>
      )}

      {calState === "ok" && events.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">Sem eventos próximos.</p>
      )}

      {calState === "ok" && events.length > 0 && (
        <div className="divide-y divide-[var(--border)]">
          {events.map((e) => (
            <a
              key={e.id}
              href={e.htmlLink ?? "https://calendar.google.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--muted)]"
            >
              <span
                className="mt-1 size-2 shrink-0 rounded-full"
                style={{ background: e.calendarColor ?? "var(--vd-blue-500)" }}
              />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--foreground)]">{e.summary}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[var(--muted-foreground)]">
                  <span className="font-medium text-[var(--vd-blue-500)]">{dayLabel(e.start)}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-2.5" />
                    {formatTime(e.start, e.isAllDay)}
                  </span>
                  {e.location && (
                    <span className="flex items-center gap-1 truncate max-w-[120px]">
                      <MapPin className="size-2.5 shrink-0" />{e.location}
                    </span>
                  )}
                </div>
              </div>
              {e.meetLink && (
                <span className="shrink-0 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                  Meet
                </span>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- Widget: Drive Recent ---- */

const MIME_LABELS: Record<string, string> = {
  "application/vnd.google-apps.document":     "Doc",
  "application/vnd.google-apps.spreadsheet":  "Sheet",
  "application/vnd.google-apps.presentation": "Slides",
  "application/vnd.google-apps.form":         "Form",
  "application/pdf":                          "PDF",
  "application/vnd.google-apps.folder":       "Pasta",
};

type DriveFile = { id: string; name: string; mimeType: string; webViewLink: string; iconLink: string | null; modifiedTime: string | null };

function DriveRecentWidget({ title, widget }: { title: string; widget: WidgetMeta }) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [driveState, setDriveState] = useState<"loading" | "ok" | "error" | "noauth">("loading");

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cfg = widget.config as any;
    const limit = cfg.limit ?? 5;
    const folderId = cfg.folderId ? `&folderId=${encodeURIComponent(cfg.folderId)}` : "";
    fetch(`/api/docs/recent?mode=recent&limit=${limit}${folderId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error === "drive_auth_required") { setDriveState("noauth"); return; }
        if (d.error) { setDriveState("error"); return; }
        setFiles((d.files ?? []).slice(0, limit));
        setDriveState("ok");
      })
      .catch(() => setDriveState("error"));
  }, [widget.config]);

  function relativeTime(iso: string | null) {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Link2 className="size-3.5 text-[var(--vd-blue-500)]" />
          <span className="text-sm font-bold text-[var(--foreground)]">{title}</span>
        </div>
        <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-semibold text-[var(--vd-blue-500)] hover:underline">
          Abrir Drive
        </a>
      </div>

      {driveState === "loading" && (
        <div className="flex flex-col gap-2 p-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-9 animate-pulse rounded-lg bg-[var(--muted)]" />)}
        </div>
      )}
      {driveState === "noauth" && (
        <div className="px-4 py-5 text-center">
          <p className="text-xs text-[var(--muted-foreground)]">Sessão sem permissão para o Drive.</p>
          <a href="/api/auth/reauthorize?callbackUrl=/" className="mt-2 inline-block text-xs font-semibold text-[var(--vd-blue-500)] hover:underline">Renovar sessão</a>
        </div>
      )}
      {driveState === "error" && (
        <div className="flex items-center gap-2 px-4 py-4 text-xs text-red-500">
          <AlertCircle className="size-3.5 shrink-0" /> Erro ao carregar ficheiros
        </div>
      )}
      {driveState === "ok" && files.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">Sem ficheiros recentes.</p>
      )}
      {driveState === "ok" && files.length > 0 && (
        <div className="divide-y divide-[var(--border)]">
          {files.map((f) => (
            <a key={f.id} href={f.webViewLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--muted)]">
              {f.iconLink
                ? <img src={f.iconLink} alt="" className="size-4 shrink-0" />
                : <Link2 className="size-4 shrink-0 text-[var(--muted-foreground)]" />}
              <span className="flex-1 truncate text-sm text-[var(--foreground)]">{f.name}</span>
              <div className="flex shrink-0 items-center gap-2 text-[10px] text-[var(--muted-foreground)]">
                {MIME_LABELS[f.mimeType] && (
                  <span className="rounded bg-[var(--muted)] px-1.5 py-px font-medium">{MIME_LABELS[f.mimeType]}</span>
                )}
                <span>{relativeTime(f.modifiedTime)}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- Widget: Tasks ---- */

type Task = {
  id: string; title: string; due: string | null; notes: string | null;
  status: string; listTitle: string; listId: string;
};

function TasksWidget({ title, widget }: { title: string; widget: WidgetMeta }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskState, setTaskState] = useState<"loading" | "ok" | "error" | "noauth">("loading");

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cfg = widget.config as any;
    const max = cfg.maxTasks ?? 10;
    const showCompleted = cfg.showCompleted ? "true" : "false";
    fetch(`/api/tasks?max=${max}&showCompleted=${showCompleted}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error === "auth_required" || d.error === "tasks_scope_missing") {
          setTaskState("noauth");
        } else if (d.error) {
          setTaskState("error");
        } else {
          setTasks(d.tasks ?? []);
          setTaskState("ok");
        }
      })
      .catch(() => setTaskState("error"));
  }, [widget.config]);

  function dueLabel(due: string | null): { label: string; overdue: boolean } {
    if (!due) return { label: "", overdue: false };
    const d = new Date(due);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const overdue = d < today;
    const label = overdue ? "Em atraso"
      : d.toDateString() === today.toDateString() ? "Hoje"
      : d.toDateString() === tomorrow.toDateString() ? "Amanhã"
      : d.toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
    return { label, overdue };
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="size-3.5 text-[var(--vd-blue-500)]" />
          <span className="text-sm font-bold text-[var(--foreground)]">{title}</span>
        </div>
        <a href="https://tasks.google.com" target="_blank" rel="noopener noreferrer"
          className="text-[11px] font-semibold text-[var(--vd-blue-500)] hover:underline">
          Abrir
        </a>
      </div>

      {taskState === "loading" && (
        <div className="flex flex-col gap-2 p-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-[var(--muted)]" />)}
        </div>
      )}

      {taskState === "noauth" && (
        <div className="px-4 py-5 text-center">
          <p className="text-xs text-[var(--muted-foreground)]">Sessão sem permissão para o Google Tasks.</p>
          <a href="/api/auth/reauthorize?callbackUrl=/" className="mt-2 inline-block text-xs font-semibold text-[var(--vd-blue-500)] hover:underline">
            Renovar sessão
          </a>
        </div>
      )}

      {taskState === "error" && (
        <div className="flex items-center gap-2 px-4 py-4 text-xs text-red-500">
          <AlertCircle className="size-3.5 shrink-0" /> Erro ao carregar tarefas
        </div>
      )}

      {taskState === "ok" && tasks.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">Sem tarefas pendentes.</p>
      )}

      {taskState === "ok" && tasks.length > 0 && (
        <div className="divide-y divide-[var(--border)]">
          {tasks.map((t) => {
            const { label, overdue } = dueLabel(t.due);
            const done = t.status === "completed";
            return (
              <div key={t.id} className="flex items-start gap-3 px-4 py-3">
                {done
                  ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  : <Circle className={cn("mt-0.5 size-4 shrink-0", overdue ? "text-red-400" : "text-[var(--muted-foreground)]")} />
                }
                <div className="flex-1 min-w-0">
                  <p className={cn("truncate text-sm font-medium", done && "line-through text-[var(--muted-foreground)]")}>
                    {t.title}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[var(--muted-foreground)]">
                    {label && (
                      <span className={cn("font-semibold", overdue ? "text-red-500" : "text-[var(--muted-foreground)]")}>
                        {label}
                      </span>
                    )}
                    {t.listTitle && <span>{t.listTitle}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---- Widget: Quick Links ---- */

type QuickLink = { label: string; url: string; icon: string; color?: string; roleIds?: string[] };

function QuickLinksWidget({ title, data }: { title: string; data: unknown }) {
  const links = (data as QuickLink[]) ?? [];
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <WidgetHeader title={title} icon={<Link2 className="size-3.5 text-[var(--muted-foreground)]" />} />
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--accent)]"
          >
            <span
              className="grid size-5 shrink-0 place-items-center rounded"
              style={{ background: l.color ?? "var(--vd-blue-500)" }}
            >
              <ExternalLink className="size-2.5 text-white" />
            </span>
            <span className="truncate">{l.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ---- Widget: Slack Channel ---- */

type SlackMessage = { ts: string; text: string; userName: string; isBot: boolean; date: string };
type SlackChannelData = { channelId: string; teamId: string; messages: SlackMessage[] };

function SlackChannelWidget({ title, data }: { title: string; data: unknown }) {
  // compatibilidade com cache antiga (array) e novo formato (objeto)
  const isLegacy = Array.isArray(data);
  const channelId = isLegacy ? "" : (data as SlackChannelData)?.channelId ?? "";
  const teamId = isLegacy ? "" : (data as SlackChannelData)?.teamId ?? "";
  const messages: SlackMessage[] = isLegacy ? (data as SlackMessage[]) : ((data as SlackChannelData)?.messages ?? []);

  function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  }

  function messageUrl(ts: string) {
    // deep link para a mensagem específica no Slack (app ou browser)
    const tsSafe = ts.replace(".", "");
    if (teamId && channelId) {
      return `slack://channel?team=${teamId}&id=${channelId}&message=${tsSafe}`;
    }
    // fallback HTTPS se não tiver teamId
    return `https://slack.com/archives/${channelId}/p${tsSafe}`;
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <WidgetHeader title={title} icon={<Hash className="size-3.5 text-[#4a154b]" />} />
      <div className="divide-y divide-[var(--border)]">
        {messages.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">Sem mensagens recentes.</p>
        )}
        {messages.map((m) => (
          <a
            key={m.ts}
            href={messageUrl(m.ts)}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-3 transition-colors hover:bg-[var(--muted)]"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--foreground)]">{m.userName}</span>
              {m.isBot && (
                <span className="rounded bg-[var(--muted)] px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Bot</span>
              )}
              <span className="ml-auto text-[10px] text-[var(--muted-foreground)]">{relativeTime(m.date)}</span>
            </div>
            <p className="m-0 line-clamp-2 text-xs text-[var(--muted-foreground)] whitespace-pre-wrap">{m.text}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ---- Helpers ---- */

function WidgetHeader({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
      {icon}
      <span className="text-sm font-bold text-[var(--foreground)]">{title}</span>
    </div>
  );
}

function WidgetSkeleton({ title }: { title?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
      {title && <div className="border-b border-[var(--border)] px-4 py-3 text-sm font-bold text-[var(--foreground)]">{title}</div>}
      <div className="flex flex-col gap-2 p-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-[var(--muted)]" />)}
      </div>
    </div>
  );
}

function WidgetError({ title, error }: { title: string; error: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <WidgetHeader title={title} />
      <div className="flex items-center gap-2 px-4 py-4 text-sm text-red-500">
        <AlertCircle className="size-4 shrink-0" /> {error}
      </div>
    </div>
  );
}

function PlaceholderWidget({ title, icon, message }: { title: string; icon: React.ReactNode; message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)]">
      <WidgetHeader title={title} icon={icon} />
      <div className="flex items-center gap-2 px-4 py-4 text-xs text-[var(--muted-foreground)]">
        <Loader2 className="size-3.5 shrink-0 animate-spin" /> {message}
      </div>
    </div>
  );
}
