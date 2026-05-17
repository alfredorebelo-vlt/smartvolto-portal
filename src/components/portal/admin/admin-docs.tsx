"use client";

import { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, FolderOpen, FileText,
  X, ChevronDown, ChevronRight, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { confirm } from "@/components/ui/confirm-dialog";

type Role = { id: string; name: string };

type DocArea = {
  id: string; name: string; slug: string; description: string | null;
  color: string; isActive: boolean; order: number; roleIds: string[];
  _count: { entries: number };
};

type DocEntry = {
  id: string; areaId: string; title: string; description: string | null;
  driveFileId: string | null; driveUrl: string; embedType: string;
  isActive: boolean; order: number; roleIds: string[];
  area: { id: string; name: string; slug: string };
};

const EMBED_TYPES = [
  { value: "none",   label: "Só link (sem embed)" },
  { value: "iframe", label: "Iframe genérico" },
  { value: "sheets", label: "Google Sheets" },
  { value: "docs",   label: "Google Docs" },
  { value: "slides", label: "Google Slides" },
];

const AREA_COLORS = [
  "#2e3c8f", "#f29220", "#1f9d55", "#d7263d",
  "#5a6bba", "#ffc429", "#6d28d9", "#0891b2",
];

/* ─── Main ─── */

export function AdminDocs() {
  const [areas, setAreas] = useState<DocArea[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [areaEntries, setAreaEntries] = useState<Record<string, DocEntry[]>>({});
  const [loadingEntries, setLoadingEntries] = useState<string | null>(null);

  const [areaForm, setAreaForm] = useState<Partial<DocArea> | null>(null);
  const [entryForm, setEntryForm] = useState<Partial<DocEntry> | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadAreas() {
    setLoading(true);
    setLoadError(null);
    try {
      const [ar, rr] = await Promise.all([
        fetch("/api/admin/docs/areas"),
        fetch("/api/admin/roles"),
      ]);
      if (!ar.ok) {
        const e = await ar.json().catch(() => ({}));
        setLoadError(e.error ?? `Erro ${ar.status} ao carregar áreas`);
        setLoading(false);
        return;
      }
      const ad = await ar.json();
      const rd = await rr.json();
      setAreas(ad.areas ?? []);
      setRoles(rd.roles ?? []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Erro de rede");
    }
    setLoading(false);
  }

  useEffect(() => { loadAreas(); }, []);

  async function loadEntries(areaId: string) {
    setLoadingEntries(areaId);
    const res = await fetch(`/api/admin/docs/entries?areaId=${areaId}`);
    const d = await res.json();
    setAreaEntries((prev) => ({ ...prev, [areaId]: d.entries ?? [] }));
    setLoadingEntries(null);
  }

  function toggleExpand(areaId: string) {
    if (expandedArea === areaId) {
      setExpandedArea(null);
    } else {
      setExpandedArea(areaId);
      if (!areaEntries[areaId]) loadEntries(areaId);
    }
  }

  /* ── Area CRUD ── */

  async function saveArea() {
    if (!areaForm?.name?.trim()) return;
    setSaving(true);
    if (areaForm.id) {
      const res = await fetch(`/api/admin/docs/areas/${areaForm.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(areaForm),
      });
      if (res.ok) {
        const d = await res.json();
        setAreas((prev) => prev.map((a) => a.id === areaForm.id ? { ...a, ...d.area } : a));
        setAreaForm(null);
      }
    } else {
      const res = await fetch("/api/admin/docs/areas", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(areaForm),
      });
      if (res.ok) {
        const d = await res.json();
        setAreas((prev) => [...prev, { ...d.area, _count: { entries: 0 } }]);
        setAreaForm(null);
      }
    }
    setSaving(false);
  }

  async function toggleAreaActive(area: DocArea) {
    await fetch(`/api/admin/docs/areas/${area.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !area.isActive }),
    });
    setAreas((prev) => prev.map((a) => a.id === area.id ? { ...a, isActive: !a.isActive } : a));
  }

  async function deleteArea(area: DocArea) {
    if (!await confirm({ message: `Apagar a área "${area.name}" e todos os seus documentos?`, variant: "danger", confirmLabel: "Apagar" })) return;
    const res = await fetch(`/api/admin/docs/areas/${area.id}`, { method: "DELETE" });
    if (res.ok) {
      setAreas((prev) => prev.filter((a) => a.id !== area.id));
      setAreaEntries((prev) => { const n = { ...prev }; delete n[area.id]; return n; });
      if (expandedArea === area.id) setExpandedArea(null);
    }
  }

  /* ── Entry CRUD ── */

  async function saveEntry() {
    if (!entryForm?.title?.trim() || !entryForm?.driveUrl?.trim() || !entryForm?.areaId) return;
    setSaving(true);
    if (entryForm.id) {
      const res = await fetch(`/api/admin/docs/entries/${entryForm.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryForm),
      });
      if (res.ok) {
        const d = await res.json();
        const aId = d.entry.areaId;
        setAreaEntries((prev) => ({
          ...prev,
          [aId]: (prev[aId] ?? []).map((e) => e.id === d.entry.id ? d.entry : e),
        }));
        setEntryForm(null);
      }
    } else {
      const res = await fetch("/api/admin/docs/entries", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryForm),
      });
      if (res.ok) {
        const d = await res.json();
        const aId = d.entry.areaId;
        setAreaEntries((prev) => ({
          ...prev,
          [aId]: [...(prev[aId] ?? []), d.entry],
        }));
        setAreas((prev) => prev.map((a) =>
          a.id === aId ? { ...a, _count: { entries: a._count.entries + 1 } } : a
        ));
        setEntryForm(null);
      }
    }
    setSaving(false);
  }

  async function toggleEntryActive(entry: DocEntry) {
    await fetch(`/api/admin/docs/entries/${entry.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !entry.isActive }),
    });
    setAreaEntries((prev) => ({
      ...prev,
      [entry.areaId]: (prev[entry.areaId] ?? []).map((e) =>
        e.id === entry.id ? { ...e, isActive: !e.isActive } : e
      ),
    }));
  }

  async function deleteEntry(entry: DocEntry) {
    if (!await confirm({ message: `Apagar "${entry.title}"?`, variant: "danger", confirmLabel: "Apagar" })) return;
    const res = await fetch(`/api/admin/docs/entries/${entry.id}`, { method: "DELETE" });
    if (res.ok) {
      setAreaEntries((prev) => ({
        ...prev,
        [entry.areaId]: (prev[entry.areaId] ?? []).filter((e) => e.id !== entry.id),
      }));
      setAreas((prev) => prev.map((a) =>
        a.id === entry.areaId ? { ...a, _count: { entries: Math.max(0, a._count.entries - 1) } } : a
      ));
    }
  }

  /* ── Render ── */

  if (loading) return <LoadingSkeleton />;

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:bg-red-900/20">
        <p className="text-sm font-semibold text-red-700 dark:text-red-400">Erro ao carregar documentos</p>
        <p className="mt-1 text-xs text-red-600 dark:text-red-300">{loadError}</p>
        <button type="button" onClick={loadAreas} className="mt-3 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">Documentos Internos</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Gerir áreas e documentos da biblioteca interna</p>
        </div>
        <button type="button" onClick={() => setAreaForm({ color: "#2e3c8f", isActive: true, roleIds: [] })}
          className="flex items-center gap-2 rounded-lg bg-[var(--vd-blue-500)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
          <Plus className="size-4" /> Nova área
        </button>
      </div>

      {/* Lista de áreas */}
      {areas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
          <FolderOpen className="mx-auto mb-3 size-8 text-[var(--muted-foreground)]" />
          <p className="text-sm font-semibold text-[var(--foreground)]">Sem áreas criadas</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">Cria uma área para começar a catalogar documentos.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {areas.map((area) => (
            <div key={area.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
              {/* Cabeçalho da área */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button type="button" onClick={() => toggleExpand(area.id)}
                  className="flex flex-1 items-center gap-3 text-left min-w-0">
                  <span className="size-3 shrink-0 rounded-full" style={{ background: area.color }} />
                  {expandedArea === area.id
                    ? <ChevronDown className="size-4 shrink-0 text-[var(--muted-foreground)]" />
                    : <ChevronRight className="size-4 shrink-0 text-[var(--muted-foreground)]" />}
                  <span className="truncate font-semibold text-[var(--foreground)]">{area.name}</span>
                  <span className="shrink-0 rounded-full bg-[var(--muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--muted-foreground)]">
                    {area._count.entries} docs
                  </span>
                  {(area.roleIds as string[]).length > 0 && (
                    <span title="Restrito por role" className="shrink-0">
                      <ShieldCheck className="size-3.5 text-[var(--vd-orange-500)]" />
                    </span>
                  )}
                  {!area.isActive && (
                    <span className="shrink-0 rounded-full bg-[var(--muted)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">inativo</span>
                  )}
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => setEntryForm({ areaId: area.id, embedType: "none", isActive: true, roleIds: [] })}
                    title="Adicionar documento"
                    className="grid size-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
                    <Plus className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => setAreaForm({ ...area })}
                    className="grid size-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
                    <Pencil className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => toggleAreaActive(area)}
                    className="grid size-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
                    {area.isActive ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                  </button>
                  <button type="button" onClick={() => deleteArea(area)}
                    className="grid size-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Entradas da área */}
              {expandedArea === area.id && (
                <div className="border-t border-[var(--border)]">
                  {loadingEntries === area.id ? (
                    <div className="px-6 py-4 text-xs text-[var(--muted-foreground)]">A carregar…</div>
                  ) : (areaEntries[area.id] ?? []).length === 0 ? (
                    <div className="px-6 py-4 text-center text-xs text-[var(--muted-foreground)]">
                      Sem documentos nesta área.{" "}
                      <button type="button" onClick={() => setEntryForm({ areaId: area.id, embedType: "none", isActive: true, roleIds: [] })}
                        className="font-semibold text-[var(--vd-blue-500)] hover:underline">
                        Adicionar
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--border)]">
                      {(areaEntries[area.id] ?? []).map((entry) => (
                        <div key={entry.id} className="flex items-center gap-3 px-6 py-2.5">
                          <FileText className="size-3.5 shrink-0 text-[var(--muted-foreground)]" />
                          <div className="flex-1 min-w-0">
                            <span className={cn("truncate text-sm font-medium", !entry.isActive && "opacity-50")}>
                              {entry.title}
                            </span>
                            {entry.embedType !== "none" && (
                              <span className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-[var(--vd-blue-50)] text-[var(--vd-blue-500)]">
                                {entry.embedType}
                              </span>
                            )}
                            {(entry.roleIds as string[]).length > 0 && (
                              <ShieldCheck className="ml-1.5 inline size-3 text-[var(--vd-orange-500)]" />
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button type="button" onClick={() => setEntryForm({ ...entry })}
                              className="grid size-7 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
                              <Pencil className="size-3" />
                            </button>
                            <button type="button" onClick={() => toggleEntryActive(entry)}
                              className="grid size-7 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
                              {entry.isActive ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                            </button>
                            <button type="button" onClick={() => deleteEntry(entry)}
                              className="grid size-7 place-items-center rounded text-[var(--muted-foreground)] hover:text-red-600">
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal área */}
      {areaForm !== null && (
        <AreaFormModal
          form={areaForm}
          roles={roles}
          saving={saving}
          onChange={setAreaForm}
          onSave={saveArea}
          onClose={() => setAreaForm(null)}
        />
      )}

      {/* Modal entrada */}
      {entryForm !== null && (
        <EntryFormModal
          form={entryForm}
          areas={areas}
          roles={roles}
          saving={saving}
          onChange={setEntryForm}
          onSave={saveEntry}
          onClose={() => setEntryForm(null)}
        />
      )}
    </div>
  );
}

/* ─── Modal: Área ─── */

function AreaFormModal({ form, roles, saving, onChange, onSave, onClose }: {
  form: Partial<DocArea>;
  roles: Role[];
  saving: boolean;
  onChange: (f: Partial<DocArea>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-bold text-[var(--foreground)]">{form.id ? "Editar área" : "Nova área"}</h3>
          <button type="button" onClick={onClose} className="grid size-7 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">Nome *</label>
            <input value={form.name ?? ""} onChange={(e) => onChange({ ...form, name: e.target.value })}
              placeholder="ex: Financeiro"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">Descrição</label>
            <input value={form.description ?? ""} onChange={(e) => onChange({ ...form, description: e.target.value })}
              placeholder="Descrição opcional"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30" />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-[var(--foreground)]">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {AREA_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => onChange({ ...form, color: c })}
                  className={cn("size-7 rounded-full border-2 transition-transform hover:scale-110",
                    form.color === c ? "border-[var(--foreground)] scale-110" : "border-transparent")}
                  style={{ background: c }} />
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
              <ShieldCheck className="mr-1 inline size-3 text-[var(--vd-orange-500)]" />
              Roles com acesso (vazio = todos)
            </label>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => {
                const selected = (form.roleIds ?? []).includes(r.id);
                return (
                  <button key={r.id} type="button"
                    onClick={() => onChange({
                      ...form,
                      roleIds: selected
                        ? (form.roleIds ?? []).filter((id) => id !== r.id)
                        : [...(form.roleIds ?? []), r.id],
                    })}
                    className={cn("rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                      selected
                        ? "border-[var(--vd-blue-500)] bg-[var(--vd-blue-500)] text-white"
                        : "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] hover:border-[var(--vd-blue-500)]")}>
                    {r.name}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive ?? true}
              onChange={(e) => onChange({ ...form, isActive: e.target.checked })}
              className="size-4 rounded accent-[var(--vd-blue-500)]" />
            <span className="font-medium text-[var(--foreground)]">Área ativa</span>
          </label>
        </div>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onSave} disabled={saving || !form.name?.trim()}
            className="flex-1 rounded-lg bg-[var(--vd-blue-500)] py-2 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90">
            {saving ? "A guardar…" : form.id ? "Guardar" : "Criar área"}
          </button>
          <button type="button" onClick={onClose}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal: Entrada ─── */

function EntryFormModal({ form, areas, roles, saving, onChange, onSave, onClose }: {
  form: Partial<DocEntry>;
  areas: DocArea[];
  roles: Role[];
  saving: boolean;
  onChange: (f: Partial<DocEntry>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-bold text-[var(--foreground)]">{form.id ? "Editar documento" : "Novo documento"}</h3>
          <button type="button" onClick={onClose} className="grid size-7 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">Título *</label>
              <input value={form.title ?? ""} onChange={(e) => onChange({ ...form, title: e.target.value })}
                placeholder="Nome do documento"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">Área *</label>
              <select value={form.areaId ?? ""} onChange={(e) => onChange({ ...form, areaId: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30">
                <option value="">Selecionar…</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">Descrição</label>
            <input value={form.description ?? ""} onChange={(e) => onChange({ ...form, description: e.target.value })}
              placeholder="Descrição curta (opcional)"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">URL da Drive *</label>
            <input value={form.driveUrl ?? ""} onChange={(e) => onChange({ ...form, driveUrl: e.target.value })}
              placeholder="https://docs.google.com/…"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">Tipo de embed</label>
              <select value={form.embedType ?? "none"} onChange={(e) => onChange({ ...form, embedType: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30">
                {EMBED_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">ID do ficheiro (opcional)</label>
              <input value={form.driveFileId ?? ""} onChange={(e) => onChange({ ...form, driveFileId: e.target.value })}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30" />
            </div>
          </div>

          {form.embedType !== "none" && (
            <p className="rounded-lg bg-[var(--vd-blue-50)] px-3 py-2 text-xs text-[var(--vd-blue-500)]">
              O documento será exibido inline no portal. Certifica-te que a partilha da Drive permite "Qualquer pessoa com o link".
            </p>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--foreground)]">
              <ShieldCheck className="mr-1 inline size-3 text-[var(--vd-orange-500)]" />
              Roles com acesso (vazio = herda da área)
            </label>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => {
                const selected = (form.roleIds ?? []).includes(r.id);
                return (
                  <button key={r.id} type="button"
                    onClick={() => onChange({
                      ...form,
                      roleIds: selected
                        ? (form.roleIds ?? []).filter((id) => id !== r.id)
                        : [...(form.roleIds ?? []), r.id],
                    })}
                    className={cn("rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                      selected
                        ? "border-[var(--vd-blue-500)] bg-[var(--vd-blue-500)] text-white"
                        : "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] hover:border-[var(--vd-blue-500)]")}>
                    {r.name}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive ?? true}
              onChange={(e) => onChange({ ...form, isActive: e.target.checked })}
              className="size-4 rounded accent-[var(--vd-blue-500)]" />
            <span className="font-medium text-[var(--foreground)]">Documento ativo</span>
          </label>
        </div>

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onSave}
            disabled={saving || !form.title?.trim() || !form.driveUrl?.trim() || !form.areaId}
            className="flex-1 rounded-lg bg-[var(--vd-blue-500)] py-2 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90">
            {saving ? "A guardar…" : form.id ? "Guardar" : "Criar documento"}
          </button>
          <button type="button" onClick={onClose}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--muted)]" />
      ))}
    </div>
  );
}
