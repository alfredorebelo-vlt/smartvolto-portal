"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save, X, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Cat = {
  id: string; slug: string; label: string;
  color: string; bg: string; order: number; isActive: boolean;
};

type FormState = { label: string; color: string; bg: string };
const EMPTY: FormState = { label: "", color: "#1A56A8", bg: "#E6F1FB" };

export function AdminAnnouncementCategories() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Cat | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/announcement-categories");
    const d = await r.json();
    setCats(d.categories ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setForm(EMPTY); setCreating(true); }
  function openEdit(c: Cat) { setEditing(c); setForm({ label: c.label, color: c.color, bg: c.bg }); setCreating(false); }
  function cancel() { setEditing(null); setCreating(false); setForm(EMPTY); }

  async function save() {
    if (!form.label.trim()) return;
    setSaving(true);
    if (editing) {
      await fetch(`/api/admin/announcement-categories/${editing.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/admin/announcement-categories", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
    }
    setSaving(false);
    cancel();
    load();
  }

  async function toggle(c: Cat) {
    await fetch(`/api/admin/announcement-categories/${c.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    setCats((prev) => prev.map((x) => x.id === c.id ? { ...x, isActive: !x.isActive } : x));
  }

  async function del(c: Cat) {
    if (!confirm(`Eliminar categoria "${c.label}"? Os anúncios com esta categoria ficam sem categoria.`)) return;
    await fetch(`/api/admin/announcement-categories/${c.id}`, { method: "DELETE" });
    setCats((prev) => prev.filter((x) => x.id !== c.id));
  }

  async function move(idx: number, dir: -1 | 1) {
    const reordered = [...cats];
    const target = idx + dir;
    if (target < 0 || target >= reordered.length) return;
    [reordered[idx], reordered[target]] = [reordered[target], reordered[idx]];
    setCats(reordered);
    // persist individual orders
    await Promise.all(reordered.map((c, i) =>
      fetch(`/api/admin/announcement-categories/${c.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: i }),
      })
    ));
  }

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="m-0 text-base font-bold text-[var(--foreground)]">Categorias de anúncios</h3>
          <p className="m-0 mt-0.5 text-sm text-[var(--muted-foreground)]">
            Etiquetas que aparecem nos anúncios e nos filtros do Feed.
          </p>
        </div>
        <button type="button" onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-[var(--vd-blue-500)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          <Plus className="size-4" /> Nova categoria
        </button>
      </div>

      {/* Formulário */}
      {(creating || editing) && (
        <div className="rounded-xl border border-[var(--vd-blue-500)]/30 bg-[var(--muted)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--foreground)]">
              {editing ? "Editar categoria" : "Nova categoria"}
            </span>
            <button type="button" onClick={cancel}
              className="grid size-6 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--accent)]">
              <X className="size-3.5" />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Nome
              </label>
              <input type="text" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="ex: Formação" autoFocus
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Cor do texto
                </label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="h-9 w-10 cursor-pointer rounded border border-[var(--border)] bg-[var(--card)] p-0.5" />
                  <input type="text" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-2 font-mono text-xs focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Cor de fundo
                </label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.bg} onChange={(e) => setForm({ ...form, bg: e.target.value })}
                    className="h-9 w-10 cursor-pointer rounded border border-[var(--border)] bg-[var(--card)] p-0.5" />
                  <input type="text" value={form.bg} onChange={(e) => setForm({ ...form, bg: e.target.value })}
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-2 font-mono text-xs focus:outline-none" />
                </div>
              </div>
            </div>
            {/* Preview */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--muted-foreground)]">Preview:</span>
              <span className="rounded-full px-3 py-1 text-xs font-bold"
                style={{ background: form.bg, color: form.color }}>
                {form.label || "Categoria"}
              </span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={save} disabled={saving || !form.label.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--vd-blue-500)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                <Save className="size-3.5" />
                {saving ? "A guardar…" : editing ? "Guardar" : "Criar"}
              </button>
              <button type="button" onClick={cancel}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--accent)]">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--muted)]" />)}
        </div>
      ) : cats.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted-foreground)]">
          Sem categorias. Cria a primeira.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {cats.map((c, idx) => (
            <div key={c.id} className={cn(
              "flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3",
              !c.isActive && "opacity-50",
            )}>
              <GripVertical className="size-4 shrink-0 text-[var(--muted-foreground)]" />

              <span className="rounded-full px-3 py-1 text-xs font-bold shrink-0"
                style={{ background: c.bg, color: c.color }}>
                {c.label}
              </span>

              <span className="flex-1 font-mono text-[10px] text-[var(--muted-foreground)]">
                {c.slug}
              </span>

              <div className="flex items-center gap-1 shrink-0">
                <div className="flex flex-col">
                  <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0}
                    className="grid size-5 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)] disabled:opacity-20">
                    <ChevronUp className="size-3" />
                  </button>
                  <button type="button" onClick={() => move(idx, 1)} disabled={idx === cats.length - 1}
                    className="grid size-5 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)] disabled:opacity-20">
                    <ChevronDown className="size-3" />
                  </button>
                </div>
                <button type="button" onClick={() => toggle(c)} title={c.isActive ? "Desactivar" : "Activar"}
                  className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-colors",
                    c.isActive
                      ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                      : "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]")}>
                  {c.isActive ? "Activa" : "Inactiva"}
                </button>
                <button type="button" onClick={() => openEdit(c)}
                  className="grid size-7 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
                  <Pencil className="size-3.5" />
                </button>
                <button type="button" onClick={() => del(c)}
                  className="grid size-7 place-items-center rounded text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
