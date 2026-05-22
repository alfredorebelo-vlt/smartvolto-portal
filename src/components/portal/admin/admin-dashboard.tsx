"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Plus, Pencil, Trash2, GripVertical, Eye, EyeOff,
  LayoutDashboard, ChevronDown, ChevronUp, Save, X, Link, Check, ShieldAlert,
  Hash, Calendar, ListTodo, HardDrive, Monitor, Webhook,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { confirm } from "@/components/ui/confirm-dialog";
import type { WidgetType } from "@/lib/dashboard/types";

type QuickLink = { label: string; url: string; color: string; roleIds: string[] };
type KpiMetric = { key: string; label: string; format: "number" | "currency" | "percent"; prefix: string; suffix: string; trendKey: string };

type Widget = {
  id: string;
  type: WidgetType;
  title: string;
  config: Record<string, unknown>;
  col: number;
  order: number;
  isActive: boolean;
  roleIds: string[];
  cacheTtl: number;
};

type Role = {
  id: string;
  name: string;
  description: string | null;
};

const WIDGET_TYPES: { value: WidgetType; label: string; description: string }[] = [
  { value: "announcements",   label: "Anúncios",          description: "Últimos anúncios da empresa" },
  { value: "birthdays",       label: "Aniversários",      description: "Próximos aniversários da equipa" },
  { value: "calendar_events", label: "Calendário",        description: "Próximos eventos do Google Calendar" },
  { value: "tasks",           label: "Tarefas",           description: "Tarefas do Google Tasks" },
  { value: "quick_links",     label: "Ações rápidas",     description: "Links configuráveis" },
  { value: "kpi_n8n",         label: "KPI via n8n/API",   description: "Métricas via webhook externo" },
  { value: "drive_recent",    label: "Drive (recentes)",  description: "Documentos recentes do Google Drive" },
  { value: "iframe_embed",    label: "Embed externo",     description: "Página ou dashboard em iframe" },
  { value: "slack_channel",   label: "Canal Slack",       description: "Mensagens recentes de um canal Slack" },
];

const COL_LABELS: Record<number, string> = { 1: "Coluna principal (2/3)", 2: "Coluna lateral (1/3)" };

