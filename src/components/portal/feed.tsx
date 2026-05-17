"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Megaphone, Pin, X } from "lucide-react";
import { confirm } from "@/components/ui/confirm-dialog";
import { getInitials, getAvatarColor } from "@/lib/avatar";
import { usePermissions } from "@/hooks/use-permissions";
import { useSession } from "next-auth/react";
import { SECTIONS } from "@/lib/sections";
import { cn } from "@/lib/utils";

/* ─── Types ─── */

type AuthorMini = {
  id: string; givenName: string | null; familyName: string | null;
  name: string | null; image: string | null; jobTitle?: string | null;
};

type ReactionCount = { emoji: string; count: number };

type Announcement = {
  id: string; title: string; content: string;
  category: string | null; isPinned: boolean; publishedAt: string;
  roleIds: string[];
  author: AuthorMini;
  _count: { reactions: number; comments: number };
  reactions: { emoji: string }[]; // current user's reactions
};

type FormState = { title: string; content: string; category: string; isPinned: boolean };
const EMPTY_FORM: FormState = { title: "", content: "", category: "", isPinned: false };

type Category = { id: string; slug: string; label: string; color: string; bg: string };

const EMOJIS = ["👍", "❤️", "🎉", "👏", "🙌"];

function getCatMeta(slug: string | null, cats: Category[]) {
  return cats.find((c) => c.slug === slug) ?? null;
}

/* ─── Main component ─── */

