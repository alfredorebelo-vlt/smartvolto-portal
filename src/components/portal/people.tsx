"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  X,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Calendar,
  Shield,
  ChevronRight,
  RefreshCw,
  Link2,
  Cake,
  Hash,
} from "lucide-react";
import { useSession } from "next-auth/react";
import type { DirectoryUser } from "@/lib/directory";
import { getInitials, getAvatarColor } from "@/lib/avatar";
import { cn } from "@/lib/utils";

export function People() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAdmin = (session?.user as any)?.isAdmin ?? false;

  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<string>("");
  const [office, setOffice] = useState<string>("");
  const [selected, setSelected] = useState<DirectoryUser | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const loadUsers = (signal?: AbortSignal) => {
    setLoading(true);
    fetch("/api/directory/users?status=active", { signal })
      .then((r) => r.json())
      .then((data: { users: DirectoryUser[] }) => {
        setUsers(data.users);
        setLoading(false);
      })
      .catch(() => {});
  };

  useEffect(() => {
    const ctrl = new AbortController();
    loadUsers(ctrl.signal);
    return () => ctrl.abort();
  }, []);

  async function handleSync() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/directory/sync", { method: "POST" });
      const data = (await res.json()) as { synced?: number; error?: string };
      if (res.ok && data.synced !== undefined) {
        setSyncMsg({ type: "ok", text: `${data.synced} utilizadores sincronizados` });
        loadUsers();
      } else {
        setSyncMsg({ type: "err", text: data.error ?? "Erro ao sincronizar" });
      }
    } catch {
      setSyncMsg({ type: "err", text: "Erro de rede" });
    } finally {
      setSyncing(false);
    }
  }

  const departments = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => u.department && set.add(u.department));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt"));
  }, [users]);

  const offices = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => u.officeLocation && set.add(u.officeLocation));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt"));
  }, [users]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (department && u.department !== department) return false;
      if (office && u.officeLocation !== office) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = [
          u.givenName,
          u.familyName,
          u.email,
          u.jobTitle ?? "",
          u.department ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [users, search, department, office]);

  const activeFilterCount = (department ? 1 : 0) + (office ? 1 : 0);

  const clearFilters = () => {
    setDepartment("");
    setOffice("");
  };

  return (
    <div className="flex min-h-full flex-col gap-4 bg-[var(--muted)] p-4 sm:gap-6 sm:p-6 lg:p-8">
      {/* Header / search bar */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="vd-eyebrow mb-1.5">{filtered.length} pessoas</div>
            <h2
              className="m-0 text-xl font-bold text-[var(--vd-blue-500)] dark:text-[var(--foreground)] sm:text-2xl"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.015em" }}
            >
              Diretório da equipa
            </h2>
          </div>
          {isAdmin ? (
            <div className="flex flex-col items-start gap-1 sm:items-end">
              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--accent)] disabled:opacity-60"
              >
                <RefreshCw className={cn("size-3.5", syncing && "animate-spin")} />
                {syncing ? "A sincronizar…" : "Sincronizar Workspace"}
              </button>
              {syncMsg ? (
                <span
                  className={cn(
                    "text-xs font-medium",
                    syncMsg.type === "ok"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400",
                  )}
                >
                  {syncMsg.text}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por nome, email, cargo ou departamento…"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] py-2.5 pl-9 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
            />
          </div>

          {/* Filter toggle (mobile) + clear */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors lg:hidden",
                activeFilterCount > 0
                  ? "border-[var(--vd-blue-500)] bg-[var(--vd-blue-50)] text-[var(--vd-blue-500)]"
                  : "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]",
              )}
            >
              <Filter className="size-4" />
              Filtros
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-[var(--vd-orange-500)] px-1.5 py-px text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
            {activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={clearFilters}
                className="hidden items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2.5 text-xs font-semibold text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] lg:flex"
              >
                <X className="size-3" /> Limpar
              </button>
            ) : null}
          </div>
        </div>

        {/* Filters (desktop always, mobile collapsible) */}
        <div
          className={cn(
            "mt-3 grid gap-2 sm:grid-cols-2",
            filtersOpen ? "grid" : "hidden lg:grid",
          )}
        >
          <FilterSelect
            label="Departamento"
            value={department}
            onChange={setDepartment}
            options={departments}
          />
          <FilterSelect
            label="Base"
            value={office}
            onChange={setOffice}
            options={offices}
          />
        </div>
      </section>

      {/* Grid */}
      {loading ? (
        <LoadingGrid />
      ) : filtered.length === 0 ? (
        <EmptyState onClear={clearFilters} hasFilters={activeFilterCount > 0 || !!search} />
      ) : (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((u) => (
            <PersonCard
              key={u.id}
              user={u}
              onClick={() => setSelected(u)}
            />
          ))}
        </section>
      )}

      {/* Detail drawer */}
      {selected ? (
        <PersonDrawer
          user={selected}
          allUsers={users}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}

/* ---------- subcomponents ---------- */

type SelectOption = string | { value: string; label: string };

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
}) {
  const isObjectOptions = options.length > 0 && typeof options[0] !== "string";
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
      >
        {!isObjectOptions ? <option value="">Todos</option> : null}
        {options.map((opt) => {
          if (typeof opt === "string") {
            return (
              <option key={opt} value={opt}>
                {opt}
              </option>
            );
          }
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function PersonCard({
  user,
  onClick,
}: {
  user: DirectoryUser;
  onClick: () => void;
}) {
  const initials = getInitials(user.givenName, user.familyName);
  const avatarBg = getAvatarColor(user.email);
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--vd-blue-500)] hover:shadow-md"
    >
      <div className="flex w-full items-start gap-3">
        <div
          className="grid size-12 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
          style={{ background: avatarBg, fontFamily: "var(--font-display)" }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[15px] font-semibold text-[var(--foreground)]">
              {user.givenName} {user.familyName}
            </h3>
            {user.isAdmin ? (
              <Shield className="size-3.5 shrink-0 text-[var(--vd-orange-500)]" />
            ) : null}
          </div>
          <p className="m-0 truncate text-xs text-[var(--muted-foreground)]">
            {user.jobTitle ?? "—"}
          </p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--muted-foreground)]">
        {user.department ? (
          <span className="flex items-center gap-1">
            <Building2 className="size-3" />
            {user.department}
          </span>
        ) : null}
        {user.officeLocation ? (
          <span className="flex items-center gap-1">
            <MapPin className="size-3" />
            {user.officeLocation}
          </span>
        ) : null}
      </div>
    </button>
  );
}

