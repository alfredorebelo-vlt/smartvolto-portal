"use client";

import { useEffect, useRef, useState } from "react";
import { confirm } from "@/components/ui/confirm-dialog";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, GripVertical,
  Upload, X, Save, ChevronUp, ChevronDown, LayoutGrid, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Role = { id: string; name: string };

type ToolMeta = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  order: number;
  roleIds: string[];
};

type ToolFull = ToolMeta & { content: string };

export function AdminTools() {
  const [tools, setTools] = useState<ToolMeta[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ToolFull | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const [tr, rr] = await Promise.all([
      fetch("/api/admin/tools"),
      fetch("/api/admin/roles"),
    ]);
    const td = await tr.json();
    const rd = await rr.json();
    setTools(td.tools ?? []);
    setRoles(rd.roles ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function openEdit(t: ToolMeta) {
    const res = await fetch(`/api/admin/tools/${t.id}`);
    const d = await res.json();
    setEditing(d.tool);
  }

  async function toggleActive(t: ToolMeta) {
    await fetch(`/api/admin/tools/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    setTools((prev) => prev.map((x) => x.id === t.id ? { ...x, isActive: !x.isActive } : x));
  }

  async function deleteTool(id: string) {
    if (!await confirm({ message: "Eliminar ferramenta permanentemente?", variant: "danger", confirmLabel: "Eliminar" })) return;
    await fetch(`/api/admin/tools/${id}`, { method: "DELETE" });
    setTools((prev) => prev.filter((x) => x.id !== id));
  }

  async function reorder(ids: string[]) {
    await fetch("/api/admin/tools/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
  }

  function move(idx: number, dir: -1 | 1) {
    const reordered = [...tools];
    const target = idx + dir;
    if (target < 0 || target >= reordered.length) return;
    [reordered[idx], reordered[target]] = [reordered[target], reordered[idx]];
    setTools(reordered);
    reorder(reordered.map((t) => t.id));
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="m-0 text-base font-bold text-[var(--foreground)]">Smart Tools</h3>
          <p className="m-0 mt-0.5 text-sm text-[var(--muted-foreground)]">
            Publica Smart Tools em HTML e controla o acesso por role.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-lg bg-[var(--vd-blue-500)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus className="size-4" /> Nova Smart Tool
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--muted)]" />)}
        </div>
      ) : tools.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--muted-foreground)]">
          Sem Smart Tools publicadas. Clica em <strong>Nova Smart Tool</strong> para começar.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tools.map((t, idx) => (
            <ToolCard
              key={t.id}
              tool={t}
              roles={roles}
              idx={idx}
              total={tools.length}
              onToggle={() => toggleActive(t)}
              onEdit={() => openEdit(t)}
              onDelete={() => deleteTool(t.id)}
              onMoveUp={idx > 0 ? () => move(idx, -1) : undefined}
              onMoveDown={idx < tools.length - 1 ? () => move(idx, 1) : undefined}
            />
          ))}
        </div>
      )}

      {(creating || editing) && (
        <ToolForm
          tool={editing ?? undefined}
          roles={roles}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={load}
        />
      )}
    </div>
  );
}

/* ---- Tool Card ---- */

function ToolCard({
  tool, roles, idx: _idx, total: _total,
  onToggle, onEdit, onDelete, onMoveUp, onMoveDown,
}: {
  tool: ToolMeta;
  roles: Role[];
  idx: number;
  total: number;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const allowedRoles = roles.filter((r) => tool.roleIds.includes(r.id));

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 transition-opacity",
      !tool.isActive && "opacity-50",
    )}>
      <GripVertical className="size-4 shrink-0 cursor-grab text-[var(--muted-foreground)]" />

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-[var(--foreground)]">{tool.name}</span>
          {!tool.isActive && (
            <span className="rounded-full bg-[var(--muted)] px-2 py-px text-[10px] font-medium text-[var(--muted-foreground)]">
              inactiva
            </span>
          )}
        </div>
        {tool.description && (
          <p className="m-0 mt-0.5 text-[11px] text-[var(--muted-foreground)] truncate">{tool.description}</p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {allowedRoles.length === 0 ? (
            <span className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
              <ShieldCheck className="size-3" /> Todos os utilizadores
            </span>
          ) : (
            allowedRoles.map((r) => (
              <span key={r.id} className="rounded-full bg-[var(--vd-blue-500)]/10 px-2 py-px text-[10px] font-medium text-[var(--vd-blue-500)]">
                {r.name}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
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
        <button type="button" onClick={onToggle} title={tool.isActive ? "Desactivar" : "Activar"}
          className="grid size-7 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
          {tool.isActive ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
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

/* ---- Tool Form ---- */

function ToolForm({
  tool, roles, onClose, onSaved,
}: {
  tool?: ToolFull;
  roles: Role[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!tool;
  const [name, setName] = useState(tool?.name ?? "");
  const [description, setDescription] = useState(tool?.description ?? "");
  const [content, setContent] = useState(tool?.content ?? "");
  const [isActive, setIsActive] = useState(tool?.isActive ?? true);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(tool?.roleIds ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"meta" | "html" | "roles">("meta");
  const fileRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  function toggleRole(id: string) {
    setSelectedRoles((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setContent(ev.target?.result as string ?? "");
      if (!name) setName(file.name.replace(/\.html?$/i, "").replace(/[-_]/g, " "));
    };
    reader.readAsText(file);
  }

  async function save() {
    if (!name.trim()) { setError("Nome obrigatório"); return; }
    if (!content.trim()) { setError("HTML obrigatório"); return; }
    setSaving(true);
    const url = isEdit ? `/api/admin/tools/${tool!.id}` : "/api/admin/tools";
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim() || null,
        content,
        isActive,
        roleIds: selectedRoles,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Erro ao guardar");
      setSaving(false);
      return;
    }
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
      <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl"
        style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-center gap-2">
            <LayoutGrid className="size-4 text-[var(--vd-blue-500)]" />
            <h3 className="m-0 text-base font-bold">{isEdit ? `Editar — ${tool!.name}` : "Nova Smart Tool"}</h3>
          </div>
          <button type="button" onClick={onClose}
            className="grid size-7 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
            <X className="size-3.5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] px-5">
          {(["meta", "html", "roles"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors",
                tab === t
                  ? "border-[var(--vd-blue-500)] text-[var(--vd-blue-500)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
              )}
            >
              {t === "meta" ? "Informação" : t === "html" ? "HTML" : "Acesso / Roles"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "meta" && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Gestão de Turnos"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Descrição <span className="normal-case font-normal">(opcional)</span></label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ex: Escalas, colaboradores e alertas laborais por base"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4 rounded" />
                <span className="font-medium text-[var(--foreground)]">Smart Tool activa (visível para os utilizadores)</span>
              </label>
            </div>
          )}

          {tab === "html" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--muted-foreground)]">
                  Cola o HTML completo ou faz upload do ficheiro <code>.html</code>.
                </p>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]"
                >
                  <Upload className="size-3.5" /> Upload .html
                </button>
                <input ref={fileRef} type="file" accept=".html,.htm" className="hidden" onChange={handleFile} />
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="<!DOCTYPE html>..."
                spellCheck={false}
                rows={18}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
              />
              {content && (
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  {Math.round(content.length / 1024)} KB · {content.split("\n").length} linhas
                </p>
              )}
            </div>
          )}

          {tab === "roles" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-[var(--muted-foreground)]">
                Selecciona quais roles têm acesso. Se não seleccionares nenhuma, a Smart Tool fica visível para <strong>todos os utilizadores autenticados</strong>.
              </p>

              {roles.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">Sem roles configuradas. Cria roles em <strong>Administração → Roles</strong>.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {roles.map((r) => (
                    <label
                      key={r.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                        selectedRoles.includes(r.id)
                          ? "border-[var(--vd-blue-500)] bg-[var(--vd-blue-500)]/5"
                          : "border-[var(--border)] hover:bg-[var(--muted)]",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(r.id)}
                        onChange={() => toggleRole(r.id)}
                        className="size-4 rounded accent-[var(--vd-blue-500)]"
                      />
                      <div className="flex-1">
                        <p className="m-0 text-sm font-semibold text-[var(--foreground)]">{r.name}</p>
                      </div>
                      {selectedRoles.includes(r.id) && (
                        <ShieldCheck className="size-4 text-[var(--vd-blue-500)]" />
                      )}
                    </label>
                  ))}
                </div>
              )}

              {selectedRoles.length === 0 && (
                <div className="rounded-lg border border-[var(--vd-orange-500)]/30 bg-[var(--vd-orange-500)]/5 px-3 py-2 text-xs text-[var(--foreground)]">
                  ⚠️ Sem roles seleccionadas — todos os colaboradores autenticados terão acesso.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {error && <p className="px-5 pb-2 text-xs text-red-500">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-4">
          <button type="button" onClick={onClose}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--accent)]">
            Cancelar
          </button>
          <button type="button" onClick={save} disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--vd-blue-500)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            <Save className="size-3.5" />
            {saving ? "A guardar…" : isEdit ? "Guardar alterações" : "Publicar Smart Tool"}
          </button>
        </div>
      </div>
    </div>
  );
}