export function AdminDashboard() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Widget | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const [res, rolesRes] = await Promise.all([
      fetch("/api/admin/dashboard"),
      fetch("/api/admin/roles"),
    ]);
    const data = await res.json();
    const rolesData = await rolesRes.json();
    setWidgets(data.widgets ?? []);
    setRoles(rolesData.roles ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(w: Widget) {
    await fetch(`/api/admin/dashboard/${w.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !w.isActive }),
    });
    setWidgets((prev) => prev.map((x) => x.id === w.id ? { ...x, isActive: !x.isActive } : x));
  }

  async function deleteWidget(id: string) {
    if (!await confirm({ message: "Eliminar widget?", variant: "danger", confirmLabel: "Eliminar" })) return;
    await fetch(`/api/admin/dashboard/${id}`, { method: "DELETE" });
    setWidgets((prev) => prev.filter((x) => x.id !== id));
  }

  async function reorder(ids: string[]) {
    await fetch("/api/admin/dashboard/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
  }

  function handleReorder(colWidgets: Widget[], fromIdx: number, toIdx: number) {
    const reordered = [...colWidgets];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const col = reordered[0]?.col ?? 1;
    const otherCol = widgets.filter((w) => w.col !== col);
    setWidgets([...otherCol, ...reordered]);
    reorder(reordered.map((w) => w.id));
  }

  const col1 = widgets.filter((w) => w.col === 1).sort((a, b) => a.order - b.order);
  const col2 = widgets.filter((w) => w.col === 2).sort((a, b) => a.order - b.order);

  const dragSrc = useRef<{ col: number; idx: number } | null>(null);
  const [dragOver, setDragOver] = useState<{ col: number; idx: number } | null>(null);

  const handleDragStart = useCallback((col: number, idx: number) => {
    dragSrc.current = { col, idx };
  }, []);

  const handleDragOver = useCallback((col: number, idx: number) => {
    setDragOver({ col, idx });
  }, []);

  const handleDrop = useCallback((col: number, toIdx: number) => {
    const src = dragSrc.current;
    if (!src || src.col !== col || src.idx === toIdx) { setDragOver(null); return; }
    const colWidgets = (col === 1 ? col1 : col2);
    handleReorder(colWidgets, src.idx, toIdx);
    dragSrc.current = null;
    setDragOver(null);
  }, [col1, col2, handleReorder]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDragEnd = useCallback(() => {
    dragSrc.current = null;
    setDragOver(null);
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="m-0 text-base font-bold text-[var(--foreground)]">Widgets do Dashboard</h3>
          <p className="m-0 mt-0.5 text-sm text-[var(--muted-foreground)]">
            Configura os blocos da homepage. Arrasta para reordenar dentro de cada coluna.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-lg bg-[var(--vd-blue-500)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus className="size-4" /> Novo widget
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--muted)]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[{ col: 1, items: col1 }, { col: 2, items: col2 }].map(({ col, items }) => (
            <div key={col}>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                {COL_LABELS[col]}
              </div>
              <div className="flex flex-col gap-2">
                {items.length === 0 && (
                  <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--muted-foreground)]">
                    Sem widgets nesta coluna
                  </div>
                )}
                {items.map((w, idx) => (
                  <WidgetCard
                    key={w.id}
                    widget={w}
                    idx={idx}
                    total={items.length}
                    isDragOver={dragOver?.col === col && dragOver?.idx === idx}
                    onToggle={() => toggleActive(w)}
                    onEdit={() => setEditing(w)}
                    onDelete={() => deleteWidget(w.id)}
                    onMoveUp={idx > 0 ? () => handleReorder(items, idx, idx - 1) : undefined}
                    onMoveDown={idx < items.length - 1 ? () => handleReorder(items, idx, idx + 1) : undefined}
                    onDragStart={() => handleDragStart(col, idx)}
                    onDragOver={() => handleDragOver(col, idx)}
                    onDrop={() => handleDrop(col, idx)}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <WidgetForm
          widget={editing ?? undefined}
          roles={roles}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={load}
        />
      )}
    </div>
  );
}

/* ---- Widget Card ---- */

function WidgetCard({
  widget, idx: _idx, total: _total, isDragOver,
  onToggle, onEdit, onDelete, onMoveUp, onMoveDown,
  onDragStart, onDragOver, onDrop, onDragEnd,
}: {
  widget: Widget;
  idx: number;
  total: number;
  isDragOver: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  const typeMeta = WIDGET_TYPES.find((t) => t.value === widget.type);

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; onDragOver(); }}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
      onDragEnd={onDragEnd}
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-[var(--card)] px-4 py-3 transition-all",
        isDragOver ? "border-[var(--vd-blue-500)] shadow-md scale-[1.01]" : "border-[var(--border)]",
        !widget.isActive && "opacity-50",
      )}
    >
      <GripVertical className="size-4 shrink-0 cursor-grab text-[var(--muted-foreground)]" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--foreground)] truncate">{widget.title}</span>
          <span className="shrink-0 rounded-full bg-[var(--muted)] px-2 py-px text-[10px] font-medium text-[var(--muted-foreground)]">
            {typeMeta?.label ?? widget.type}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-[var(--muted-foreground)]">
          <span>{typeMeta?.description} · cache {widget.cacheTtl}s</span>
          {widget.roleIds.length > 0 && (
            <span className="rounded-full bg-[var(--vd-blue-500)]/10 px-1.5 py-px text-[10px] font-medium text-[var(--vd-blue-500)]">
              {widget.roleIds.length} role{widget.roleIds.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <div className="flex flex-col">
          <button type="button" onClick={onMoveUp} disabled={!onMoveUp}
            className="grid size-5 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)] disabled:opacity-20">
            <ChevronUp className="size-3" />
          </button>
          <button type="button" onClick={onMoveDown} disabled={!onMoveDown}
            className="grid size-5 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)] disabled:opacity-20">
            <ChevronDown className="size-3" />
          </button>
        </div>
        <button type="button" onClick={onToggle}
          title={widget.isActive ? "Desactivar" : "Activar"}
          className="grid size-7 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
          {widget.isActive ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
        </button>
        <button type="button" onClick={onEdit}
          className="grid size-7 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
          <Pencil className="size-3.5" />
        </button>
        <button type="button" onClick={onDelete}
          className="grid size-7 place-items-center rounded text-[var(--muted-foreground)] hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ---- Widget Form (criar / editar) ---- */

function WidgetForm({
  widget, roles, onClose, onSaved,
}: {
  widget?: Widget;
  roles: Role[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!widget;
  const [type, setType] = useState<WidgetType>(widget?.type ?? "announcements");
  const [title, setTitle] = useState(widget?.title ?? "");
  const [col, setCol] = useState(widget?.col ?? 1);
  const [isActive, setIsActive] = useState(widget?.isActive ?? true);
  const [cacheTtl, setCacheTtl] = useState(widget?.cacheTtl ?? 300);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(widget?.roleIds ?? []);
  const [configError, setConfigError] = useState("");
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // --- per-type config state ---
  const cfg = widget?.config as Record<string, unknown> | undefined;

  // announcements / birthdays / tasks simple counts
  const [limit, setLimit] = useState<number>(() =>
    (cfg?.limit as number) ?? (cfg?.maxTasks as number) ?? 3
  );
  const [showCompleted, setShowCompleted] = useState<boolean>((cfg?.showCompleted as boolean) ?? false);

  // calendar_events
  const [calendarIds, setCalendarIds] = useState<string>(() =>
    ((cfg?.calendarIds as string[]) ?? []).join("\n")
  );
  const [daysAhead, setDaysAhead] = useState<number>((cfg?.daysAhead as number) ?? 7);
  const [maxEvents, setMaxEvents] = useState<number>((cfg?.maxEvents as number) ?? 5);

  // drive_recent
  const [folderId, setFolderId] = useState<string>((cfg?.folderId as string) ?? "");

  // iframe_embed
  const [iframeUrl, setIframeUrl] = useState<string>((cfg?.url as string) ?? "https://");
  const [iframeHeight, setIframeHeight] = useState<number>((cfg?.height as number) ?? 300);

  // quick_links
  const [links, setLinks] = useState<QuickLink[]>(() => {
    const l = cfg?.links as QuickLink[] | undefined;
    return l ?? [{ label: "", url: "https://", color: "#2e3c8f", roleIds: [] }];
  });

  // kpi_n8n
  const [webhookUrl, setWebhookUrl] = useState<string>((cfg?.webhookUrl as string) ?? "");
  const [metrics, setMetrics] = useState<KpiMetric[]>(() => {
    const m = cfg?.metrics as KpiMetric[] | undefined;
    return m ?? [{ key: "", label: "", format: "number", prefix: "", suffix: "", trendKey: "" }];
  });

  // slack_channel
  const [slackChannelId, setSlackChannelId] = useState<string>((cfg?.channelId as string) ?? "");
  const [slackLimit, setSlackLimit] = useState<number>((cfg?.limit as number) ?? 10);

  function toggleRole(id: string) {
    setSelectedRoles((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleTypeChange(t: WidgetType) {
    setType(t);
  }

  function buildConfig(): Record<string, unknown> | null {
    switch (type) {
      case "announcements":
      case "birthdays":
        return { limit };
      case "tasks":
        return { showCompleted, maxTasks: limit };
      case "calendar_events":
        return {
          calendarIds: calendarIds.split("\n").map((s) => s.trim()).filter(Boolean),
          daysAhead,
          maxEvents,
        };
      case "drive_recent":
        return { folderId: folderId.trim() || undefined, limit };
      case "iframe_embed":
        if (!iframeUrl.trim() || iframeUrl === "https://") {
          setConfigError("URL do iframe obrigatório");
          return null;
        }
        return { url: iframeUrl.trim(), height: iframeHeight };
      case "quick_links":
        if (links.some((l) => !l.label.trim() || !l.url.trim())) {
          setConfigError("Todos os links precisam de nome e URL");
          return null;
        }
        return { links: links.map((l) => ({ ...l, icon: "link", roleIds: l.roleIds ?? [] })) };
      case "kpi_n8n":
        if (!webhookUrl.trim()) { setConfigError("URL do webhook obrigatório"); return null; }
        if (metrics.some((m) => !m.key.trim() || !m.label.trim())) {
          setConfigError("Todas as métricas precisam de key e label");
          return null;
        }
        return {
          webhookUrl: webhookUrl.trim(),
          metrics: metrics.map((m) => ({
            key: m.key.trim(),
            label: m.label.trim(),
            format: m.format,
            ...(m.prefix.trim() ? { prefix: m.prefix.trim() } : {}),
            ...(m.suffix.trim() ? { suffix: m.suffix.trim() } : {}),
            ...(m.trendKey.trim() ? { trendKey: m.trendKey.trim() } : {}),
          })),
        };
      case "slack_channel":
        return { channelId: slackChannelId.trim(), limit: slackLimit };
      default:
        return {};
    }
  }

  function validateConfig(): Record<string, unknown> | null {
    setConfigError("");
    return buildConfig();
  }

  async function save() {
    const config = validateConfig();
    if (!config) return;
    if (!title.trim()) { setConfigError("Título obrigatório"); return; }

    setSaving(true);
    const url = isEdit ? `/api/admin/dashboard/${widget!.id}` : "/api/admin/dashboard";
    const method = isEdit ? "PATCH" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title: title.trim(), config, col, isActive, cacheTtl, roleIds: selectedRoles }),
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="size-4 text-[var(--vd-blue-500)]" />
            <h3 className="m-0 text-base font-bold">{isEdit ? "Editar widget" : "Novo widget"}</h3>
          </div>
          <button type="button" onClick={onClose}
            className="grid size-7 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
            <X className="size-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {/* Tipo */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Tipo</label>
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as WidgetType)}
              disabled={isEdit}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30 disabled:opacity-60"
            >
              {WIDGET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label} — {t.description}</option>
              ))}
            </select>
          </div>

          {/* Título */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Ações rápidas"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
            />
          </div>

          {/* Coluna + Cache */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Coluna</label>
              <select
                value={col}
                onChange={(e) => setCol(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
              >
                <option value={1}>Principal (2/3)</option>
                <option value={2}>Lateral (1/3)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Cache (segundos)</label>
              <input
                type="number"
                value={cacheTtl}
                min={0}
                onChange={(e) => setCacheTtl(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
              />
            </div>
          </div>

          {/* Config visual por tipo */}
          <ConfigEditor
            type={type}
            roles={roles}
            // shared
            limit={limit} onLimit={setLimit}
            // tasks
            showCompleted={showCompleted} onShowCompleted={setShowCompleted}
            // calendar
            calendarIds={calendarIds} onCalendarIds={setCalendarIds}
            daysAhead={daysAhead} onDaysAhead={setDaysAhead}
            maxEvents={maxEvents} onMaxEvents={setMaxEvents}
            // drive
            folderId={folderId} onFolderId={setFolderId}
            // iframe
            iframeUrl={iframeUrl} onIframeUrl={setIframeUrl}
            iframeHeight={iframeHeight} onIframeHeight={setIframeHeight}
            // quick_links
            links={links} onLinks={setLinks}
            // kpi_n8n
            webhookUrl={webhookUrl} onWebhookUrl={setWebhookUrl}
            metrics={metrics} onMetrics={setMetrics}
            // slack_channel
            slackChannelId={slackChannelId} onSlackChannelId={setSlackChannelId}
            slackLimit={slackLimit} onSlackLimit={setSlackLimit}
          />

          {configError && <p className="text-xs text-red-500">{configError}</p>}

          {/* Roles */}
          {roles.length > 0 && (
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Acesso por role
              </label>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {roles.map((role) => {
                  const active = selectedRoles.includes(role.id);
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => toggleRole(role.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                        active
                          ? "border-[var(--vd-blue-500)] bg-[var(--vd-blue-500)]/10 text-[var(--vd-blue-500)]"
                          : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--vd-blue-500)]/50",
                      )}
                    >
                      <div className={cn(
                        "flex size-3.5 shrink-0 items-center justify-center rounded-sm border",
                        active ? "border-[var(--vd-blue-500)] bg-[var(--vd-blue-500)]" : "border-[var(--border)]",
                      )}>
                        {active && <Check className="size-2.5 text-white" />}
                      </div>
                      <span className="truncate font-medium">{role.name}</span>
                    </button>
                  );
                })}
              </div>
              {selectedRoles.length === 0 && (
                <p className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                  <ShieldAlert className="size-3" />
                  Sem restrição de role — visível a todos os utilizadores autenticados
                </p>
              )}
            </div>
          )}

          {/* Activo */}
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-4 rounded"
            />
            <span className="font-medium text-[var(--foreground)]">Widget activo (visível na homepage)</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
          <button type="button" onClick={onClose}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--accent)]">
            Cancelar
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--vd-blue-500)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Save className="size-3.5" />
            {saving ? "A guardar…" : isEdit ? "Guardar" : "Criar widget"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Config Editor (visual, per-type) ---- */

type ConfigEditorProps = {
  type: WidgetType;
  roles: Role[];
  limit: number; onLimit: (v: number) => void;
  showCompleted: boolean; onShowCompleted: (v: boolean) => void;
  calendarIds: string; onCalendarIds: (v: string) => void;
  daysAhead: number; onDaysAhead: (v: number) => void;
  maxEvents: number; onMaxEvents: (v: number) => void;
  folderId: string; onFolderId: (v: string) => void;
  iframeUrl: string; onIframeUrl: (v: string) => void;
  iframeHeight: number; onIframeHeight: (v: number) => void;
  links: QuickLink[]; onLinks: (v: QuickLink[]) => void;
  webhookUrl: string; onWebhookUrl: (v: string) => void;
  metrics: KpiMetric[]; onMetrics: (v: KpiMetric[]) => void;
  slackChannelId: string; onSlackChannelId: (v: string) => void;
  slackLimit: number; onSlackLimit: (v: number) => void;
};

const LABEL = "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]";
const INPUT = "w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30";
const INPUT_SM = "w-full rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)]/30";

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 border-b border-[var(--border)] pb-2">
      <Icon className="size-3.5 text-[var(--muted-foreground)]" />
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</span>
    </div>
  );
}

function ConfigEditor(p: ConfigEditorProps) {
  function updateLink(i: number, field: keyof QuickLink, value: string) {
    p.onLinks(p.links.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  }
  function moveLink(i: number, dir: -1 | 1) {
    const next = [...p.links];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    p.onLinks(next);
  }
  function updateMetric(i: number, field: keyof KpiMetric, value: string) {
    p.onMetrics(p.metrics.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  }
  function moveMetric(i: number, dir: -1 | 1) {
    const next = [...p.metrics];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    p.onMetrics(next);
  }

  if (p.type === "announcements" || p.type === "birthdays") {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-4">
        <SectionHeader icon={Hash} label="Configuração" />
        <div>
          <label className={LABEL}>Número de itens a mostrar</label>
          <input type="number" min={1} max={20} value={p.limit}
            onChange={(e) => p.onLimit(Number(e.target.value))} className={INPUT} />
        </div>
      </div>
    );
  }

  if (p.type === "tasks") {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-4">
        <SectionHeader icon={ListTodo} label="Configuração" />
        <div>
          <label className={LABEL}>Máximo de tarefas</label>
          <input type="number" min={1} max={50} value={p.limit}
            onChange={(e) => p.onLimit(Number(e.target.value))} className={INPUT} />
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input type="checkbox" checked={p.showCompleted}
            onChange={(e) => p.onShowCompleted(e.target.checked)} className="size-4 rounded" />
          <span className="text-[var(--foreground)]">Mostrar tarefas concluídas</span>
        </label>
      </div>
    );
  }

  if (p.type === "calendar_events") {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-4">
        <SectionHeader icon={Calendar} label="Configuração" />
        <div>
          <label className={LABEL}>IDs de calendário (um por linha)</label>
          <textarea
            value={p.calendarIds}
            onChange={(e) => p.onCalendarIds(e.target.value)}
            rows={3}
            placeholder={"primary\nabc123@group.calendar.google.com"}
            className={cn(INPUT, "font-mono text-xs")}
          />
          <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
            Deixa em branco para usar o calendário principal. Encontra o ID nas definições do Google Calendar.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Dias à frente</label>
            <input type="number" min={1} max={90} value={p.daysAhead}
              onChange={(e) => p.onDaysAhead(Number(e.target.value))} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Máx. eventos</label>
            <input type="number" min={1} max={20} value={p.maxEvents}
              onChange={(e) => p.onMaxEvents(Number(e.target.value))} className={INPUT} />
          </div>
        </div>
      </div>
    );
  }

  if (p.type === "drive_recent") {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-4">
        <SectionHeader icon={HardDrive} label="Configuração" />
        <div>
          <label className={LABEL}>ID da pasta Drive (opcional)</label>
          <input type="text" value={p.folderId}
            onChange={(e) => p.onFolderId(e.target.value)}
            placeholder="Deixa em branco para mostrar ficheiros recentes de todo o Drive"
            className={INPUT} />
          <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
            Encontra o ID no URL da pasta: drive.google.com/drive/folders/<strong>ID_AQUI</strong>
          </p>
        </div>
        <div>
          <label className={LABEL}>Número de ficheiros</label>
          <input type="number" min={1} max={20} value={p.limit}
            onChange={(e) => p.onLimit(Number(e.target.value))} className={INPUT} />
        </div>
      </div>
    );
  }

  if (p.type === "iframe_embed") {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-4">
        <SectionHeader icon={Monitor} label="Configuração" />
        <div>
          <label className={LABEL}>URL a incorporar</label>
          <input type="url" value={p.iframeUrl}
            onChange={(e) => p.onIframeUrl(e.target.value)}
            placeholder="https://example.com/dashboard"
            className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Altura (px)</label>
          <input type="number" min={100} max={1200} step={50} value={p.iframeHeight}
            onChange={(e) => p.onIframeHeight(Number(e.target.value))} className={INPUT} />
        </div>
      </div>
    );
  }

  if (p.type === "quick_links") {
    function toggleLinkRole(linkIdx: number, roleId: string) {
      const link = p.links[linkIdx];
      const current = link.roleIds ?? [];
      const next = current.includes(roleId) ? current.filter((x) => x !== roleId) : [...current, roleId];
      p.onLinks(p.links.map((l, idx) => idx === linkIdx ? { ...l, roleIds: next } : l));
    }

    return (
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-4">
        <SectionHeader icon={Link} label="Links" />
        <div className="flex flex-col gap-2">
          {p.links.map((link, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2">
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={() => moveLink(i, -1)} disabled={i === 0}
                    className="grid size-5 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)] disabled:opacity-20">
                    <ChevronUp className="size-3" />
                  </button>
                  <button type="button" onClick={() => moveLink(i, 1)} disabled={i === p.links.length - 1}
                    className="grid size-5 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)] disabled:opacity-20">
                    <ChevronDown className="size-3" />
                  </button>
                </div>
                <input type="color" value={link.color}
                  onChange={(e) => updateLink(i, "color", e.target.value)}
                  className="size-8 shrink-0 cursor-pointer rounded border border-[var(--border)] bg-transparent p-0.5" />
                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <input type="text" value={link.label}
                    onChange={(e) => updateLink(i, "label", e.target.value)}
                    placeholder="Nome do link" className={INPUT_SM} />
                  <input type="url" value={link.url}
                    onChange={(e) => updateLink(i, "url", e.target.value)}
                    placeholder="https://"
                    className={cn(INPUT_SM, "text-xs text-[var(--muted-foreground)]")} />
                </div>
                <button type="button" onClick={() => p.onLinks(p.links.filter((_, idx) => idx !== i))}
                  className="grid size-7 shrink-0 place-items-center rounded text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              {p.roles.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 border-t border-[var(--border)] pt-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Roles:
                  </span>
                  {p.roles.map((role) => {
                    const active = (link.roleIds ?? []).includes(role.id);
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => toggleLinkRole(i, role.id)}
                        className={cn(
                          "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors",
                          active
                            ? "border-[var(--vd-blue-500)] bg-[var(--vd-blue-500)]/10 text-[var(--vd-blue-500)]"
                            : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--vd-blue-500)]/50",
                        )}
                      >
                        {active && <Check className="size-2.5" />}
                        {role.name}
                      </button>
                    );
                  })}
                  {(link.roleIds ?? []).length === 0 && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400">visível a todos</span>
                  )}
                </div>
              )}
            </div>
          ))}
          <button type="button"
            onClick={() => p.onLinks([...p.links, { label: "", url: "https://", color: "#2e3c8f", roleIds: [] }])}
            className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--border)] px-3 py-2 text-sm text-[var(--muted-foreground)] hover:border-[var(--vd-blue-500)] hover:text-[var(--vd-blue-500)]">
            <Link className="size-3.5" /> Adicionar link
          </button>
        </div>
      </div>
    );
  }

  if (p.type === "kpi_n8n") {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-4">
        <SectionHeader icon={Webhook} label="KPI via n8n" />
        <div>
          <label className={LABEL}>URL do webhook n8n</label>
          <input type="url" value={p.webhookUrl}
            onChange={(e) => p.onWebhookUrl(e.target.value)}
            placeholder="https://n8n.example.com/webhook/..."
            className={INPUT} />
        </div>
        <div>
          <label className={cn(LABEL, "mb-2")}>Métricas</label>
          <div className="flex flex-col gap-2">
            {p.metrics.map((m, i) => (
              <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-[var(--muted-foreground)]">Métrica {i + 1}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => moveMetric(i, -1)} disabled={i === 0}
                      className="grid size-5 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)] disabled:opacity-20">
                      <ChevronUp className="size-3" />
                    </button>
                    <button type="button" onClick={() => moveMetric(i, 1)} disabled={i === p.metrics.length - 1}
                      className="grid size-5 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)] disabled:opacity-20">
                      <ChevronDown className="size-3" />
                    </button>
                    <button type="button"
                      onClick={() => p.onMetrics(p.metrics.filter((_, idx) => idx !== i))}
                      className="grid size-6 place-items-center rounded text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={LABEL}>Key (JSON path)</label>
                    <input type="text" value={m.key}
                      onChange={(e) => updateMetric(i, "key", e.target.value)}
                      placeholder="kpis.reservas" className={INPUT_SM} />
                  </div>
                  <div>
                    <label className={LABEL}>Label</label>
                    <input type="text" value={m.label}
                      onChange={(e) => updateMetric(i, "label", e.target.value)}
                      placeholder="Reservas" className={INPUT_SM} />
                  </div>
                  <div>
                    <label className={LABEL}>Formato</label>
                    <select value={m.format}
                      onChange={(e) => updateMetric(i, "format", e.target.value)}
                      className={cn(INPUT_SM, "bg-[var(--card)]")}>
                      <option value="number">Número</option>
                      <option value="currency">Moeda</option>
                      <option value="percent">Percentagem</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Key de tendência (opcional)</label>
                    <input type="text" value={m.trendKey}
                      onChange={(e) => updateMetric(i, "trendKey", e.target.value)}
                      placeholder="kpis.reservas_delta" className={INPUT_SM} />
                  </div>
                  <div>
                    <label className={LABEL}>Prefixo (opcional)</label>
                    <input type="text" value={m.prefix}
                      onChange={(e) => updateMetric(i, "prefix", e.target.value)}
                      placeholder="€" className={INPUT_SM} />
                  </div>
                  <div>
                    <label className={LABEL}>Sufixo (opcional)</label>
                    <input type="text" value={m.suffix}
                      onChange={(e) => updateMetric(i, "suffix", e.target.value)}
                      placeholder="%" className={INPUT_SM} />
                  </div>
                </div>
              </div>
            ))}
            <button type="button"
              onClick={() => p.onMetrics([...p.metrics, { key: "", label: "", format: "number", prefix: "", suffix: "", trendKey: "" }])}
              className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--border)] px-3 py-2 text-sm text-[var(--muted-foreground)] hover:border-[var(--vd-blue-500)] hover:text-[var(--vd-blue-500)]">
              <Plus className="size-3.5" /> Adicionar métrica
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (p.type === "slack_channel") {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-4">
        <SectionHeader icon={Hash} label="Canal Slack" />
        <div>
          <label className={LABEL}>ID do canal</label>
          <input type="text" value={p.slackChannelId}
            onChange={(e) => p.onSlackChannelId(e.target.value)}
            placeholder="ex: C0B4DEZ73PE"
            className={INPUT} />
          <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
            Deixa em branco para usar o canal definido em SLACK_CHANNEL_ID no .env
          </p>
        </div>
        <div>
          <label className={LABEL}>Número de mensagens</label>
          <input type="number" min={1} max={50} value={p.slackLimit}
            onChange={(e) => p.onSlackLimit(Number(e.target.value))} className={INPUT} />
        </div>
      </div>
    );
  }

  return null;
}
