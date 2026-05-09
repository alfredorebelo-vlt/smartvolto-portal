"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Check, X, Calendar, GripVertical, ToggleLeft, ToggleRight } from "lucide-react";
import { confirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

type SharedCalendar = {
  id: string;
  name: string;
  calendarId: string;
  color: string;
  isActive: boolean;
  order: number;
};

const COLORS = [
  { label: "Azul", value: "#2e3c8f" },
  { label: "Laranja", value: "#f29220" },
  { label: "Verde", value: "#10b981" },
  { label: "Roxo", value: "#8b5cf6" },
  { label: "Vermelho", value: "#ef4444" },
  { label: "Ciano", value: "#06b6d4" },
];

export function AdminCalendars() {
  const [calendars, setCalendars] = useState<SharedCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // form novo
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCalId, setNewCalId] = useState("");
  const [newColor, setNewColor] = useState("#2e3c8f");
  const [saving, setSaving] = useState(false);

  // edição inline
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCalId, setEditCalId] = useState("");
  const [editColor, setEditColor] = useState("#2e3c8f");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/calendars");
      const d = await res.json();
      if (res.ok) setCalendars(d.calendars ?? []);
      else setError(d.error ?? "Erro ao carregar");
    } catch {
      setError("Erro de rede");
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!newName.trim() || !newCalId.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/calendars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, calendarId: newCalId, color: newColor }),
    });
    const d = await res.json();
    if (res.ok) {
      setCalendars((prev) => [...prev, d.calendar]);
      setNewName(""); setNewCalId(""); setNewColor("#2e3c8f"); setShowForm(false);
    } else {
      setError(d.error ?? "Erro ao criar");
    }
    setSaving(false);
  }

  async function handleUpdate(id: string, data: Partial<SharedCalendar>) {
    const res = await fetch(`/api/admin/calendars/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const d = await res.json();
    if (res.ok) {
      setCalendars((prev) => prev.map((c) => c.id === id ? { ...c, ...d.calendar } : c));
    } else {
      setError(d.error ?? "Erro ao atualizar");
    }
  }

  async function handleDelete(id: string) {
    if (!await confirm({ message: "Eliminar este calendário?", variant: "danger", confirmLabel: "Eliminar" })) return;
    const res = await fetch(`/api/admin/calendars/${id}`, { method: "DELETE" });
    if (res.ok) setCalendars((prev) => prev.filter((c) => c.id !== id));
    else setError("Erro ao eliminar");
  }

  function startEdit(cal: SharedCalendar) {
    setEditId(cal.id);
    setEditName(cal.name);
    setEditCalId(cal.calendarId);
    setEditColor(cal.color);
  }

  async function saveEdit() {
    if (!editId) return;
    await handleUpdate(editId, { name: editName, calendarId: editCalId, color: editColor });
    setEditId(null);
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="m-0 text-base font-bold text-[var(--foreground)]">Calendários Partilhados</h3>
          <p className="m-0 mt-1 text-sm text-[var(--muted-foreground)]">
            Gerir os calendários da empresa visíveis no separador "Agenda Volto Drive".
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-[var(--vd-blue-500)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          <Plus className="size-4" /> Adicionar
        </button>
      </div>

      {/* Formulário novo calendário */}
      {showForm && (
        <div className="rounded-xl border border-[var(--vd-blue-500)]/30 bg-[var(--vd-blue-50)] dark:bg-[var(--vd-blue-500)]/5 p-4 flex flex-col gap-3">
          <p className="m-0 text-sm font-semibold text-[var(--vd-blue-500)]">Novo calendário</p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--muted-foreground)]">Nome</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Férias da equipa"
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--vd-blue-500)]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--muted-foreground)]">ID do calendário Google</label>
              <input
                value={newCalId}
                onChange={(e) => setNewCalId(e.target.value)}
                placeholder="Ex: c_abc123@group.calendar.google.com"
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] font-mono outline-none focus:border-[var(--vd-blue-500)]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[var(--muted-foreground)]">Cor</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setNewColor(c.value)}
                  className={cn("size-7 rounded-full border-2 transition-transform hover:scale-110",
                    newColor === c.value ? "border-[var(--foreground)] scale-110" : "border-transparent")}
                  style={{ background: c.value }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <p className="m-0 text-[11px] text-[var(--muted-foreground)]">
              Encontra o ID em Google Calendar → calendário → Definições e partilha → "ID do calendário"
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving || !newName.trim() || !newCalId.trim()}
              className="flex items-center gap-2 rounded-lg bg-[var(--vd-blue-500)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              <Check className="size-4" /> Guardar
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setNewName(""); setNewCalId(""); }}
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            >
              <X className="size-4" /> Cancelar
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Lista de calendários */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--muted)]" />)}
        </div>
      ) : calendars.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--muted)] p-10 text-center">
          <Calendar className="mx-auto mb-2 size-7 text-[var(--muted-foreground)]" />
          <p className="text-sm font-semibold text-[var(--foreground)]">Sem calendários configurados</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">Clica "Adicionar" para configurar o primeiro calendário partilhado.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
          {calendars.map((cal) => (
            <div key={cal.id} className="flex items-center gap-3 px-4 py-3">
              <GripVertical className="size-4 shrink-0 text-[var(--muted-foreground)] opacity-40" />

              {editId === cal.id ? (
                /* Modo edição */
                <div className="flex flex-1 flex-col gap-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="rounded-lg border border-[var(--vd-blue-500)] bg-[var(--card)] px-3 py-1.5 text-sm outline-none"
                    />
                    <input
                      value={editCalId}
                      onChange={(e) => setEditCalId(e.target.value)}
                      className="rounded-lg border border-[var(--vd-blue-500)] bg-[var(--card)] px-3 py-1.5 text-xs font-mono outline-none"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    {COLORS.map((c) => (
                      <button key={c.value} type="button" title={c.label}
                        onClick={() => setEditColor(c.value)}
                        className={cn("size-5 rounded-full border-2 transition-transform hover:scale-110",
                          editColor === c.value ? "border-[var(--foreground)]" : "border-transparent")}
                        style={{ background: c.value }} />
                    ))}
                  </div>
                </div>
              ) : (
                /* Modo visualização */
                <div className="flex flex-1 items-center gap-3 min-w-0">
                  <span className="size-3 shrink-0 rounded-full" style={{ background: cal.color }} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("m-0 text-sm font-semibold truncate", !cal.isActive && "opacity-50 line-through")}>
                      {cal.name}
                    </p>
                    <p className="m-0 truncate text-[11px] font-mono text-[var(--muted-foreground)]">{cal.calendarId}</p>
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex shrink-0 items-center gap-1">
                {editId === cal.id ? (
                  <>
                    <button type="button" onClick={saveEdit}
                      className="grid size-7 place-items-center rounded-lg bg-[var(--vd-blue-500)] text-white hover:opacity-90">
                      <Check className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => setEditId(null)}
                      className="grid size-7 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
                      <X className="size-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" title={cal.isActive ? "Desativar" : "Ativar"}
                      onClick={() => handleUpdate(cal.id, { isActive: !cal.isActive })}
                      className="grid size-7 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
                      {cal.isActive
                        ? <ToggleRight className="size-4 text-[var(--vd-blue-500)]" />
                        : <ToggleLeft className="size-4" />}
                    </button>
                    <button type="button" title="Editar" onClick={() => startEdit(cal)}
                      className="grid size-7 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
                      <Pencil className="size-3.5" />
                    </button>
                    <button type="button" title="Eliminar" onClick={() => handleDelete(cal.id)}
                      className="grid size-7 place-items-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 className="size-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4 text-sm text-[var(--muted-foreground)]">
        <p className="m-0 font-semibold text-[var(--foreground)]">Como encontrar o ID do calendário</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs">
          <li>Abre <strong>Google Calendar</strong> em calendar.google.com</li>
          <li>No painel esquerdo, encontra o calendário em "Outros calendários"</li>
          <li>Clica nos <strong>três pontos</strong> → <strong>"Definições e partilha"</strong></li>
          <li>Desce até <strong>"Integrar calendário"</strong> e copia o <strong>"ID do calendário"</strong></li>
        </ol>
      </div>
    </div>
  );
}
