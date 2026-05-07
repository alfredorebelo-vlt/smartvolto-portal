"use client";

import { useCallback, useEffect, useState } from "react";
import { ScrollText, Filter, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type AuditLog = {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  action: "CREATE" | "UPDATE" | "DELETE" | "RESTORE";
  entity: string;
  entityId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
};

const ACTION_COLORS: Record<string, string> = {
  CREATE:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  UPDATE:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DELETE:  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  RESTORE: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

const ENTITY_LABELS: Record<string, string> = {
  Article:         "Artigo",
  ArticleVersion:  "Versão de artigo",
  ArticleCategory: "Categoria",
  Announcement:    "Anúncio",
  User:            "Utilizador",
  Role:            "Role",
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Criação",
  UPDATE: "Edição",
  DELETE: "Eliminação",
  RESTORE: "Restauro",
};

export function AdminAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [filterEntity, setFilterEntity] = useState<string>("");
  const [filterAction, setFilterAction] = useState<string>("");
  const [filterSince, setFilterSince] = useState<string>("");
  const [filterUntil, setFilterUntil] = useState<string>("");

  const buildQuery = useCallback((cursor?: string) => {
    const q = new URLSearchParams();
    q.set("limit", "50");
    if (filterEntity) q.set("entity", filterEntity);
    if (filterAction) q.set("action", filterAction);
    if (filterSince) q.set("since", new Date(filterSince).toISOString());
    if (filterUntil) {
      const until = new Date(filterUntil);
      until.setHours(23, 59, 59, 999);
      q.set("until", until.toISOString());
    }
    if (cursor) q.set("cursor", cursor);
    return q.toString();
  }, [filterEntity, filterAction, filterSince, filterUntil]);

  const load = useCallback(async (cursor?: string) => {
    if (cursor) setLoadingMore(true); else setLoading(true);
    const res = await fetch(`/api/admin/audit?${buildQuery(cursor)}`);
    const data = await res.json();
    setLogs((prev) => cursor ? [...prev, ...(data.logs ?? [])] : (data.logs ?? []));
    setNextCursor(data.nextCursor ?? null);
    setLoading(false);
    setLoadingMore(false);
  }, [buildQuery]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header + filtros */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2">
          <ScrollText className="size-4 text-[var(--muted-foreground)]" />
          <h3 className="m-0 text-sm font-bold text-[var(--foreground)]">Log de auditoria</h3>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
        >
          <RefreshCw className={cn("size-3", loading && "animate-spin")} /> Atualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <FilterField label="Entidade">
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
          >
            <option value="">Todas</option>
            {Object.entries(ENTITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Ação">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
          >
            <option value="">Todas</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </FilterField>
        <FilterField label="De">
          <input
            type="date"
            value={filterSince}
            onChange={(e) => setFilterSince(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
          />
        </FilterField>
        <FilterField label="Até">
          <input
            type="date"
            value={filterUntil}
            onChange={(e) => setFilterUntil(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
          />
        </FilterField>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-[var(--muted)]" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed border-[var(--border)] p-10 text-center">
          <Filter className="mb-2 size-5 text-[var(--muted-foreground)]" />
          <p className="m-0 text-sm font-semibold text-[var(--foreground)]">Sem registos</p>
          <p className="m-0 mt-1 text-xs text-[var(--muted-foreground)]">
            Ajusta os filtros ou faz alterações no portal.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="w-7 px-2 py-2"></th>
                <th className="px-3 py-2 font-semibold text-[var(--muted-foreground)]">Data</th>
                <th className="px-3 py-2 font-semibold text-[var(--muted-foreground)]">Utilizador</th>
                <th className="px-3 py-2 font-semibold text-[var(--muted-foreground)]">Ação</th>
                <th className="px-3 py-2 font-semibold text-[var(--muted-foreground)]">Entidade</th>
                <th className="px-3 py-2 font-semibold text-[var(--muted-foreground)]">Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const expanded = expandedId === log.id;
                const date = new Date(log.createdAt).toLocaleString("pt-PT", {
                  day: "2-digit", month: "2-digit", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                });
                const summary = formatMetaSummary(log);
                return (
                  <>
                    <tr
                      key={log.id}
                      onClick={() => setExpandedId(expanded ? null : log.id)}
                      className="cursor-pointer border-t border-[var(--border)] hover:bg-[var(--muted)]/40"
                    >
                      <td className="px-2 py-2">
                        {expanded ? (
                          <ChevronDown className="size-3 text-[var(--muted-foreground)]" />
                        ) : (
                          <ChevronRight className="size-3 text-[var(--muted-foreground)]" />
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-[var(--muted-foreground)]">{date}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-[var(--foreground)]">{log.userName ?? "—"}</div>
                        <div className="text-[10px] text-[var(--muted-foreground)]">{log.userEmail ?? ""}</div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={cn("inline-block rounded-full px-2 py-px text-[10px] font-bold uppercase", ACTION_COLORS[log.action])}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[var(--foreground)]">
                        {ENTITY_LABELS[log.entity] ?? log.entity}
                      </td>
                      <td className="max-w-xs truncate px-3 py-2 text-[var(--muted-foreground)]">
                        {summary}
                      </td>
                    </tr>
                    {expanded && (
                      <tr key={`${log.id}-details`} className="border-t border-[var(--border)] bg-[var(--muted)]/30">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="grid gap-2 sm:grid-cols-2">
                            <DetailField label="ID do registo" value={log.id} mono />
                            <DetailField label="ID da entidade" value={log.entityId ?? "—"} mono />
                          </div>
                          {log.meta && (
                            <div className="mt-2">
                              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                                Metadata
                              </div>
                              <pre className="overflow-x-auto rounded-md border border-[var(--border)] bg-[var(--card)] p-2 font-mono text-[10px] text-[var(--foreground)]">
{JSON.stringify(log.meta, null, 2)}
                              </pre>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {nextCursor && !loading && (
        <button
          type="button"
          onClick={() => load(nextCursor)}
          disabled={loadingMore}
          className="mx-auto rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--muted)] disabled:opacity-50"
        >
          {loadingMore ? "A carregar…" : "Carregar mais"}
        </button>
      )}
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
      </label>
      {children}
    </div>
  );
}

function DetailField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</div>
      <div className={cn("text-[11px] text-[var(--foreground)]", mono && "font-mono")}>{value}</div>
    </div>
  );
}

function formatMetaSummary(log: AuditLog): string {
  if (!log.meta) return "—";
  const m = log.meta;
  if (typeof m.title === "string") return m.title;
  if (typeof m.name === "string") return m.name;
  if (typeof m.targetEmail === "string") return m.targetEmail;
  if (Array.isArray(m.changes)) return `Alterou: ${(m.changes as string[]).join(", ")}`;
  if (m.changeNote) return String(m.changeNote);
  if (m.restoredFromDate) return `Restaurado de ${String(m.restoredFromDate).slice(0, 10)}`;
  return "—";
}
