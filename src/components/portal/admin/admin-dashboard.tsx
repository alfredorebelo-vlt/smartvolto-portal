"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus, Pencil, Trash2, GripVertical, Eye, EyeOff,
  LayoutDashboard, ChevronDown, ChevronUp, Save, X, Link,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { confirm } from "@/components/ui/confirm-dialog";
import type { WidgetType } from "@/lib/dashboard/types";

type QuickLink = { label: string; url: string; color: string };

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

const WIDGET_TYPES: { value: WidgetType; label: string; description: string }[] = [
  { value: "announcements",   label: "Anúncios",          description: "Últimos anúncios da empresa" },
  { value: "birthdays",       label: "Aniversários",      description: "Próximos aniversários da equipa" },
  { value: "calendar_events", label: "Calendário",        description: "Próximos eventos do Google Calendar" },
  { value: "tasks",           label: "Tarefas",           description: "Tarefas do Google Tasks" },
  { value: "quick_links",     label: "Ações rápidas",     description: "Links configuráveis" },
  { value: "kpi_n8n",         label: "KPI via n8n/API",   description: "Métricas via webhook externo" },
  { value: "drive_recent",    label: "Drive (recentes)",  description: "Documentos recentes do Google Drive" },
  { value: "iframe_embed",    label: "Embed externo",     description: "Página ou dashboard em iframe" },
];

const COL_LABELS: Record<number, string> = { 1: "Coluna principal (2/3)", 2: "Coluna lateral (1/3)" };

export function AdminDashboard() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Widget | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/dashboard");
    const data = await res.json();
    setWidgets(data.widgets ?? []);
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
                    onToggle={() => toggleActive(w)}
                    onEdit={() => setEditing(w)}
                    onDelete={() => deleteWidget(w.id)}
                    onMoveUp={idx > 0 ? () => handleReorder(items, idx, idx - 1) : undefined}
                    onMoveDown={idx < items.length - 1 ? () => handleReorder(items, idx, idx + 1) : undefined}
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
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={load}
        />
      )}
    </div>
  );
}

/* ---- Widget Card ---- */

