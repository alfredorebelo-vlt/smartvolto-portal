"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { GripVertical, Save, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Home, Megaphone, Calendar, Users, Folder, BookOpen, LayoutGrid,
} from "lucide-react";

type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  locked?: boolean; // home e admin nunca saem
};

const ALL_NAV: NavItem[] = [
  { id: "home",     label: "Home",             icon: Home,        locked: true },
  { id: "feed",     label: "Anúncios",         icon: Megaphone },
  { id: "calendar", label: "Calendário",       icon: Calendar },
  { id: "people",   label: "Pessoas",          icon: Users },
  { id: "docs",     label: "Documentos",       icon: Folder },
  { id: "manual",   label: "Manual operações", icon: BookOpen },
  { id: "tools",    label: "Smart Tools",      icon: LayoutGrid },
];

const DEFAULT_ORDER = ALL_NAV.map((i) => i.id);

export function AdminNavOrder() {
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const dragSrc = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings?key=nav_order")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.value)) setOrder(d.value);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const handleDragStart = useCallback((idx: number) => {
    dragSrc.current = idx;
  }, []);

  const handleDragOver = useCallback((idx: number) => {
    setDragOver(idx);
  }, []);

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

  const handleDragEnd = useCallback(() => {
    dragSrc.current = null;
    setDragOver(null);
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "nav_order", value: order }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function reset() {
    setOrder(DEFAULT_ORDER);
    setSaved(false);
  }

  const items = order
    .map((id) => ALL_NAV.find((n) => n.id === id))
    .filter(Boolean) as NavItem[];

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <div>
        <h3 className="m-0 text-base font-bold text-[var(--foreground)]">Ordem da navegação</h3>
        <p className="m-0 mt-0.5 text-sm text-[var(--muted-foreground)]">
          Arrasta para reordenar os itens do menu lateral. A ordem é aplicada a todos os utilizadores.
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
            return (
              <div
                key={item.id}
                draggable={!item.locked}
                onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; handleDragStart(idx); }}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; handleDragOver(idx); }}
                onDrop={(e) => { e.preventDefault(); handleDrop(idx); }}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center gap-3 rounded-xl border bg-[var(--card)] px-4 py-3 transition-all",
                  dragOver === idx ? "border-[var(--vd-blue-500)] shadow-md scale-[1.01]" : "border-[var(--border)]",
                  item.locked && "opacity-60",
                )}
              >
                <GripVertical className={cn(
                  "size-4 shrink-0 text-[var(--muted-foreground)]",
                  item.locked ? "cursor-not-allowed opacity-30" : "cursor-grab",
                )} />
                <Icon className="size-4 shrink-0 text-[var(--muted-foreground)]" />
                <span className="flex-1 text-sm font-medium text-[var(--foreground)]">{item.label}</span>
                {item.locked && (
                  <span className="rounded-full bg-[var(--muted)] px-2 py-px text-[10px] font-semibold text-[var(--muted-foreground)]">
                    fixo
                  </span>
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
          {saving ? "A guardar…" : saved ? "Guardado!" : "Guardar ordem"}
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
