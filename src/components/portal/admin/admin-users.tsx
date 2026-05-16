"use client";

import { useEffect, useState } from "react";
import { Shield, RefreshCw, ChevronDown } from "lucide-react";
import { getInitials, getAvatarColor } from "@/lib/avatar";
import { cn } from "@/lib/utils";

type AdminUser = {
  id: string;
  email: string;
  givenName: string | null;
  familyName: string | null;
  image: string | null;
  jobTitle: string | null;
  department: string | null;
  isAdmin: boolean;
  status: string;
  roleId: string | null;
  role: { id: string; name: string } | null;
};

type Role = { id: string; name: string };

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  SUSPENDED: "Suspenso",
  PENDING: "Pendente",
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  INACTIVE: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  SUSPENDED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    const [uRes, rRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/admin/roles"),
    ]);
    const uData = await uRes.json();
    const rData = await rRes.json();
    setUsers(uData.users ?? []);
    setRoles(rData.roles ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateUser(id: string, patch: Partial<Pick<AdminUser, "roleId" | "isAdmin" | "status">>) {
    setSaving(id);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    const data = await res.json();
    if (res.ok) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data.user } : u)));
    }
    setSaving(null);
  }

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.givenName ?? "").toLowerCase().includes(q) ||
      (u.familyName ?? "").toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.department ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Filtrar por nome, email ou departamento…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
        />
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--accent)] disabled:opacity-50"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Atualizar
        </button>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Colaborador</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Departamento</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Estado</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-[var(--muted)]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                  Nenhum utilizador encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((u) => {
                const initials = getInitials(u.givenName ?? "", u.familyName ?? "");
                const avatarBg = getAvatarColor(u.email);
                const isSaving = saving === u.id;
                return (
                  <tr key={u.id} className={cn("transition-colors hover:bg-[var(--muted)]/50", isSaving && "opacity-60")}>
                    {/* Utilizador */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {u.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.image} alt="" className="size-8 shrink-0 rounded-full object-cover" />
                        ) : (
                          <div
                            className="grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white"
                            style={{ background: avatarBg }}
                          >
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-[var(--foreground)]">
                            {u.givenName} {u.familyName}
                          </div>
                          <div className="truncate text-[11px] text-[var(--muted-foreground)]">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    {/* Departamento */}
                    <td className="px-4 py-3 text-[var(--muted-foreground)]">
                      {u.department ?? "—"}
                    </td>
                    {/* Estado */}
                    <td className="px-4 py-3">
                      <div className="relative inline-block">
                        <select
                          value={u.status}
                          disabled={isSaving}
                          onChange={(e) => updateUser(u.id, { status: e.target.value })}
                          className={cn(
                            "appearance-none rounded-full px-2.5 py-0.5 pr-6 text-[11px] font-semibold focus:outline-none cursor-pointer",
                            STATUS_COLOR[u.status] ?? STATUS_COLOR.INACTIVE,
                          )}
                        >
                          {Object.entries(STATUS_LABEL).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 opacity-60" />
                      </div>
                    </td>
                    {/* Role */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="relative inline-block">
                          <select
                            value={u.roleId ?? ""}
                            disabled={isSaving}
                            onChange={(e) => updateUser(u.id, { roleId: e.target.value || null })}
                            className="appearance-none rounded-lg border border-[var(--border)] bg-[var(--muted)] py-1.5 pl-2.5 pr-7 text-xs font-medium text-[var(--foreground)] focus:outline-none cursor-pointer"
                          >
                            <option value="">Sem role</option>
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-[var(--muted-foreground)]" />
                        </div>
                        {u.role?.name === "Admin" && (
                          <span className="flex items-center gap-1 rounded-full bg-[var(--vd-orange-50)] px-2 py-0.5 text-[10px] font-semibold text-[var(--vd-orange-500)]">
                            <Shield className="size-2.5" /> Admin
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-right text-[11px] text-[var(--muted-foreground)]">
        {filtered.length} utilizador{filtered.length !== 1 ? "es" : ""}
      </p>
    </div>
  );
}