function WidgetCard({
  widget, idx: _idx, total: _total, onToggle, onEdit, onDelete, onMoveUp, onMoveDown,
}: {
  widget: Widget;
  idx: number;
  total: number;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const typeMeta = WIDGET_TYPES.find((t) => t.value === widget.type);

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 transition-opacity",
      !widget.isActive && "opacity-50",
    )}>
      <GripVertical className="size-4 shrink-0 cursor-grab text-[var(--muted-foreground)]" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--foreground)] truncate">{widget.title}</span>
          <span className="shrink-0 rounded-full bg-[var(--muted)] px-2 py-px text-[10px] font-medium text-[var(--muted-foreground)]">
            {typeMeta?.label ?? widget.type}
          </span>
        </div>
        <div className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
          {typeMeta?.description} · cache {widget.cacheTtl}s
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
  widget, onClose, onSaved,
}: {
  widget?: Widget;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!widget;
  const [type, setType] = useState<WidgetType>(widget?.type ?? "announcements");
  const [title, setTitle] = useState(widget?.title ?? "");
  const [col, setCol] = useState(widget?.col ?? 1);
  const [isActive, setIsActive] = useState(widget?.isActive ?? true);
  const [cacheTtl, setCacheTtl] = useState(widget?.cacheTtl ?? 300);
  const [configText, setConfigText] = useState(
    JSON.stringify(widget?.config ?? getDefaultConfig(widget?.type ?? "announcements"), null, 2)
  );
  const [links, setLinks] = useState<QuickLink[]>(() => {
    const cfg = widget?.config as { links?: QuickLink[] } | undefined;
    return cfg?.links ?? [{ label: "", url: "https://", color: "#2e3c8f" }];
  });
  const [configError, setConfigError] = useState("");
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  function handleTypeChange(t: WidgetType) {
    setType(t);
    if (!isEdit) setConfigText(JSON.stringify(getDefaultConfig(t), null, 2));
  }

  function validateConfig(): Record<string, unknown> | null {
    if (type === "quick_links") {
      if (links.some((l) => !l.label.trim() || !l.url.trim())) {
        setConfigError("Todos os links precisam de nome e URL");
        return null;
      }
      setConfigError("");
      return { links: links.map((l) => ({ ...l, icon: "link" })) };
    }
    try {
      const parsed = JSON.parse(configText);
      setConfigError("");
      return parsed;
    } catch {
      setConfigError("JSON inválido");
      return null;
    }
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
      body: JSON.stringify({ type, title: title.trim(), config, col, isActive, cacheTtl }),
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  function addLink() {
    setLinks((prev) => [...prev, { label: "", url: "https://", color: "#2e3c8f" }]);
  }

  function removeLink(i: number) {
    setLinks((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateLink(i: number, field: keyof QuickLink, value: string) {
    setLinks((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  }

  function moveLink(i: number, dir: -1 | 1) {
    setLinks((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
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

          {/* Editor visual de links — só para quick_links */}
          {type === "quick_links" ? (
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Links</label>
              <div className="flex flex-col gap-2">
                {links.map((link, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] p-2">
                    <div className="flex flex-col gap-1">
                      <button type="button" onClick={() => moveLink(i, -1)} disabled={i === 0}
                        className="grid size-5 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--accent)] disabled:opacity-20">
                        <ChevronUp className="size-3" />
                      </button>
                      <button type="button" onClick={() => moveLink(i, 1)} disabled={i === links.length - 1}
                        className="grid size-5 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--accent)] disabled:opacity-20">
                        <ChevronDown className="size-3" />
                      </button>
                    </div>
                    <input
                      type="color"
                      value={link.color}
                      onChange={(e) => updateLink(i, "color", e.target.value)}
                      className="size-8 shrink-0 cursor-pointer rounded border border-[var(--border)] bg-transparent p-0.5"
                      title="Cor do ícone"
                    />
                    <div className="flex flex-1 flex-col gap-1 min-w-0">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateLink(i, "label", e.target.value)}
                        placeholder="Nome do link"
                        className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)]/30"
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateLink(i, "url", e.target.value)}
                        placeholder="https://"
                        className="w-full rounded border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-xs text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]/30"
                      />
                    </div>
                    <button type="button" onClick={() => removeLink(i)}
                      className="grid size-7 shrink-0 place-items-center rounded text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addLink}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--border)] px-3 py-2 text-sm text-[var(--muted-foreground)] hover:border-[var(--vd-blue-500)] hover:text-[var(--vd-blue-500)]">
                  <Link className="size-3.5" />
                  Adicionar link
                </button>
              </div>
            </div>
          ) : (
            /* Config JSON — para todos os outros tipos */
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Configuração (JSON)
              </label>
              <textarea
                value={configText}
                onChange={(e) => { setConfigText(e.target.value); setConfigError(""); }}
                rows={8}
                spellCheck={false}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
              />
              <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                <ConfigHint type={type} />
              </p>
            </div>
          )}

          {configError && <p className="text-xs text-red-500">{configError}</p>}

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

/* ---- Helpers ---- */

function getDefaultConfig(type: WidgetType): Record<string, unknown> {
  switch (type) {
    case "announcements":   return { limit: 3 };
    case "birthdays":       return { limit: 3 };
    case "calendar_events": return { calendarIds: [], daysAhead: 7, maxEvents: 5 };
    case "tasks":           return { showCompleted: false, maxTasks: 10 };
    case "quick_links":     return { links: [{ label: "Exemplo", url: "https://", icon: "link", color: "#2e3c8f" }] };
    case "kpi_n8n":         return {
      webhookUrl: "https://n8n.example.com/webhook/dashboard-kpis",
      metrics: [
        { key: "reservas", label: "Reservas", format: "number", trendKey: "reservas_delta" },
        { key: "receita",  label: "Receita",  format: "currency", prefix: "€" },
      ],
    };
    case "drive_recent":    return { folderId: "", limit: 5 };
    case "iframe_embed":    return { url: "https://", height: 300 };
    default:                return {};
  }
}

function ConfigHint({ type }: { type: WidgetType }) {
  const hints: Record<WidgetType, string> = {
    announcements:   "limit — número de anúncios a mostrar",
    birthdays:       "limit — número de próximos aniversários a mostrar (padrão: 3)",
    calendar_events: "calendarIds (array de IDs do Google Calendar), daysAhead, maxEvents",
    tasks:           "showCompleted — mostrar tarefas concluídas; maxTasks — máximo de tarefas a mostrar",
    quick_links:     "links — array de { label, url, icon, color? }",
    kpi_n8n:         "webhookUrl — URL do webhook n8n; metrics — array de { key, label, format, prefix?, suffix?, trendKey? }",
    drive_recent:    "folderId (opcional) — ID da pasta Drive; limit — número de ficheiros",
    iframe_embed:    "url — URL a incorporar; height — altura em px",
  };
  return <>{hints[type]}</>;
}
