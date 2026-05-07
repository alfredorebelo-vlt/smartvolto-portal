"use client";

import { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon, Clock, MapPin, Users, Video,
  ExternalLink, ChevronRight, AlertCircle, RefreshCw, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─── */

type CalEvent = {
  id: string | null;
  summary: string;
  description: string | null;
  location: string | null;
  start: string | null;
  end: string | null;
  isAllDay: boolean;
  htmlLink: string | null;
  organizer: string | null;
  attendeesCount: number;
  meetLink: string | null;
  calendarName: string | null;
  calendarColor: string | null;
};

type SharedCalendar = {
  id: string;
  name: string;
  events: CalEvent[];
};

type Tab = "personal" | "shared";

/* ─── Helpers ─── */

const COLORS = [
  "bg-[var(--vd-blue-500)]",
  "bg-[var(--vd-orange-500)]",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-rose-500",
  "bg-cyan-500",
];

function colorFor(idx: number) {
  return COLORS[idx % COLORS.length];
}

function formatDate(iso: string | null, isAllDay: boolean): string {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const dayLabel = sameDay(d, today)
    ? "Hoje"
    : sameDay(d, tomorrow)
    ? "Amanhã"
    : d.toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short" });

  if (isAllDay) return dayLabel;
  return `${dayLabel}, ${d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`;
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

function isToday(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

function groupByDay(events: CalEvent[]): { label: string; date: string; events: CalEvent[] }[] {
  const map = new Map<string, CalEvent[]>();
  for (const e of events) {
    const key = e.start ? new Date(e.start).toDateString() : "unknown";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries()).map(([key, evs]) => {
    const d = new Date(key);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    let label = d.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });
    if (d.toDateString() === today.toDateString()) label = "Hoje — " + label;
    else if (d.toDateString() === tomorrow.toDateString()) label = "Amanhã — " + label;
    return { label, date: key, events: evs };
  });
}

/* ─── Main ─── */

export function Calendar() {
  const [tab, setTab] = useState<Tab>("personal");
  const [personalEvents, setPersonalEvents] = useState<CalEvent[]>([]);
  const [sharedCalendars, setSharedCalendars] = useState<SharedCalendar[]>([]);
  const [sharedMessage, setSharedMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarName, setCalendarName] = useState("A minha agenda");

  function fetchPersonal() {
    setLoading(true);
    setError(null);
    fetch("/api/calendar/events?mode=personal&days=14")
      .then((r) => r.json())
      .then((d) => {
        if (d.error === "drive_auth_required" || d.error === "calendar_scope_missing") {
          setError(d.error);
        } else if (d.error) {
          setError(d.error);
        } else {
          setPersonalEvents(d.events ?? []);
          setCalendarName(d.calendarName ?? "A minha agenda");
        }
        setLoading(false);
      })
      .catch(() => { setError("Erro de rede"); setLoading(false); });
  }

  function fetchShared() {
    setLoading(true);
    setError(null);
    fetch("/api/calendar/events?mode=shared&days=14")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); }
        else {
          setSharedCalendars(d.calendars ?? []);
          setSharedMessage(d.message ?? null);
        }
        setLoading(false);
      })
      .catch(() => { setError("Erro de rede"); setLoading(false); });
  }

  useEffect(() => { fetchPersonal(); }, []);

  function switchTab(t: Tab) {
    setTab(t);
    setError(null);
    if (t === "personal") fetchPersonal();
    else fetchShared();
  }

  /* ── Error states ── */
  if (error === "drive_auth_required" || error === "calendar_scope_missing") {
    return (
      <div className="flex min-h-full flex-col gap-4 bg-[var(--muted)] p-4 sm:p-6 lg:p-8">
        <CalendarHeader tab={tab} onSwitch={switchTab} />
        <div className="rounded-2xl border border-[var(--vd-orange-500)]/30 bg-[var(--vd-orange-50)] p-8 text-center">
          <AlertCircle className="mx-auto mb-3 size-6 text-[var(--vd-orange-500)]" />
          <p className="text-sm font-semibold text-[var(--foreground)]">Acesso ao Calendário não autorizado</p>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            A tua sessão não tem permissão para aceder ao Google Calendar. Renova a sessão para autorizar.
          </p>
          <a href="/api/auth/reauthorize?callbackUrl=/"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--vd-blue-500)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
            Renovar sessão
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-4 bg-[var(--muted)] p-4 sm:gap-5 sm:p-6 lg:p-8">
      <CalendarHeader tab={tab} onSwitch={switchTab} />

      {tab === "personal" && (
        <PersonalView
          events={personalEvents}
          calendarName={calendarName}
          loading={loading}
          onRefresh={fetchPersonal}
        />
      )}

      {tab === "shared" && (
        <SharedView
          calendars={sharedCalendars}
          message={sharedMessage}
          loading={loading}
          onRefresh={fetchShared}
        />
      )}
    </div>
  );
}

