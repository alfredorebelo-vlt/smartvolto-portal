"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Pin, Save, X, Megaphone, Check, Users } from "lucide-react";
import { confirm } from "@/components/ui/confirm-dialog";
import { getInitials, getAvatarColor } from "@/lib/avatar";
import { cn } from "@/lib/utils";

type AuthorMini = {
  id: string; givenName: string | null; familyName: string | null;
  name: string | null; image: string | null; jobTitle?: string | null;
};

type Announcement = {
  id: string; title: string; content: string;
  category: string | null; isPinned: boolean; publishedAt: string;
  roleIds: string[];
  author: AuthorMini;
  _count: { reactions: number; comments: number };
};

type Category = { id: string; slug: string; label: string; color: string; bg: string };
type Role = { id: string; name: string };

type FormState = {
  title: string; content: string; category: string;
  isPinned: boolean; roleIds: string[];
};
const EMPTY_FORM: FormState = { title: "", content: "", category: "", isPinned: false, roleIds: [] };

const AUTHOR_DISPLAY = (a: AuthorMini) =>
  a.givenName && a.familyName ? `${a.givenName} ${a.familyName}` : (a.name ?? "—");

export function AdminAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (cursor?: string) => {
    if (!cursor) setLoading(true); else setLoadingMore(true);
    const params = new URLSearchParams({ limit: "20", admin: "1" });
    if (cursor) params.set("cursor", cursor);
    const res = await fetch(`/api/admin/announcements?${params}`);
    const data = await res.json();
    setItems((prev) => cursor ? [...prev, ...(data.announcements ?? [])] : (data.announcements ?? []));
    setNextCursor(data.nextCursor ?? null);
    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/announcement-categories").then((r) => r.json()),
      fetch("/api/admin/roles").then((r) => r.json()),
    ]).then(([catData, roleData]) => {
      setCats(catData.categories ?? []);
      setRoles(roleData.roles ?? []);
    });
    load();
  }, [load]);

  function openCreate() { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true); }
  function openEdit(a: Announcement) {
    setEditingId(a.id);
    setForm({
      title: a.title, content: a.content, category: a.category ?? "",
      isPinned: a.isPinned, roleIds: Array.isArray(a.roleIds) ? a.roleIds : [],
    });
    setShowForm(true);
  }
  function cancelForm() { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }

  async function submit() {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    const payload = { ...form, category: form.category || null };
    if (editingId) {
      const res = await fetch(`/api/announcements/${editingId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (res.ok) { await load(); cancelForm(); }
    } else {
      const res = await fetch("/api/announcements", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (res.ok) { await load(); cancelForm(); }
    }
    setSaving(false);
  }

  async function togglePin(a: Announcement) {
    await fetch(`/api/announcements/${a.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !a.isPinned }),
    });
    setItems((prev) => prev.map((x) => x.id === a.id ? { ...x, isPinned: !x.isPinned } : x));
  }

  async function deleteAnnouncement(id: string) {
    if (!await confirm({ message: "Apagar este anúncio?", variant: "danger", confirmLabel: "Apagar" })) return;
    setDeletingId(id);
    await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((x) => x.id !== id));
    setDeletingId(null);
  }

  function toggleRole(roleId: string) {
    setForm((prev) => {
      const has = prev.roleIds.includes(roleId);
      return { ...prev, roleIds: has ? prev.roleIds.filter((r) => r !== roleId) : [...prev.roleIds, roleId] };
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">Anúncios</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Gerir todos os anúncios publicados no Feed</p>
        </div>
        {!showForm && (
          <button type="button" onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-[var(--vd-blue-500)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
            <Plus className="size-4" /> Novo anúncio
          </button>
        )}
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="rounded-xl border border-[var(--vd-blue-500)]/30 bg-[var(--card)] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--foreground)]">
              {editingId ? "Editar anúncio" : "Novo anúncio"}
            </h3>
            <button type="button" onClick={cancelForm}
              className="grid size-7 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
              <X className="size-4" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <input type="text" placeholder="Título do anúncio" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30" />

            <textarea placeholder="Conteúdo…" rows={5} value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="resize-none rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30" />

            <div className="flex flex-wrap items-center gap-3">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm focus:outline-none">
                <option value="">Sem categoria</option>
                {cats.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
              </select>

              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isPinned}
                  onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                  className="size-4 accent-[var(--vd-blue-500)]" />
                <Pin className="size-3.5 text-[var(--muted-foreground)]" />
                <span className="font-medium text-[var(--foreground)]">Fixar no topo</span>
              </label>
            </div>

            {/* Role restriction */}
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                <Users className="size-3" />
                Visível para
              </div>
              {roles.length === 0 ? (
                <p className="text-xs text-[var(--muted-foreground)]">Sem roles configuradas.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((role) => {
                    const active = form.roleIds.includes(role.id);
                    return (
                      <button key={role.id} type="button" onClick={() => toggleRole(role.id)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                          active
                            ? "border-[var(--vd-blue-500)] bg-[var(--vd-blue-500)]/10 text-[var(--vd-blue-500)]"
                            : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--vd-blue-500)]/50",
                        )}>
                        {active && <Check className="size-3" />}
                        {role.name}
                      </button>
                    );
                  })}
                </div>
              )}
              {form.roleIds.length === 0 && (
                <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                  Sem restrição — visível a todos os utilizadores autenticados
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={submit} disabled={saving || !form.title.trim() || !form.content.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--vd-blue-500)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                <Save className="size-3.5" />
                {saving ? "A guardar…" : editingId ? "Guardar alterações" : "Publicar"}
              </button>
              <button type="button" onClick={cancelForm}
                className="rounded-lg border border-[var(--border)] bg-[var(--muted)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--accent)]">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--muted)]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <Megaphone className="mx-auto mb-3 size-8 text-[var(--muted-foreground)]" />
          <h3 className="m-0 text-base font-semibold text-[var(--foreground)]">Sem anúncios</h3>
          <p className="m-0 mt-1 text-sm text-[var(--muted-foreground)]">Cria o primeiro anúncio acima.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {items.map((a) => {
              const cat = cats.find((c) => c.slug === a.category);
              const date = new Date(a.publishedAt).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" });
              const initials = getInitials(a.author.givenName ?? "", a.author.familyName ?? "");
              const avatarBg = getAvatarColor(a.author.id);
              const roleNames = (Array.isArray(a.roleIds) ? a.roleIds : [])
                .map((rid) => roles.find((r) => r.id === rid)?.name)
                .filter(Boolean) as string[];

              return (
                <div key={a.id}
                  className={cn(
                    "rounded-xl border bg-[var(--card)] px-4 py-3",
                    a.isPinned ? "border-[var(--vd-orange-500)]/40" : "border-[var(--border)]",
                    deletingId === a.id && "opacity-50",
                  )}>
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    {a.author.image
                      ? <img src={a.author.image} alt="" className="size-8 shrink-0 rounded-full object-cover mt-0.5" />
                      : <div className="grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white mt-0.5"
                          style={{ background: avatarBg }}>{initials}</div>
                    }

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {a.isPinned && (
                          <Pin className="size-3 shrink-0 text-[var(--vd-orange-500)]" />
                        )}
                        <span className="font-semibold text-sm text-[var(--foreground)] truncate">{a.title}</span>
                        {cat && (
                          <span className="rounded-full px-2 py-px text-[10px] font-bold shrink-0"
                            style={{ background: cat.bg, color: cat.color }}>
                            {cat.label}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        {AUTHOR_DISPLAY(a.author)} · {date}
                        {roleNames.length > 0 && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[var(--vd-blue-500)]/10 px-2 py-px text-[10px] font-semibold text-[var(--vd-blue-500)]">
                            <Users className="size-2.5" />
                            {roleNames.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <button type="button" onClick={() => togglePin(a)} title={a.isPinned ? "Desafixar" : "Fixar"}
                        className={cn(
                          "grid size-7 place-items-center rounded-lg border transition-colors",
                          a.isPinned
                            ? "border-[var(--vd-orange-500)] text-[var(--vd-orange-500)] hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
                        )}>
                        <Pin className="size-3.5" />
                      </button>
                      <button type="button" onClick={() => openEdit(a)}
                        className="grid size-7 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
                        <Pencil className="size-3.5" />
                      </button>
                      <button type="button" onClick={() => deleteAnnouncement(a.id)} disabled={deletingId === a.id}
                        className="grid size-7 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 disabled:opacity-50">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {nextCursor && (
            <button type="button" onClick={() => load(nextCursor)} disabled={loadingMore}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] py-3 text-sm font-semibold text-[var(--muted-foreground)] hover:bg-[var(--accent)] disabled:opacity-50">
              {loadingMore ? "A carregar…" : "Ver mais"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
