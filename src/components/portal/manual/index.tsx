"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus, Pencil, Trash2, BookOpen, History, ChevronRight,
  X, Folder, FolderPlus, Save, Clock, RotateCcw, Search, GripVertical,
} from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { SECTIONS } from "@/lib/sections";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "./rich-text-editor";
import { getInitials, getAvatarColor } from "@/lib/avatar";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  order: number;
  _count: { articles: number };
};

type AuthorMini = {
  id: string;
  givenName: string | null;
  familyName: string | null;
  name: string | null;
  image: string | null;
};

type Version = {
  id: string;
  title: string;
  content: string;
  changeNote: string | null;
  createdAt: string;
  author: AuthorMini;
};

type Article = {
  id: string;
  slug: string;
  order: number;
  categoryId: string;
  category: { id: string; name: string; slug: string; color: string | null };
  currentVersion: Version | null;
};

type Mode = "view" | "edit" | "create" | "history";

export function Manual() {
  const { isAdmin, can } = usePermissions();
  const canWrite = isAdmin || can(SECTIONS.MANUAL_WRITE);

  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    const [catsRes, artsRes] = await Promise.all([
      fetch("/api/manual/categories"),
      fetch("/api/manual/articles"),
    ]);
    const catsData = await catsRes.json();
    const artsData = await artsRes.json();
    setCategories(catsData.categories ?? []);
    setArticles(artsData.articles ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const activeArticle = articles.find((a) => a.id === activeArticleId) ?? null;

  const searchLower = search.toLowerCase().trim();
  const searchedArticles = searchLower
    ? articles.filter((a) => {
        const title = a.currentVersion?.title.toLowerCase() ?? "";
        const content = a.currentVersion?.content.replace(/<[^>]*>/g, " ").toLowerCase() ?? "";
        return title.includes(searchLower) || content.includes(searchLower);
      })
    : articles;

  const displayedArticles = activeCategoryId && !searchLower
    ? searchedArticles.filter((a) => a.categoryId === activeCategoryId)
    : searchedArticles;

  function handleSelectArticle(id: string) {
    setActiveArticleId(id);
    setMode("view");
  }

  function handleNew() {
    setActiveArticleId(null);
    setMode("create");
  }

  async function handleSaveArticle(payload: {
    id?: string;
    title: string;
    content: string;
    categoryId: string;
    changeNote?: string;
  }) {
    if (payload.id) {
      const res = await fetch(`/api/manual/articles/${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await loadData();
        setActiveArticleId(payload.id);
        setMode("view");
      }
    } else {
      const res = await fetch("/api/manual/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        await loadData();
        setActiveArticleId(data.article.id);
        setMode("view");
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Arquivar este artigo? O histórico fica preservado.")) return;
    const res = await fetch(`/api/manual/articles/${id}`, { method: "DELETE" });
    if (res.ok) {
      await loadData();
      setActiveArticleId(null);
      setMode("view");
    }
  }

  async function handleReorderArticles(ids: string[]) {
    setArticles((prev) => {
      const map = new Map(prev.map((a) => [a.id, a]));
      return [
        ...ids.map((id, idx) => ({ ...map.get(id)!, order: idx })),
        ...prev.filter((a) => !ids.includes(a.id)),
      ];
    });
    await fetch("/api/manual/articles/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
  }

  async function handleReorderCategories(ids: string[]) {
    setCategories((prev) => {
      const map = new Map(prev.map((c) => [c.id, c]));
      return ids.map((id, idx) => ({ ...map.get(id)!, order: idx }));
    });
    await fetch("/api/manual/categories/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
  }

  async function handleMoveArticle(articleId: string, toCategoryId: string) {
    setArticles((prev) =>
      prev.map((a) => a.id === articleId ? { ...a, categoryId: toCategoryId } : a)
    );
    await fetch(`/api/manual/articles/${articleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: toCategoryId }),
    });
    // Reload to get updated _count on categories
    await loadData();
  }

  return (
    <div className="flex h-full bg-[var(--muted)]">
      <ManualSidebar
        categories={categories}
        articles={displayedArticles}
        allArticles={articles}
        activeArticleId={activeArticleId}
        activeCategoryId={activeCategoryId}
        canWrite={canWrite}
        search={search}
        onSearch={setSearch}
        onSelectArticle={handleSelectArticle}
        onSelectCategory={(id) => { setActiveCategoryId(id); setSearch(""); }}
        onNew={handleNew}
        onCategoriesChange={loadData}
        onReorderArticles={handleReorderArticles}
        onReorderCategories={handleReorderCategories}
        onMoveArticle={handleMoveArticle}
        loading={loading}
      />

      <div className="flex-1 overflow-auto">
        {mode === "create" || mode === "edit" ? (
          <ArticleEditor
            article={mode === "edit" ? activeArticle : null}
            categories={categories}
            onCancel={() => {
              setMode(activeArticle ? "view" : "view");
              if (mode === "create") setActiveArticleId(null);
            }}
            onSave={handleSaveArticle}
          />
        ) : mode === "history" && activeArticle ? (
          <ArticleHistory
            article={activeArticle}
            canWrite={canWrite}
            onClose={() => setMode("view")}
            onRestored={loadData}
          />
        ) : activeArticle ? (
          <ArticleViewer
            article={activeArticle}
            canWrite={canWrite}
            search={searchLower}
            onEdit={() => setMode("edit")}
            onDelete={() => handleDelete(activeArticle.id)}
            onShowHistory={() => setMode("history")}
          />
        ) : (
          <EmptyState canWrite={canWrite} onNew={handleNew} />
        )}
      </div>
    </div>
  );
}

