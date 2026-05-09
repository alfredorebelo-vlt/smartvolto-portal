"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Save, X, Users } from "lucide-react";
import { confirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS, SECTIONS } from "@/lib/sections";

type Role = {
  id: string;
  name: string;
  description: string | null;
  sections: string[];
  isSystem: boolean;
  _count: { users: number };
};

// Grupos de permissões para o editor de checkboxes
const PERMISSION_GROUPS: { label: string; keys: { key: string; label: string }[] }[] = [
  {
    label: "Navegação",
    keys: [
      { key: NAV_SECTIONS.FEED,     label: "Anúncios" },
      { key: NAV_SECTIONS.CALENDAR, label: "Calendário" },
      { key: NAV_SECTIONS.PEOPLE,   label: "Pessoas" },
      { key: NAV_SECTIONS.DOCS,     label: "Documentos" },
      { key: NAV_SECTIONS.MANUAL,   label: "Manual de operações" },
      { key: NAV_SECTIONS.TOOLS,    label: "Ferramentas" },
    ],
  },
  {
    label: "Anúncios",
    keys: [
      { key: SECTIONS.ANNOUNCEMENTS_WRITE, label: "Criar / editar anúncios" },
    ],
  },
  {
    label: "Manual de operações",
    keys: [
      { key: SECTIONS.MANUAL_WRITE, label: "Criar / editar artigos do manual" },
    ],
  },
  {
    label: "Documentos",
    keys: [
      { key: SECTIONS.DOCS_DRIVE, label: "Acesso ao Google Drive" },
    ],
  },
  {
    label: "Administração",
    keys: [
      { key: SECTIONS.ADMIN_AUDIT, label: "Ver log de auditoria" },
    ],
  },
  {
    label: "Dashboard — Widgets",
    keys: [
      { key: SECTIONS.DASHBOARD_CARD_BC,        label: "Widget Business Central" },
      { key: SECTIONS.DASHBOARD_CARD_SESAME,    label: "Widget Sesame HR" },
      { key: SECTIONS.DASHBOARD_CARD_PIPEDRIVE, label: "Widget Pipedrive" },
      { key: SECTIONS.DASHBOARD_CARD_WWM,       label: "Widget WWM" },
    ],
  },
];

const EMPTY_ROLE = { name: "", description: "", sections: [] as string[] };

export function AdminRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<typeof EMPTY_ROLE | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/roles");
    const data = await res.json();
    setRoles(data.roles ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startCreate() {
    setEditingId(null);
    setEditing({ ...EMPTY_ROLE, sections: [] });
  }

  function startEdit(role: Role) {
    setEditingId(role.id);
    setEditing({
      name: role.name,
      description: role.description ?? "",
      sections: Array.isArray(role.sections) ? role.sections : [],
    });
  }

  function cancelEdit() {
    setEditing(null);
    setEditingId(null);
  }

  function toggleSection(key: string) {
    if (!editing) return;
    setEditing((prev) => {
      if (!prev) return prev;
      const has = prev.sections.includes(key);
      return {
        ...prev,
        sections: has ? prev.sections.filter((s) => s !== key) : [...prev.sections, key],
      };
    });
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    const method = editingId ? "PATCH" : "POST";
    const body = editingId
      ? { id: editingId, ...editing }
      : editing;

    const res = await fetch("/api/admin/roles", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      await load();
      cancelEdit();
    }
    setSaving(false);
  }

  async function deleteRole(id: string) {
    if (!await confirm({ message: "Apagar este role? Os utilizadores ficam sem role atribuído.", variant: "danger", confirmLabel: "Apagar" })) return;
    setDeleting(id);
    await fetch(`/api/admin/roles?id=${id}`, { method: "DELETE" });
    await load();
    setDeleting(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Botão criar */}
      {!editing && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={startCreate}
            className="flex items-center gap-2 rounded-lg bg-[var(--vd-blue-500)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" /> Novo role
          </button>
        </div>
      )}

      {/* Editor de role */}
      {editing && (
        <div className="rounded-xl border border-[var(--vd-blue-500)]/30 bg-[var(--card)] p-5 shadow-sm">
          <h3 className="mb-4 text-base font-bold text-[var(--foreground)]">
            {editingId ? "Editar role" : "Novo role"}
          </h3>

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Nome *</span>
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing((p) => p && ({ ...p, name: e.target.value }))}
                placeholder="ex: Comercial, Financeiro…"
                className="rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Descrição</span>
              <input
                type="text"
                value={editing.description}
                onChange={(e) => setEditing((p) => p && ({ ...p, description: e.target.value }))}
                placeholder="Opcional"
                className="rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
              />
            </label>
          </div>

          {/* Permissões */}
          <div className="mb-5 space-y-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Permissões</div>
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="mb-2 text-xs font-semibold text-[var(--foreground)]">{group.label}</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {group.keys.map(({ key, label }) => {
                    const checked = editing.sections.includes(key);
                    return (
                      <label
                        key={key}
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors",
                          checked
                            ? "border-[var(--vd-blue-500)] bg-[var(--vd-blue-50)] text-[var(--vd-blue-500)] dark:bg-[var(--vd-blue-500)]/10"
                            : "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--accent)]",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSection(key)}
                          className="size-4 accent-[var(--vd-blue-500)]"
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving || !editing.name.trim()}
              className="flex items-center gap-2 rounded-lg bg-[var(--vd-blue-500)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Save className="size-4" />
              {saving ? "A guardar…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--accent)]"
            >
              <X className="size-4" /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de roles */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--muted)]" />
          ))}
        </div>
      ) : roles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted-foreground)]">
          Ainda não existem roles. Cria o primeiro acima.
        </div>
      ) : (
        <div className="space-y-2">
          {roles.map((role) => {
            const secs = Array.isArray(role.sections) ? role.sections : [];
            return (
              <div
                key={role.id}
                className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--foreground)]">{role.name}</span>
                    {role.isSystem && (
                      <span className="rounded-full bg-[var(--muted)] px-2 py-px text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Sistema</span>
                    )}
                  </div>
                  {role.description && (
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{role.description}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {secs.slice(0, 6).map((s) => (
                      <span key={s} className="rounded bg-[var(--vd-blue-50)] px-1.5 py-px text-[10px] font-medium text-[var(--vd-blue-500)] dark:bg-[var(--vd-blue-500)]/10">
                        {s}
                      </span>
                    ))}
                    {secs.length > 6 && (
                      <span className="rounded bg-[var(--muted)] px-1.5 py-px text-[10px] text-[var(--muted-foreground)]">
                        +{secs.length - 6}
                      </span>
                    )}
                    {secs.length === 0 && (
                      <span className="text-[11px] text-[var(--muted-foreground)] italic">Sem permissões</span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
                  <Users className="size-3.5" />
                  {role._count.users}
                </div>

                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(role)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--accent)]"
                  >
                    Editar
                  </button>
                  {!role.isSystem && (
                    <button
                      type="button"
                      onClick={() => deleteRole(role.id)}
                      disabled={deleting === role.id}
                      className="grid size-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