export function Feed() {
  const { isAdmin, can } = usePermissions();
  const { data: session } = useSession();
  const canWrite = isAdmin || can(SECTIONS.ANNOUNCEMENTS_WRITE);

  const [cats, setCats] = useState<Category[]>([]);
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterCat, setFilterCat] = useState<string>("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (cursor?: string, cat?: string) => {
    if (!cursor) setLoading(true); else setLoadingMore(true);
    const params = new URLSearchParams({ limit: "10" });
    if (cursor) params.set("cursor", cursor);
    if (cat) params.set("category", cat);
    const res = await fetch(`/api/announcements?${params}`);
    const data = await res.json();
    setItems((prev) => cursor ? [...prev, ...(data.announcements ?? [])] : (data.announcements ?? []));
    setNextCursor(data.nextCursor ?? null);
    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    fetch("/api/announcement-categories")
      .then((r) => r.json())
      .then((d) => setCats(d.categories ?? []));
  }, []);

  useEffect(() => { load(undefined, filterCat); }, [load, filterCat]);

  function openCreate() { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true); }
  function openEdit(a: Announcement) {
    setEditingId(a.id);
    setForm({ title: a.title, content: a.content, category: a.category ?? "", isPinned: a.isPinned });
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
      if (res.ok) {
        const d = await res.json();
        setItems((prev) => prev.map((a) => a.id === editingId ? d.announcement : a));
        cancelForm();
      }
    } else {
      const res = await fetch("/api/announcements", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (res.ok) {
        const d = await res.json();
        setItems((prev) => {
          const pinned = prev.filter((a) => a.isPinned);
          const rest = prev.filter((a) => !a.isPinned);
          return d.announcement.isPinned ? [d.announcement, ...pinned, ...rest] : [...pinned, d.announcement, ...rest];
        });
        cancelForm();
      }
    }
    setSaving(false);
  }

  async function deleteAnnouncement(id: string) {
    if (!await confirm({ message: "Apagar este anúncio?", variant: "danger", confirmLabel: "Apagar" })) return;
    setDeletingId(id);
    const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((a) => a.id !== id));
    setDeletingId(null);
  }

  function handleReaction(id: string, counts: ReactionCount[], mine: string[]) {
    setItems((prev) => prev.map((a) => {
      if (a.id !== id) return a;
      return {
        ...a,
        _count: { ...a._count, reactions: counts.reduce((s, c) => s + c.count, 0) },
        reactions: mine.map((emoji) => ({ emoji })),
      };
    }));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUserId = (session?.user as any)?.id ?? null;

  return (
    <div className="flex min-h-full flex-col gap-4 bg-[var(--muted)] p-4 sm:gap-5 sm:p-6 lg:p-8">

      {/* Header */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="vd-eyebrow mb-1">Newsroom</div>
            <h2 className="m-0 text-xl font-bold text-[var(--vd-blue-500)] dark:text-[var(--foreground)] sm:text-2xl"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.015em" }}>
              Anúncios da empresa
            </h2>
          </div>
          {canWrite && !showForm && (
            <button type="button" onClick={openCreate}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-[var(--vd-blue-500)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
              <Plus className="size-4" /> Novo anúncio
            </button>
          )}
        </div>

        {/* Filtros por categoria */}
        {cats.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setFilterCat("")}
              className={cn("rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                !filterCat ? "bg-[var(--vd-blue-500)] text-white" : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]")}>
              Todos
            </button>
            {cats.map((c) => (
              <button key={c.slug} type="button" onClick={() => setFilterCat(c.slug === filterCat ? "" : c.slug)}
                className="rounded-full px-3 py-1 text-xs font-semibold transition-opacity hover:opacity-80"
                style={{
                  background: filterCat === c.slug ? c.color : c.bg,
                  color: filterCat === c.slug ? "#fff" : c.color,
                }}>
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* Formulário */}
        {showForm && (
          <AnnouncementForm
            form={form}
            cats={cats}
            editing={!!editingId}
            saving={saving}
            onChange={setForm}
            onSubmit={submit}
            onCancel={cancelForm}
          />
        )}
      </section>

      {/* Lista */}
      {loading ? (
        <LoadingSkeleton />
      ) : items.length === 0 ? (
        <EmptyState canWrite={canWrite} onNew={openCreate} />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              cats={cats}
              canEdit={canWrite || a.author.id === currentUserId}
              canAdmin={isAdmin}
              deleting={deletingId === a.id}
              onEdit={() => openEdit(a)}
              onDelete={() => deleteAnnouncement(a.id)}
              onReaction={(counts, mine) => handleReaction(a.id, counts, mine)}
            />
          ))}
          {nextCursor && (
            <button type="button" onClick={() => load(nextCursor, filterCat)} disabled={loadingMore}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] py-3 text-sm font-semibold text-[var(--muted-foreground)] hover:bg-[var(--accent)] disabled:opacity-50">
              {loadingMore ? "A carregar…" : "Ver mais"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Formulário ─── */

function AnnouncementForm({ form, cats, editing, saving, onChange, onSubmit, onCancel }: {
  form: FormState;
  cats: Category[];
  editing: boolean;
  saving: boolean;
  onChange: (f: FormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-5 rounded-xl border border-[var(--vd-blue-500)]/30 bg-[var(--muted)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--foreground)]">{editing ? "Editar anúncio" : "Novo anúncio"}</h3>
        <button type="button" onClick={onCancel} className="grid size-6 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--accent)]">
          <X className="size-3.5" />
        </button>
      </div>
      <div className="flex flex-col gap-3">
        <input type="text" placeholder="Título do anúncio"
          value={form.title} onChange={(e) => onChange({ ...form, title: e.target.value })}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30" />

        <textarea placeholder="Conteúdo do anúncio…" rows={5}
          value={form.content} onChange={(e) => onChange({ ...form, content: e.target.value })}
          className="resize-none rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30" />

        <div className="flex flex-wrap items-center gap-3">
          <select value={form.category} onChange={(e) => onChange({ ...form, category: e.target.value })}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30">
            <option value="">Sem categoria</option>
            {cats.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
          </select>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isPinned} onChange={(e) => onChange({ ...form, isPinned: e.target.checked })}
              className="size-4 rounded accent-[var(--vd-blue-500)]" />
            <Pin className="size-3.5 text-[var(--muted-foreground)]" />
            <span className="font-medium text-[var(--foreground)]">Fixar no topo</span>
          </label>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onSubmit} disabled={saving || !form.title.trim() || !form.content.trim()}
            className="rounded-lg bg-[var(--vd-blue-500)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? "A guardar…" : editing ? "Guardar alterações" : "Publicar"}
          </button>
          <button type="button" onClick={onCancel}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--accent)]">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Card ─── */

function AnnouncementCard({ announcement: a, cats, canEdit, canAdmin, deleting, onEdit, onDelete, onReaction }: {
  announcement: Announcement;
  cats: Category[];
  canEdit: boolean;
  canAdmin: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReaction: (counts: ReactionCount[], mine: string[]) => void;
}) {
  const [reactionCounts, setReactionCounts] = useState<ReactionCount[]>([]);
  const [myReactions, setMyReactions] = useState<string[]>(a.reactions.map((r) => r.emoji));
  const [loadingReact, setLoadingReact] = useState(false);

  const authorName = a.author.givenName && a.author.familyName
    ? `${a.author.givenName} ${a.author.familyName}` : (a.author.name ?? "—");
  const initials = getInitials(a.author.givenName ?? "", a.author.familyName ?? "");
  const avatarBg = getAvatarColor(a.author.id);
  const date = new Date(a.publishedAt).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });
  const cat = getCatMeta(a.category, cats);

  // Load reaction counts on mount
  useEffect(() => {
    const myEmojis = a.reactions.map((r) => r.emoji);
    setMyReactions(myEmojis);
  }, [a.reactions]);

  async function toggleReact(emoji: string) {
    if (loadingReact) return;
    setLoadingReact(true);
    // Optimistic
    const alreadyMine = myReactions.includes(emoji);
    setMyReactions((prev) => alreadyMine ? prev.filter((e) => e !== emoji) : [...prev, emoji]);
    const res = await fetch(`/api/announcements/${a.id}/react`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ emoji }),
    });
    if (res.ok) {
      const d = await res.json();
      setReactionCounts(d.counts);
      setMyReactions(d.mine);
      onReaction(d.counts, d.mine);
    }
    setLoadingReact(false);
  }

  // Merge server _count with local counts
  const totalReactions = reactionCounts.length > 0
    ? reactionCounts.reduce((s, c) => s + c.count, 0)
    : a._count.reactions;

  return (
    <article className={cn(
      "rounded-2xl border bg-[var(--card)] transition-shadow hover:shadow-sm",
      a.isPinned ? "border-[var(--vd-orange-500)]/40" : "border-[var(--border)]",
      deleting && "opacity-50",
    )}>
      {/* Pin banner */}
      {a.isPinned && (
        <div className="flex items-center gap-1.5 rounded-t-2xl border-b border-[var(--vd-orange-500)]/20 bg-[var(--vd-orange-50)] px-5 py-1.5">
          <Pin className="size-3 text-[var(--vd-orange-500)]" />
          <span className="text-[11px] font-semibold text-[var(--vd-orange-500)]">Anúncio fixado</span>
        </div>
      )}

      <div className="p-5 sm:p-6">
        {/* Author + meta */}
        <div className="group mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {a.author.image
              ? <img src={a.author.image} alt="" className="size-9 shrink-0 rounded-full object-cover" />
              : <div className="grid size-9 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: avatarBg }}>{initials}</div>
            }
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-[var(--foreground)]">{authorName}</span>
                {cat && (
                  <span className="rounded-full px-2 py-px text-[10px] font-bold"
                    style={{ background: cat.bg, color: cat.color }}>
                    {cat.label}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[var(--muted-foreground)]">
                {a.author.jobTitle ? `${a.author.jobTitle} · ` : ""}{date}
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {canAdmin && (
                <button type="button" onClick={async () => {
                  const res = await fetch(`/api/announcements/${a.id}`, {
                    method: "PATCH", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isPinned: !a.isPinned }),
                  });
                  if (res.ok) onEdit(); // trigger reload via parent
                }}
                  title={a.isPinned ? "Desafixar" : "Fixar"}
                  className={cn("grid size-8 place-items-center rounded-lg border text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
                    a.isPinned ? "border-[var(--vd-orange-500)] text-[var(--vd-orange-500)]" : "border-[var(--border)]")}>
                  <Pin className="size-3.5" />
                </button>
              )}
              <button type="button" onClick={onEdit}
                className="grid size-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
                <Pencil className="size-3.5" />
              </button>
              <button type="button" onClick={onDelete} disabled={deleting}
                className="grid size-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Título + conteúdo */}
        <h3 className="m-0 mb-2 text-[17px] font-bold leading-snug text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>
          {a.title}
        </h3>
        <p className="m-0 whitespace-pre-line text-sm leading-relaxed text-[var(--muted-foreground)]">
          {a.content}
        </p>

        {/* Reactions + comments bar */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3">
          {/* Emoji buttons */}
          {EMOJIS.map((emoji) => {
            const count = reactionCounts.find((c) => c.emoji === emoji)?.count
              ?? (myReactions.includes(emoji) ? 1 : 0);
            const isMine = myReactions.includes(emoji);
            return (
              <button key={emoji} type="button" onClick={() => toggleReact(emoji)}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  isMine
                    ? "border-[var(--vd-blue-500)] bg-[var(--vd-blue-500)]/10 text-[var(--vd-blue-500)]"
                    : "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] hover:border-[var(--vd-blue-500)]/40 hover:bg-[var(--vd-blue-500)]/5",
                )}>
                <span>{emoji}</span>
                {count > 0 && <span>{count}</span>}
              </button>
            );
          })}

        </div>
      </div>
    </article>
  );
}

/* ─── Skeletons / Empty ─── */

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="size-9 rounded-full bg-[var(--muted)]" />
            <div className="space-y-1.5">
              <div className="h-3 w-28 rounded bg-[var(--muted)]" />
              <div className="h-2.5 w-20 rounded bg-[var(--muted)]" />
            </div>
          </div>
          <div className="mb-2 h-5 w-3/4 rounded bg-[var(--muted)]" />
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded bg-[var(--muted)]" />
            <div className="h-3 w-5/6 rounded bg-[var(--muted)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ canWrite, onNew }: { canWrite: boolean; onNew: () => void }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-full bg-[var(--muted)]">
        <Megaphone className="size-5 text-[var(--muted-foreground)]" />
      </div>
      <h3 className="m-0 text-base font-semibold text-[var(--foreground)]">Sem anúncios</h3>
      <p className="m-0 mt-1 max-w-xs text-sm text-[var(--muted-foreground)]">Ainda não foram publicados anúncios.</p>
      {canWrite && (
        <button type="button" onClick={onNew}
          className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--vd-blue-500)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90">
          <Plus className="size-3.5" /> Criar primeiro anúncio
        </button>
      )}
    </div>
  );
}