/* ---------- Sidebar ---------- */

// Drag payload encoded in dataTransfer
const DT_ARTICLE = "application/x-manual-article";
const DT_CATEGORY = "application/x-manual-category";

function ManualSidebar({
  categories, articles, allArticles, activeArticleId, activeCategoryId, canWrite,
  search, onSearch, onSelectArticle, onSelectCategory, onNew, onCategoriesChange,
  onReorderArticles, onReorderCategories, onMoveArticle, loading,
}: {
  categories: Category[];
  articles: Article[];
  allArticles: Article[];
  activeArticleId: string | null;
  activeCategoryId: string | null;
  canWrite: boolean;
  search: string;
  onSearch: (s: string) => void;
  onSelectArticle: (id: string) => void;
  onSelectCategory: (id: string | null) => void;
  onNew: () => void;
  onCategoriesChange: () => void;
  onReorderArticles: (ids: string[]) => void;
  onReorderCategories: (ids: string[]) => void;
  onMoveArticle: (articleId: string, toCategoryId: string) => void;
  loading: boolean;
}) {
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [savingCat, setSavingCat] = useState(false);

  // Drag state for categories
  const [catItems, setCatItems] = useState(categories);
  const [draggingCatId, setDraggingCatId] = useState<string | null>(null);
  const [overCatId, setOverCatId] = useState<string | null>(null);
  const [catDropTarget, setCatDropTarget] = useState<string | null>(null); // for article→folder drop
  const catSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setCatItems(categories); }, [categories]);

  async function createCategory() {
    if (!newCatName.trim()) return;
    setSavingCat(true);
    const res = await fetch("/api/manual/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName.trim() }),
    });
    if (res.ok) {
      setNewCatName("");
      setShowNewCategory(false);
      onCategoriesChange();
    }
    setSavingCat(false);
  }

  // --- Category drag handlers ---
  function onCatDragStart(e: React.DragEvent, id: string) {
    setDraggingCatId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(DT_CATEGORY, id);
  }

  function onCatDragOver(e: React.DragEvent, id: string) {
    // Accept either a category (reorder) or an article (move into folder)
    if (e.dataTransfer.types.includes(DT_ARTICLE)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setCatDropTarget(id);
      return;
    }
    if (e.dataTransfer.types.includes(DT_CATEGORY)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setOverCatId(id);
    }
  }

  function onCatDragLeave() {
    setOverCatId(null);
    setCatDropTarget(null);
  }

  function onCatDrop(e: React.DragEvent, targetCatId: string) {
    e.preventDefault();
    // Article dropped onto a folder → move article
    const artId = e.dataTransfer.getData(DT_ARTICLE);
    if (artId) {
      const art = allArticles.find((a) => a.id === artId);
      if (art && art.categoryId !== targetCatId) {
        onMoveArticle(artId, targetCatId);
      }
      setCatDropTarget(null);
      return;
    }
    // Category dropped onto another category → reorder
    const srcId = e.dataTransfer.getData(DT_CATEGORY);
    if (!srcId || srcId === targetCatId) { setDraggingCatId(null); setOverCatId(null); return; }
    const reordered = [...catItems];
    const from = reordered.findIndex((c) => c.id === srcId);
    const to = reordered.findIndex((c) => c.id === targetCatId);
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setCatItems(reordered);
    setDraggingCatId(null);
    setOverCatId(null);
    if (catSaveTimer.current) clearTimeout(catSaveTimer.current);
    catSaveTimer.current = setTimeout(() => {
      onReorderCategories(reordered.map((c) => c.id));
    }, 400);
  }

  function onCatDragEnd() {
    setDraggingCatId(null);
    setOverCatId(null);
    setCatDropTarget(null);
  }

  const isSearching = search.trim().length > 0;

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--card)] lg:flex">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-4 py-3">
        <div className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">Manual</div>
        {canWrite && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setShowNewCategory((v) => !v)}
              className="grid size-7 place-items-center rounded text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]"
              title="Nova categoria"
            >
              <FolderPlus className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={onNew}
              className="grid size-7 place-items-center rounded bg-[var(--vd-blue-500)] text-white transition-opacity hover:opacity-90"
              title="Novo artigo"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="border-b border-[var(--border)] px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Pesquisar artigos…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--muted)] py-1.5 pl-8 pr-7 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {showNewCategory && (
        <div className="border-b border-[var(--border)] bg-[var(--muted)] p-3">
          <input
            type="text"
            placeholder="Nome da categoria"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") createCategory(); }}
            autoFocus
            className="mb-2 w-full rounded border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
          />
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={createCategory}
              disabled={savingCat || !newCatName.trim()}
              className="flex-1 rounded bg-[var(--vd-blue-500)] px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
            >
              {savingCat ? "…" : "Criar"}
            </button>
            <button
              type="button"
              onClick={() => { setShowNewCategory(false); setNewCatName(""); }}
              className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--muted-foreground)] hover:bg-[var(--card)]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <SidebarSkeleton />
        ) : isSearching ? (
          <SearchResults
            articles={articles}
            query={search}
            activeArticleId={activeArticleId}
            onSelect={onSelectArticle}
          />
        ) : (
          <>
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className={cn(
                "mb-1 flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-semibold transition-colors",
                activeCategoryId === null
                  ? "bg-[var(--accent)] text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
              )}
            >
              <BookOpen className="size-3.5" />
              Todos os artigos
              <span className="ml-auto text-[10px] opacity-60">{allArticles.length}</span>
            </button>

            {catItems.map((cat) => {
              const arts = allArticles.filter((a) => a.categoryId === cat.id);
              const isActive = activeCategoryId === cat.id;
              const isDropTarget = catDropTarget === cat.id;
              const isDraggingOver = overCatId === cat.id && draggingCatId !== cat.id;

              return (
                <div
                  key={cat.id}
                  className={cn(
                    "mb-1 rounded-md transition-colors",
                    isDraggingOver && "ring-1 ring-[var(--vd-blue-500)]",
                    isDropTarget && "ring-2 ring-[var(--vd-orange-500)] bg-[var(--vd-orange-500)]/5",
                    draggingCatId === cat.id && "opacity-40",
                  )}
                  draggable={canWrite}
                  onDragStart={(e) => canWrite && onCatDragStart(e, cat.id)}
                  onDragOver={(e) => canWrite && onCatDragOver(e, cat.id)}
                  onDragLeave={onCatDragLeave}
                  onDrop={(e) => canWrite && onCatDrop(e, cat.id)}
                  onDragEnd={onCatDragEnd}
                >
                  <div className="group flex items-center">
                    {canWrite && (
                      <GripVertical className="ml-0.5 size-3 shrink-0 cursor-grab text-[var(--muted-foreground)] opacity-0 group-hover:opacity-60" />
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectCategory(isActive ? null : cat.id)}
                      className={cn(
                        "flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold transition-colors",
                        isActive
                          ? "bg-[var(--accent)] text-[var(--foreground)]"
                          : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]",
                      )}
                    >
                      <Folder className="size-3.5 shrink-0" style={{ color: cat.color ?? undefined }} />
                      <span className="truncate">{cat.name}</span>
                      <span className="ml-auto text-[10px] opacity-60">{cat._count.articles}</span>
                      <ChevronRight className={cn("size-3 transition-transform", isActive && "rotate-90")} />
                    </button>
                  </div>

                  {isActive && (
                    <div className="ml-3 mt-0.5 border-l border-[var(--border)] pl-2">
                      {arts.length === 0 && (
                        <div className="px-2 py-1.5 text-[11px] italic text-[var(--muted-foreground)]/60">
                          Sem artigos
                        </div>
                      )}
                      {canWrite ? (
                        <DraggableArticleList
                          articles={arts}
                          activeArticleId={activeArticleId}
                          onSelect={onSelectArticle}
                          onReorder={onReorderArticles}
                        />
                      ) : (
                        arts.map((a) => (
                          <ArticleRow
                            key={a.id}
                            article={a}
                            active={activeArticleId === a.id}
                            onClick={() => onSelectArticle(a.id)}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {activeCategoryId === null && allArticles.length > 0 && (
              <div className="mt-2 border-t border-[var(--border)] pt-2">
                {allArticles.map((a) => (
                  <ArticleRow
                    key={a.id}
                    article={a}
                    active={activeArticleId === a.id}
                    onClick={() => onSelectArticle(a.id)}
                    showCategory
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

/* ---------- Pesquisa com destaque ---------- */

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-yellow-200 px-px text-yellow-900 dark:bg-yellow-500/40 dark:text-yellow-200">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function getContentSnippet(html: string, query: string, radius = 80): string {
  const plain = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const idx = plain.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return plain.slice(0, radius * 2);
  const start = Math.max(0, idx - radius);
  const end = Math.min(plain.length, idx + query.length + radius);
  return (start > 0 ? "…" : "") + plain.slice(start, end) + (end < plain.length ? "…" : "");
}

function SearchResults({
  articles, query, activeArticleId, onSelect,
}: {
  articles: Article[];
  query: string;
  activeArticleId: string | null;
  onSelect: (id: string) => void;
}) {
  const q = query.toLowerCase().trim();

  if (articles.length === 0) {
    return (
      <div className="px-2 py-6 text-center text-xs text-[var(--muted-foreground)]">
        Nenhum resultado para <strong>&ldquo;{query}&rdquo;</strong>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        {articles.length} resultado{articles.length !== 1 ? "s" : ""}
      </div>
      {articles.map((a) => {
        const title = a.currentVersion?.title ?? "—";
        const titleMatch = title.toLowerCase().includes(q);
        const contentSnippet = !titleMatch && a.currentVersion?.content
          ? getContentSnippet(a.currentVersion.content, query)
          : null;

        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onSelect(a.id)}
            className={cn(
              "mb-1 flex w-full flex-col gap-0.5 rounded-md px-2.5 py-2 text-left text-xs transition-colors",
              activeArticleId === a.id
                ? "bg-[var(--vd-blue-500)]/10 font-semibold text-[var(--vd-blue-500)]"
                : "text-[var(--foreground)] hover:bg-[var(--muted)]",
            )}
          >
            <span className="truncate font-medium">{highlight(title, query)}</span>
            <span className="text-[10px] text-[var(--muted-foreground)]" style={{ color: a.category.color ?? undefined }}>
              {a.category.name}
            </span>
            {contentSnippet && (
              <span className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-[var(--muted-foreground)]/80">
                {highlight(contentSnippet, query)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Drag-and-drop (artigos dentro de pasta) ---------- */

function DraggableArticleList({
  articles, activeArticleId, onSelect, onReorder,
}: {
  articles: Article[];
  activeArticleId: string | null;
  onSelect: (id: string) => void;
  onReorder: (ids: string[]) => void;
}) {
  const [items, setItems] = useState(articles);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setItems(articles); }, [articles]);

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(DT_ARTICLE, id);
    // Prevent the category drag handler from also firing
    e.stopPropagation();
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    // Only handle within this list — category handler takes priority for cross-folder
    if (!e.dataTransfer.types.includes(DT_ARTICLE)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (id !== overId) setOverId(id);
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    if (!e.dataTransfer.types.includes(DT_ARTICLE)) return;
    e.preventDefault();
    e.stopPropagation();
    const srcId = e.dataTransfer.getData(DT_ARTICLE);
    if (!srcId || srcId === targetId) return;

    const reordered = [...items];
    const fromIdx = reordered.findIndex((a) => a.id === srcId);
    const toIdx = reordered.findIndex((a) => a.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    setItems(reordered);
    setDraggingId(null);
    setOverId(null);

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onReorder(reordered.map((a) => a.id));
    }, 400);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setOverId(null);
  }

  return (
    <>
      {items.map((a) => (
        <div
          key={a.id}
          draggable
          onDragStart={(e) => handleDragStart(e, a.id)}
          onDragOver={(e) => handleDragOver(e, a.id)}
          onDrop={(e) => handleDrop(e, a.id)}
          onDragEnd={handleDragEnd}
          className={cn(
            "group relative transition-opacity",
            draggingId === a.id && "opacity-40",
            overId === a.id && draggingId !== a.id && "ring-1 ring-[var(--vd-blue-500)] rounded-md",
          )}
        >
          <div className="absolute left-0 top-0 flex h-full cursor-grab items-center pl-0.5 opacity-0 group-hover:opacity-100">
            <GripVertical className="size-3 text-[var(--muted-foreground)]" />
          </div>
          <div className="pl-4">
            <ArticleRow
              article={a}
              active={activeArticleId === a.id}
              onClick={() => onSelect(a.id)}
            />
          </div>
        </div>
      ))}
    </>
  );
}

/* ---------- Article Row ---------- */

function ArticleRow({
  article, active, onClick, showCategory,
}: {
  article: Article;
  active: boolean;
  onClick: () => void;
  showCategory?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col gap-0.5 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
        active
          ? "bg-[var(--vd-blue-500)]/10 font-semibold text-[var(--vd-blue-500)] dark:bg-[var(--vd-blue-500)]/20 dark:text-[var(--foreground)]"
          : "text-[var(--foreground)] hover:bg-[var(--muted)]",
      )}
    >
      <span className="truncate">{article.currentVersion?.title ?? "—"}</span>
      {showCategory && (
        <span className="truncate text-[10px] text-[var(--muted-foreground)]">{article.category.name}</span>
      )}
    </button>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-7 animate-pulse rounded bg-[var(--muted)]" />
      ))}
    </div>
  );
}

/* ---------- Article Viewer ---------- */

function ArticleViewer({
  article, canWrite, search, onEdit, onDelete, onShowHistory,
}: {
  article: Article;
  canWrite: boolean;
  search: string;
  onEdit: () => void;
  onDelete: () => void;
  onShowHistory: () => void;
}) {
  const v = article.currentVersion;
  if (!v) return null;
  const updated = new Date(v.createdAt).toLocaleDateString("pt-PT", {
    day: "numeric", month: "long", year: "numeric",
  });
  const authorName = v.author.givenName && v.author.familyName
    ? `${v.author.givenName} ${v.author.familyName}`
    : v.author.name ?? "—";
  const initials = getInitials(v.author.givenName ?? "", v.author.familyName ?? "");
  const avatarBg = getAvatarColor(v.author.id);

  // Highlight search terms in content
  const renderedContent = search
    ? highlightHtml(v.content, search)
    : v.content;

  return (
    <article className="mx-auto max-w-3xl p-6 sm:p-8 lg:p-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="rounded-full bg-[var(--card)] px-2.5 py-1 text-[11px] font-semibold text-[var(--muted-foreground)]">
          {article.category.name}
        </span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onShowHistory}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
          >
            <History className="size-3.5" /> Histórico
          </button>
          {canWrite && (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--vd-blue-500)] px-2.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"
              >
                <Pencil className="size-3.5" /> Editar
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="grid size-7 place-items-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                title="Arquivar"
              >
                <Trash2 className="size-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      <h1
        className="m-0 mb-3 text-3xl font-bold leading-tight text-[var(--foreground)] sm:text-4xl"
        style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.025em" }}
      >
        {search ? highlight(v.title, search) : v.title}
      </h1>

      <div className="mb-6 flex items-center gap-2 border-b border-[var(--border)] pb-4 text-xs text-[var(--muted-foreground)]">
        {v.author.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.author.image} alt="" className="size-5 rounded-full object-cover" />
        ) : (
          <span
            className="grid size-5 place-items-center rounded-full text-[8px] font-bold text-white"
            style={{ background: avatarBg }}
          >
            {initials}
          </span>
        )}
        <span>Última edição por <strong className="text-[var(--foreground)]">{authorName}</strong></span>
        <span>·</span>
        <span>{updated}</span>
      </div>

      <div className="vd-richtext" dangerouslySetInnerHTML={{ __html: renderedContent }} />
    </article>
  );
}

function highlightHtml(html: string, query: string): string {
  if (!query) return html;
  // Only highlight text nodes — avoid breaking tags
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.replace(
    new RegExp(`(?<!<[^>]*)(${escaped})(?![^<]*>)`, "gi"),
    '<mark style="background:rgb(254 240 138);color:rgb(113 63 18);border-radius:2px;padding:0 2px">$1</mark>',
  );
}

/* ---------- Article Editor ---------- */

function ArticleEditor({
  article, categories, onCancel, onSave,
}: {
  article: Article | null;
  categories: Category[];
  onCancel: () => void;
  onSave: (payload: {
    id?: string;
    title: string;
    content: string;
    categoryId: string;
    changeNote?: string;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState(article?.currentVersion?.title ?? "");
  const [content, setContent] = useState(article?.currentVersion?.content ?? "");
  const [categoryId, setCategoryId] = useState(article?.categoryId ?? categories[0]?.id ?? "");
  const [changeNote, setChangeNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim() || !content.trim() || !categoryId) return;
    setSaving(true);
    await onSave({
      id: article?.id,
      title: title.trim(),
      content,
      categoryId,
      changeNote: changeNote.trim() || undefined,
    });
    setSaving(false);
  }

  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-8 lg:p-10">
      <div className="mb-4 flex items-center justify-between">
        <div className="vd-eyebrow">{article ? "Editar artigo" : "Novo artigo"}</div>
        <button
          type="button"
          onClick={onCancel}
          className="grid size-7 place-items-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Categoria
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
          >
            {categories.length === 0 && <option value="">Sem categorias — cria uma primeiro</option>}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do artigo"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2.5 text-base font-semibold text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Conteúdo
          </label>
          <RichTextEditor value={content} onChange={setContent} />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Nota de alteração <span className="text-[var(--muted-foreground)]/60">(opcional, para auditoria)</span>
          </label>
          <input
            type="text"
            value={changeNote}
            onChange={(e) => setChangeNote(e.target.value)}
            placeholder="ex: Atualizado processo de onboarding após feedback do RH"
            maxLength={500}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--accent)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !title.trim() || !content.trim() || !categoryId}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--vd-blue-500)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Save className="size-3.5" />
            {saving ? "A guardar…" : article ? "Guardar nova versão" : "Publicar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Article History ---------- */

function ArticleHistory({
  article, canWrite, onClose, onRestored,
}: {
  article: Article;
  canWrite: boolean;
  onClose: () => void;
  onRestored: () => void;
}) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/manual/articles/${article.id}/versions`);
      const data = await res.json();
      setVersions(data.versions ?? []);
      setCurrentVersionId(data.currentVersionId);
      setSelectedId(data.versions?.[0]?.id ?? null);
      setLoading(false);
    })();
  }, [article.id]);

  async function restore(versionId: string) {
    if (!confirm("Restaurar esta versão? Vai criar uma nova versão com este conteúdo.")) return;
    setRestoring(true);
    const res = await fetch(`/api/manual/articles/${article.id}/restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId }),
    });
    if (res.ok) {
      onRestored();
      onClose();
    }
    setRestoring(false);
  }

  const selected = versions.find((v) => v.id === selectedId);

  return (
    <div className="flex h-full">
      <div className="w-72 shrink-0 overflow-y-auto border-r border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <div className="flex items-center gap-1.5">
            <History className="size-4 text-[var(--muted-foreground)]" />
            <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">Histórico</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-6 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          >
            <X className="size-3.5" />
          </button>
        </div>
        {loading ? (
          <div className="space-y-1.5 p-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded bg-[var(--muted)]" />
            ))}
          </div>
        ) : (
          <div className="p-2">
            {versions.map((v) => {
              const isSelected = v.id === selectedId;
              const isCurrent = v.id === currentVersionId;
              const date = new Date(v.createdAt).toLocaleDateString("pt-PT", {
                day: "numeric", month: "short", year: "numeric",
              });
              const time = new Date(v.createdAt).toLocaleTimeString("pt-PT", {
                hour: "2-digit", minute: "2-digit",
              });
              const authorName = v.author.givenName ?? v.author.name?.split(" ")[0] ?? "—";
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedId(v.id)}
                  className={cn(
                    "mb-1 flex w-full flex-col gap-0.5 rounded-md px-2.5 py-2 text-left transition-colors",
                    isSelected
                      ? "bg-[var(--vd-blue-500)]/10 dark:bg-[var(--vd-blue-500)]/20"
                      : "hover:bg-[var(--muted)]",
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3 text-[var(--muted-foreground)]" />
                    <span className="text-[11px] font-semibold text-[var(--foreground)]">{date}</span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">· {time}</span>
                    {isCurrent && (
                      <span className="ml-auto rounded-full bg-green-100 px-1.5 py-px text-[9px] font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">ATUAL</span>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">por {authorName}</div>
                  {v.changeNote && (
                    <div className="truncate text-[10px] italic text-[var(--muted-foreground)]/80">
                      {v.changeNote}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <div className="mx-auto max-w-3xl p-6 sm:p-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="vd-eyebrow">Versão de {new Date(selected.createdAt).toLocaleString("pt-PT")}</div>
              {canWrite && selected.id !== currentVersionId && (
                <button
                  type="button"
                  onClick={() => restore(selected.id)}
                  disabled={restoring}
                  className="flex items-center gap-1.5 rounded-lg bg-[var(--vd-orange-500)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  <RotateCcw className="size-3.5" />
                  {restoring ? "A restaurar…" : "Restaurar esta versão"}
                </button>
              )}
            </div>

            <h1
              className="m-0 mb-3 text-2xl font-bold text-[var(--foreground)] sm:text-3xl"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
            >
              {selected.title}
            </h1>

            {selected.changeNote && (
              <div className="mb-4 rounded-lg border border-[var(--vd-blue-500)]/30 bg-[var(--vd-blue-500)]/5 px-3 py-2 text-xs text-[var(--foreground)]">
                <span className="font-semibold">Nota de alteração:</span> {selected.changeNote}
              </div>
            )}

            <div className="vd-richtext" dangerouslySetInnerHTML={{ __html: selected.content }} />
          </div>
        ) : (
          <div className="grid h-full place-items-center text-sm text-[var(--muted-foreground)]">
            Seleciona uma versão para ver
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Empty State ---------- */

function EmptyState({ canWrite, onNew }: { canWrite: boolean; onNew: () => void }) {
  return (
    <div className="grid h-full place-items-center p-8">
      <div className="max-w-md rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
        <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-[var(--muted)]">
          <BookOpen className="size-5 text-[var(--muted-foreground)]" />
        </div>
        <h3 className="m-0 text-base font-semibold text-[var(--foreground)]">Manual de operações</h3>
        <p className="m-0 mt-1.5 text-sm text-[var(--muted-foreground)]">
          {canWrite
            ? "Seleciona um artigo ou cria um novo. Cada alteração é versionada e registada."
            : "Seleciona um artigo no menu lateral para começar."}
        </p>
        {canWrite && (
          <button
            type="button"
            onClick={onNew}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--vd-blue-500)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus className="size-3.5" /> Criar primeiro artigo
          </button>
        )}
      </div>
    </div>
  );
}