/* ─── Header com tabs ─── */

function CalendarHeader({ tab, onSwitch }: { tab: Tab; onSwitch: (t: Tab) => void }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6">
      <div className="vd-eyebrow mb-1">Agenda</div>
      <h2 className="m-0 text-xl font-bold text-[var(--vd-blue-500)] dark:text-[var(--foreground)] sm:text-2xl"
        style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.015em" }}>
        Calendário
      </h2>
      <div className="mt-4 flex gap-1 rounded-xl bg-[var(--muted)] p-1 w-fit">
        {([["personal", "A minha agenda", CalendarIcon], ["shared", "Agenda Volto Drive", Building2]] as [Tab, string, React.ElementType][]).map(([t, label, Icon]) => (
          <button key={t} type="button" onClick={() => onSwitch(t)}
            className={cn("flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors",
              tab === t
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]")}>
            <Icon className="size-3.5" />{label}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ─── Vista pessoal ─── */

function PersonalView({ events, calendarName, loading, onRefresh }: {
  events: CalEvent[]; calendarName: string; loading: boolean; onRefresh: () => void;
}) {
  const groups = groupByDay(events);

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--muted-foreground)]">
          Próximos 14 dias — <span className="font-semibold">{calendarName}</span>
        </p>
        <div className="flex items-center gap-2">
          <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]">
            <ExternalLink className="size-3.5" /> Abrir Calendar
          </a>
          <button type="button" onClick={onRefresh} disabled={loading}
            className="grid size-7 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] disabled:opacity-40">
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {loading ? <AgendaSkeleton /> : groups.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <CalendarIcon className="mx-auto mb-3 size-7 text-[var(--muted-foreground)]" />
          <p className="text-sm font-semibold text-[var(--foreground)]">Sem eventos nos próximos 14 dias</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">A tua agenda está livre.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <div key={group.date} className="flex flex-col gap-2">
              <div className={cn(
                "px-1 text-xs font-bold uppercase tracking-wider",
                group.label.startsWith("Hoje") ? "text-[var(--vd-blue-500)]" : "text-[var(--muted-foreground)]"
              )}>
                {group.label}
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden divide-y divide-[var(--border)]">
                {group.events.map((event) => (
                  <EventRow key={event.id} event={event} accentColor="bg-[var(--vd-blue-500)]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Vista empresa ─── */

function SharedView({ calendars, message, loading, onRefresh }: {
  calendars: SharedCalendar[]; message: string | null; loading: boolean; onRefresh: () => void;
}) {
  const [activeCalendar, setActiveCalendar] = useState<string | null>(null);

  useEffect(() => {
    if (calendars.length > 0 && !activeCalendar) setActiveCalendar(calendars[0].id);
  }, [calendars, activeCalendar]);

  const current = calendars.find((c) => c.id === activeCalendar) ?? null;
  const groups = current ? groupByDay(current.events) : [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--muted-foreground)]">Próximos 14 dias — calendários da empresa</p>
        <button type="button" onClick={onRefresh} disabled={loading}
          className="grid size-7 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] disabled:opacity-40">
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {loading ? <AgendaSkeleton /> : message ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <Building2 className="mx-auto mb-3 size-7 text-[var(--muted-foreground)]" />
          <p className="text-sm font-semibold text-[var(--foreground)]">Sem calendários configurados</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Adiciona os IDs dos calendários partilhados na variável <code className="font-mono text-[11px]">GOOGLE_SHARED_CALENDAR_IDS</code> no servidor.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
          {/* Lista de calendários */}
          {calendars.length > 1 && (
            <aside className="flex gap-1 overflow-x-auto lg:flex-col lg:w-48 lg:shrink-0">
              {calendars.map((cal, idx) => (
                <button key={cal.id} type="button"
                  onClick={() => setActiveCalendar(cal.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors whitespace-nowrap",
                    activeCalendar === cal.id
                      ? "bg-[var(--vd-blue-500)] text-white"
                      : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
                  )}>
                  <span className={cn("size-2.5 shrink-0 rounded-full", colorFor(idx))} />
                  {cal.name}
                  <span className={cn("ml-auto text-[10px]",
                    activeCalendar === cal.id ? "text-white/70" : "text-[var(--muted-foreground)]")}>
                    {cal.events.length}
                  </span>
                </button>
              ))}
            </aside>
          )}

          {/* Eventos do calendário selecionado */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            {groups.length === 0 ? (
              <div className="grid place-items-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
                <CalendarIcon className="mx-auto mb-3 size-6 text-[var(--muted-foreground)]" />
                <p className="text-sm text-[var(--muted-foreground)]">Sem eventos nos próximos 14 dias.</p>
              </div>
            ) : (
              groups.map((group, gIdx) => (
                <div key={group.date} className="flex flex-col gap-2">
                  <div className={cn("px-1 text-xs font-bold uppercase tracking-wider",
                    group.label.startsWith("Hoje") ? "text-[var(--vd-blue-500)]" : "text-[var(--muted-foreground)]")}>
                    {group.label}
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden divide-y divide-[var(--border)]">
                    {group.events.map((event) => (
                      <EventRow key={event.id} event={event} accentColor={colorFor(gIdx)} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Linha de evento ─── */

function EventRow({ event, accentColor }: { event: CalEvent; accentColor: string }) {
  const [expanded, setExpanded] = useState(false);
  const today = isToday(event.start);

  return (
    <div className={cn("group transition-colors", today ? "bg-[var(--vd-blue-50)]/40 dark:bg-[var(--vd-blue-500)]/5" : "")}>
      <button type="button" onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-[var(--muted)] transition-colors">
        {/* Barra de cor lateral */}
        <div className={cn("mt-1 w-1 shrink-0 self-stretch rounded-full", accentColor)} style={{ minHeight: "1rem" }} />

        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--foreground)]">{event.summary}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--muted-foreground)]">
            {event.start && (
              <span className="flex items-center gap-1">
                <Clock className="size-3 shrink-0" />
                {event.isAllDay ? "Dia inteiro" : `${formatTime(event.start)}${event.end ? ` – ${formatTime(event.end)}` : ""}`}
              </span>
            )}
            {event.calendarName && (
              <span className="flex items-center gap-1">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: event.calendarColor ?? "var(--vd-blue-500)" }}
                />
                {event.calendarName}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1 truncate max-w-[180px]">
                <MapPin className="size-3 shrink-0" /> {event.location}
              </span>
            )}
            {event.attendeesCount > 0 && (
              <span className="flex items-center gap-1">
                <Users className="size-3 shrink-0" /> {event.attendeesCount}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 self-center">
          {event.meetLink && (
            <a href={event.meetLink} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400">
              <Video className="size-3" /> Meet
            </a>
          )}
          <ChevronRight className={cn("size-4 text-[var(--muted-foreground)] transition-transform", expanded && "rotate-90")} />
        </div>
      </button>

      {/* Detalhes expandidos */}
      {expanded && (
        <div className="border-t border-[var(--border)] bg-[var(--muted)]/50 px-8 py-3 flex flex-col gap-2">
          {event.description && (
            <p className="text-xs text-[var(--muted-foreground)] whitespace-pre-line leading-relaxed">
              {event.description.replace(/<[^>]*>/g, "").slice(0, 300)}
            </p>
          )}
          {event.organizer && (
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Organizado por <strong>{event.organizer}</strong>
            </p>
          )}
          {event.htmlLink && (
            <a href={event.htmlLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-semibold text-[var(--vd-blue-500)] hover:underline w-fit">
              <ExternalLink className="size-3" /> Ver no Google Calendar
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Skeleton ─── */

function AgendaSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1].map((g) => (
        <div key={g} className="flex flex-col gap-2">
          <div className="h-3 w-32 animate-pulse rounded bg-[var(--muted)]" />
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3 border-b border-[var(--border)] px-4 py-3 last:border-0">
                <div className="mt-1 h-12 w-1 animate-pulse rounded-full bg-[var(--muted)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-2/3 animate-pulse rounded bg-[var(--muted)]" />
                  <div className="h-2.5 w-1/3 animate-pulse rounded bg-[var(--muted)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