function PersonDrawer({
  user,
  allUsers,
  onClose,
}: {
  user: DirectoryUser;
  allUsers: DirectoryUser[];
  onClose: () => void;
}) {
  const initials = getInitials(user.givenName, user.familyName);
  const avatarBg = getAvatarColor(user.email);
  const manager = user.managerEmail
    ? allUsers.find((u) => u.email === user.managerEmail)
    : null;
  const reports = allUsers.filter((u) => u.managerEmail === user.email);

  const [slackId, setSlackId] = useState<string | null | "loading" | "error">(null);
  const [slackTeamId, setSlackTeamId] = useState<string>("");

  function openSlack() {
    if (slackId === "loading") return;
    if (slackId && slackId !== "error") {
      window.open(`slack://user?team=${slackTeamId}&id=${slackId}`, "_blank");
      return;
    }
    setSlackId("loading");
    fetch(`/api/directory/slack-user?email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.id) {
          setSlackId(d.id);
          setSlackTeamId(d.teamId ?? "");
          window.open(`slack://user?team=${d.teamId ?? ""}&id=${d.id}`, "_blank");
        } else {
          setSlackId("error");
        }
      })
      .catch(() => setSlackId("error"));
  }

  // ESC fecha
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Fechar detalhes"
        onClick={onClose}
        className="flex-1 bg-black/50 backdrop-blur-sm"
      />
      <aside className="relative flex w-full max-w-md flex-col overflow-y-auto border-l border-[var(--border)] bg-[var(--card)] shadow-2xl sm:max-w-lg">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-3 border-b border-[var(--border)] p-6 text-center">
          <div
            className="grid size-20 place-items-center rounded-full text-2xl font-bold text-white"
            style={{ background: avatarBg, fontFamily: "var(--font-display)" }}
          >
            {initials}
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5">
              <h2
                className="m-0 text-xl font-bold text-[var(--foreground)]"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.015em" }}
              >
                {user.givenName} {user.familyName}
              </h2>
              {user.isAdmin ? (
                <span
                  title="Administrador"
                  className="grid size-5 place-items-center rounded-full bg-[var(--vd-orange-50)]"
                >
                  <Shield className="size-3 text-[var(--vd-orange-500)]" />
                </span>
              ) : null}
            </div>
            <p className="m-0 mt-1 text-sm text-[var(--muted-foreground)]">
              {user.jobTitle}
            </p>
          </div>
        </div>

        {/* Contact actions */}
        <div className="grid grid-cols-2 gap-2 border-b border-[var(--border)] p-4">
          <a
            href={`mailto:${user.email}`}
            className="flex items-center justify-center gap-2 rounded-lg bg-[var(--vd-blue-500)] px-3 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Mail className="size-4" /> Email
          </a>
          {user.phoneNumber ? (
            <a
              href={`tel:${user.phoneNumber.replace(/\s/g, "")}`}
              className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2.5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--accent)]"
            >
              <Phone className="size-4" /> Ligar
            </a>
          ) : (
            <span className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm font-semibold text-[var(--muted-foreground)] opacity-60">
              <Phone className="size-4" /> Sem telefone
            </span>
          )}
          <button
            type="button"
            onClick={openSlack}
            disabled={slackId === "loading"}
            title={slackId === "error" ? "Utilizador não encontrado no Slack" : "Abrir conversa no Slack"}
            className={cn(
              "col-span-2 flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors",
              slackId === "error"
                ? "border-[var(--border)] text-[var(--muted-foreground)] opacity-60 cursor-not-allowed"
                : "border-[#4a154b]/20 bg-[#4a154b]/5 text-[#4a154b] hover:bg-[#4a154b]/10 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
            )}
          >
            <Hash className="size-4" />
            {slackId === "loading" ? "A procurar…" : slackId === "error" ? "Não encontrado no Slack" : "Mensagem no Slack"}
          </button>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-1 p-4">
          <DetailRow icon={Mail} label="Email" value={user.email} />
          {user.phoneNumber ? (
            <DetailRow icon={Phone} label="Telefone" value={user.phoneNumber} />
          ) : null}
          {user.department ? (
            <DetailRow icon={Building2} label="Departamento" value={user.department} />
          ) : null}
          {user.jobTitle ? (
            <DetailRow icon={Briefcase} label="Cargo" value={user.jobTitle} />
          ) : null}
          {user.officeLocation ? (
            <DetailRow icon={MapPin} label="Base" value={user.officeLocation} />
          ) : null}
          {user.startDate ? (
            <DetailRow
              icon={Calendar}
              label="Na empresa desde"
              value={new Date(user.startDate).toLocaleDateString("pt-PT", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
          ) : null}
          {user.workLocation ? (
            <DetailRow icon={MapPin} label="Localização" value={user.workLocation} />
          ) : null}
        </div>

        {/* Bio + links pessoais */}
        {(user.bio || user.linkedinUrl) && (
          <div className="flex flex-col gap-3 border-t border-[var(--border)] p-4">
            {user.bio && (
              <p className="m-0 text-sm leading-relaxed text-[var(--muted-foreground)]">{user.bio}</p>
            )}
            {user.linkedinUrl && (
              <a
                href={user.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-[var(--vd-blue-500)] hover:underline"
              >
                <Link2 className="size-4 shrink-0" />
                <span className="truncate">{user.linkedinUrl.replace(/^https?:\/\/(www\.)?/, "")}</span>
              </a>
            )}
          </div>
        )}

        {/* Manager */}
        {manager ? (
          <div className="border-t border-[var(--border)] p-4">
            <div className="vd-eyebrow mb-2">Reporta a</div>
            <PersonMini user={manager} />
          </div>
        ) : null}

        {/* Reports */}
        {reports.length > 0 ? (
          <div className="border-t border-[var(--border)] p-4">
            <div className="vd-eyebrow mb-2">
              Equipa direta · {reports.length}
            </div>
            <div className="flex flex-col gap-1.5">
              {reports.map((r) => (
                <PersonMini key={r.id} user={r} />
              ))}
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-[var(--muted)]">
      <Icon className="mt-0.5 size-4 shrink-0 text-[var(--muted-foreground)]" />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          {label}
        </div>
        <div className="truncate text-sm text-[var(--foreground)]">{value}</div>
      </div>
    </div>
  );
}

function PersonMini({ user }: { user: DirectoryUser }) {
  const initials = getInitials(user.givenName, user.familyName);
  const avatarBg = getAvatarColor(user.email);
  return (
    <div className="flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-[var(--muted)]">
      <div
        className="grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white"
        style={{ background: avatarBg, fontFamily: "var(--font-display)" }}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-[var(--foreground)]">
          {user.givenName} {user.familyName}
        </div>
        <div className="truncate text-[11px] text-[var(--muted-foreground)]">
          {user.jobTitle}
        </div>
      </div>
    </div>
  );
}

function LoadingGrid() {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
        >
          <div className="flex items-start gap-3">
            <div className="size-12 shrink-0 rounded-full bg-[var(--muted)]" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-3/4 rounded bg-[var(--muted)]" />
              <div className="h-3 w-1/2 rounded bg-[var(--muted)]" />
            </div>
          </div>
          <div className="h-3 w-2/3 rounded bg-[var(--muted)]" />
        </div>
      ))}
    </section>
  );
}

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-full bg-[var(--muted)]">
        <Search className="size-5 text-[var(--muted-foreground)]" />
      </div>
      <h3 className="m-0 text-base font-semibold text-[var(--foreground)]">
        Sem resultados
      </h3>
      <p className="m-0 mt-1 max-w-xs text-sm text-[var(--muted-foreground)]">
        {hasFilters
          ? "Tenta ajustar os filtros ou a pesquisa."
          : "Ainda não há pessoas no diretório."}
      </p>
      {hasFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 rounded-lg bg-[var(--vd-blue-500)] px-4 py-2 text-xs font-semibold text-white"
        >
          Limpar filtros
        </button>
      ) : null}
    </div>
  );
}
