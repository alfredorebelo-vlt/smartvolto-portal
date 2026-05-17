"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { GripVertical, Save, RotateCcw, Check, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Home, Megaphone, Calendar, Users, Folder, BookOpen, LayoutGrid,
} from "lucide-react";

type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  locked?: boolean;
};

type Role = { id: string; name: string };

const ALL_NAV: NavItem[] = [
  { id: "home",     label: "Home",             icon: Home,        locked: true },
  { id: "feed",     label: "Anúncios",         icon: Megaphone },
  { id: "calendar", label: "Calendário",       icon: Calendar },
  { id: "people",   label: "Pessoas",          icon: Users },
  { id: "docs",     label: "Docs Internos",    icon: Folder },
  { id: "manual",   label: "Manual operações", icon: BookOpen },
  { id: "tools",    label: "Smart Tools",      icon: LayoutGrid },
];

const DEFAULT_ORDER = ALL_NAV.map((i) => i.id);
const DEFAULT_ROLES: Record<string, string[]> = {};

export function AdminNavOrder() {
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER);
  const [navRoles, setNavRoles] = useState<Record<string, string[]>>(DEFAULT_ROLES);
  const [roles, setRoles] = useState<Role[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const dragSrc = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/settings?key=nav_order").then((r) => r.json()),
      fetch("/api/admin/settings?key=nav_roles").then((r) => r.json()),
      fetch("/api/admin/roles").then((r) => r.json()),
    ]).then(([orderData, rolesData, allRoles]) => {
      if (Array.isArray(orderData.value)) setOrder(orderData.value);
      if (rolesData.value && typeof rolesData.value === "object") setNavRoles(rolesData.value as Record<string, string[]>);
      setRoles(allRoles.roles ?? []);
    }).catch(() => null).finally(() => setLoading(false));
  }, []);

  const handleDragStart = useCallback((idx: number) => { dragSrc.current = idx; }, []);
  const handleDragOver  = useCallback((idx: number) => { setDragOver(idx); }, []);
  const handleDragEnd   = useCallback(() => { dragSrc.current = null; setDragOver(null); }, []);

  const handleDrop = useCallback((toIdx: number) => {
    const from = dragSrc.current;
    if (from === null || from === toIdx) { setDragOver(null); return; }
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(toIdx, 0, moved);
    setOrder(next);
    setSaved(false);
    dragSrc.current = null;
    setDragOver(null);
  }, [order]);

  function toggleRole(navId: string, roleId: string) {
    setNavRoles((prev) => {
      const current = prev[navId] ?? [];
      const next = current.includes(roleId)
        ? current.filter((x) => x !== roleId)
        : [...current, roleId];
      return { ...prev, [navId]: next };
    });
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await Promise.all([
      fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "nav_order", value: order }),
      }),
      fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "nav_roles", value: navRoles }),
      }),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function reset() {
    setOrder(DEFAULT_ORDER);
    setNavRoles(DEFAULT_ROLES);
    setSaved(false);
  }

  const items = order
    .map((id) => ALL_NAV.find((n) => n.id === id))
    .filter(Boolean) as NavItem[];

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h3 className="m-0 text-base font-bold text-[var(--foreground)]">Navegação</h3>
        <p className="m-0 mt-0.5 text-sm text-[var(--muted-foreground)]">
          Arrasta para reordenar. Clica num item para definir quais roles o vêem.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-[var(--muted)]" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, idx) => {
            const Icon = item.icon;
            const itemRoles = navRoles[item.id] ?? [];
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-xl border bg-[var(--card)] transition-all",
                  dragOver === idx ? "border-[var(--vd-blue-500)] shadow-md scale-[1.01]" : "border-[var(--border)]",
                )}
              >
                {/* Row principal */}
                <div
                  draggable={!item.locked}
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; handleDragStart(idx); }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; handleDragOver(idx); }}
                  onDrop={(e) => { e.preventDefault(); handleDrop(idx); }}
                  onDragEnd={handleDragEnd}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <GripVertical className={cn(
                    "size-4 shrink-0 text-[var(--muted-foreground)]",
                    item.locked ? "cursor-not-allowed opacity-30" : "cursor-grab",
                  )} />
                  <Icon className="size-4 shrink-0 text-[var(--muted-foreground)]" />
                  <span className="flex-1 text-sm font-medium text-[var(--foreground)]">{item.label}</span>

                  {/* Sumário de roles */}
                  {!item.locked && (
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                        itemRoles.length > 0
                          ? "border-[var(--vd-blue-500)]/30 bg-[var(--vd-blue-500)]/8 text-[var(--vd-blue-500)]"
                          : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--vd-blue-500)]/40",
                      )}
                    >
                      {itemRoles.length > 0
                        ? `${itemRoles.length} role${itemRoles.length !== 1 ? "s" : ""}`
                        : "Todos"}
                    </button>
                  )}

                  {item.locked && (
                    <span className="rounded-full bg-[var(--muted)] px-2 py-px text-[10px] font-semibold text-[var(--muted-foreground)]">
                      fixo
                    </span>
                  )}
                </div>

                {/* Painel de roles expandido */}
                {isExpanded && !item.locked && (
                  <div className="border-t border-[var(--border)] px-4 pb-4 pt-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                      Visível para
                    </p>
                    {roles.length === 0 ? (
                      <p className="text-xs text-[var(--muted-foreground)]">Sem roles configuradas.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {roles.map((role) => {
                          const active = itemRoles.includes(role.id);
                          return (
                            <button
                              key={role.id}
                              type="button"
                              onClick={() => toggleRole(item.id, role.id)}
                              className={cn(
                                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                                active
                                  ? "border-[var(--vd-blue-500)] bg-[var(--vd-blue-500)]/10 text-[var(--vd-blue-500)]"
                                  : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--vd-blue-500)]/50",
                              )}
                            >
                              {active && <Check className="size-3" />}
                              {role.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {itemRoles.length === 0 && (
                      <p className="mt-2 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                        <ShieldAlert className="size-3" />
                        Sem restrição — visível a todos os utilizadores autenticados
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--vd-blue-500)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Save className="size-3.5" />
          {saving ? "A guardar…" : saved ? "Guardado!" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]"
        >
          <RotateCcw className="size-3.5" />
          Repor padrão
        </button>
      </div>
    </div>
  );
}
