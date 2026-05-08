"use client";

import { useEffect, useState } from "react";
import {
  Mail, Phone, Building2, Briefcase, MapPin, Link2,
  RefreshCw, Pencil, Check, X, User, ShieldCheck, Cake,
} from "lucide-react";
import { getInitials, getAvatarColor } from "@/lib/avatar";
import { cn } from "@/lib/utils";

type ProfileUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  givenName: string | null;
  familyName: string | null;
  jobTitle: string | null;
  department: string | null;
  officeLocation: string | null;
  phoneNumber: string | null;
  managerEmail: string | null;
  isAdmin: boolean;
  status: string;
  lastSyncedAt: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  workLocation: string | null;
  dateOfBirth: string | null;
  role: { id: string; name: string; description: string | null } | null;
};

type EditableFields = {
  bio: string;
  linkedinUrl: string;
  workLocation: string;
  dateOfBirth: string;
};

export function Profile() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditableFields>({ bio: "", linkedinUrl: "", workLocation: "", dateOfBirth: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchProfile() {
    setLoading(true);
    const res = await fetch("/api/profile");
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      setForm({
        bio: data.user.bio ?? "",
        linkedinUrl: data.user.linkedinUrl ?? "",
        workLocation: data.user.workLocation ?? "",
        dateOfBirth: data.user.dateOfBirth ? data.user.dateOfBirth.split("T")[0] : "",
      });
    }
    setLoading(false);
  }

  useEffect(() => { fetchProfile(); }, []);

  function startEdit() {
    if (!user) return;
    setForm({
      bio: user.bio ?? "",
      linkedinUrl: user.linkedinUrl ?? "",
      workLocation: user.workLocation ?? "",
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
    });
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setError(null);
  }

  async function saveEdit() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      setEditing(false);
    } else {
      const data = await res.json();
      setError(data.error ?? "Erro ao guardar");
    }
    setSaving(false);
  }

  if (loading) return <ProfileSkeleton />;
  if (!user) return null;

  const displayName = user.givenName && user.familyName
    ? `${user.givenName} ${user.familyName}`
    : user.name ?? user.email;

  const initials = getInitials(user.givenName ?? "", user.familyName ?? "");
  const avatarBg = getAvatarColor(user.id);

  const lastSync = user.lastSyncedAt
    ? new Date(user.lastSyncedAt).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="flex min-h-full flex-col gap-4 bg-[var(--muted)] p-4 sm:gap-6 sm:p-6 lg:p-8">

      {/* Header card */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          {/* Avatar */}
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={displayName}
              className="size-20 shrink-0 rounded-2xl object-cover ring-2 ring-[var(--border)] sm:size-24"
            />
          ) : (
            <div
              className="grid size-20 shrink-0 place-items-center rounded-2xl text-2xl font-bold text-white ring-2 ring-[var(--border)] sm:size-24"
              style={{ background: avatarBg }}
            >
              {initials}
            </div>
          )}

          {/* Info principal */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1
                  className="m-0 text-2xl font-bold leading-tight text-[var(--foreground)] sm:text-3xl"
                  style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
                >
                  {displayName}
                </h1>
                {user.jobTitle && (
                  <p className="mt-1 text-sm font-medium text-[var(--muted-foreground)]">{user.jobTitle}</p>
                )}
                {user.department && (
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{user.department}</p>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5">
                {user.isAdmin && (
                  <span className="flex items-center gap-1 rounded-full bg-[var(--vd-orange-50)] px-2.5 py-1 text-[11px] font-semibold text-[var(--vd-orange-500)] dark:bg-[var(--vd-orange-500)]/10">
                    <ShieldCheck className="size-3" /> Administrador
                  </span>
                )}
                {user.role && !user.isAdmin && (
                  <span className="flex items-center gap-1 rounded-full bg-[var(--muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--muted-foreground)]">
                    <User className="size-3" /> {user.role.name}
                  </span>
                )}
                <span className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  user.status === "ACTIVE"
                    ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                )}>
                  {user.status === "ACTIVE" ? "Ativo" : user.status === "SUSPENDED" ? "Suspenso" : user.status}
                </span>
              </div>
            </div>

            {/* Sync info */}
            {lastSync && (
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
                <RefreshCw className="size-3" />
                <span>Sincronizado com Google Workspace em {lastSync}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">

        {/* Contacto — só leitura, vem do Workspace */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="m-0 text-sm font-bold text-[var(--foreground)]">Informação de contacto</h2>
            <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              <RefreshCw className="size-2.5" /> Google Workspace
            </span>
          </div>
          <ul className="flex flex-col gap-3">
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow icon={Phone} label="Telefone" value={user.phoneNumber} />
            <InfoRow icon={Building2} label="Escritório" value={user.officeLocation} />
            <InfoRow icon={Briefcase} label="Gestor" value={user.managerEmail} />
          </ul>
        </section>

        {/* Sobre mim — editável */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="m-0 text-sm font-bold text-[var(--foreground)]">Sobre mim</h2>
            {!editing ? (
              <button
                type="button"
                onClick={startEdit}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]"
              >
                <Pencil className="size-3" /> Editar
              </button>
            ) : (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-lg bg-[var(--vd-blue-500)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  <Check className="size-3" /> {saving ? "A guardar…" : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="grid size-7 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}
          </div>

          {error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}

          {editing ? (
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Apresentação
                </label>
                <textarea
                  rows={4}
                  maxLength={300}
                  placeholder="Escreve uma breve apresentação…"
                  value={form.bio}
                  onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                  className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
                />
                <p className="mt-0.5 text-right text-[10px] text-[var(--muted-foreground)]">
                  {form.bio.length}/300
                </p>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  LinkedIn
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={form.linkedinUrl}
                  onChange={(e) => setForm((p) => ({ ...p, linkedinUrl: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Localização
                </label>
                <input
                  type="text"
                  placeholder="ex: Lisboa, Remote…"
                  maxLength={100}
                  value={form.workLocation}
                  onChange={(e) => setForm((p) => ({ ...p, workLocation: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Data de nascimento
                </label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
                />
                <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">Usada no widget de aniversários da equipa.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {user.bio ? (
                <p className="m-0 text-sm leading-relaxed text-[var(--muted-foreground)]">{user.bio}</p>
              ) : (
                <p className="m-0 text-sm italic text-[var(--muted-foreground)]/60">Sem apresentação. Clica em Editar para adicionar.</p>
              )}
              <div className="mt-1 flex flex-col gap-2.5 border-t border-[var(--border)] pt-3">
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
                {user.workLocation && (
                  <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <MapPin className="size-4 shrink-0" />
                    <span>{user.workLocation}</span>
                  </div>
                )}
                {user.dateOfBirth && (
                  <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <Cake className="size-4 shrink-0" />
                    <span>{new Date(user.dateOfBirth).toLocaleDateString("pt-PT", { day: "numeric", month: "long" })}</span>
                  </div>
                )}
                {!user.linkedinUrl && !user.workLocation && !user.dateOfBirth && (
                  <p className="m-0 text-xs italic text-[var(--muted-foreground)]/60">Sem dados adicionais.</p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <li className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-[var(--muted-foreground)]" />
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</div>
        <div className="truncate text-sm text-[var(--foreground)]">{value}</div>
      </div>
    </li>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex min-h-full flex-col gap-4 bg-[var(--muted)] p-4 sm:gap-6 sm:p-6 lg:p-8">
      <div className="animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
        <div className="flex gap-5">
          <div className="size-20 shrink-0 rounded-2xl bg-[var(--muted)] sm:size-24" />
          <div className="flex-1 space-y-2.5 pt-1">
            <div className="h-7 w-48 rounded bg-[var(--muted)]" />
            <div className="h-4 w-32 rounded bg-[var(--muted)]" />
            <div className="h-3 w-24 rounded bg-[var(--muted)]" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
            <div className="mb-4 h-4 w-40 rounded bg-[var(--muted)]" />
            <div className="space-y-3">
              {[0, 1, 2].map((j) => (
                <div key={j} className="flex gap-2.5">
                  <div className="mt-0.5 size-4 rounded bg-[var(--muted)]" />
                  <div className="flex-1 space-y-1">
                    <div className="h-2.5 w-16 rounded bg-[var(--muted)]" />
                    <div className="h-3.5 w-40 rounded bg-[var(--muted)]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
