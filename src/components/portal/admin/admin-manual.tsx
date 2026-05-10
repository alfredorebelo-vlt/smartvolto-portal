"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpen, Upload, ChevronDown, ChevronRight, CheckCircle2,
  AlertCircle, Loader2, FileText, X, FolderOpen, Plus, Pencil,
  Trash2, Save, RefreshCw, GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { confirm } from "@/components/ui/confirm-dialog";

/* ─── types ──────────────────────────────────────────────────────────────── */

type Category = {
  id: string; name: string; slug: string; description: string | null;
  color: string | null; order: number; _count: { articles: number };
};
type Article = {
  id: string; slug: string; order: number; categoryId: string;
  currentVersion: { id: string; title: string; createdAt: string } | null;
};
type ImportArticle = { title: string; content: string };
type ImportCategory = { name: string; description?: string; articles: ImportArticle[] };
type ImportStructure = { categories: ImportCategory[] };
type Phase = "idle" | "uploading" | "preview" | "importing" | "done" | "error";
type SeedState = "idle" | "running" | "ok" | "error";

/* ─── main component ─────────────────────────────────────────────────────── */

export function AdminManual() {
  const [cats, setCats] = useState<Category[]>([]);
  const [arts, setArts] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [cR, aR] = await Promise.all([
      fetch("/api/manual/categories"),
      fetch("/api/manual/articles"),
    ]);
    const [cD, aD] = await Promise.all([cR.json(), aR.json()]);
    setCats(cD.categories ?? []);
    setArts(aD.articles ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const totalArticles = arts.length;

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      {/* ── Cabeçalho ───────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-bold text-[var(--foreground)]">Manual de Operações</h2>
        <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
          Gere categorias e artigos, importa via PDF ou repopula com o conteúdo base.
        </p>
      </div>

      {/* ── Contadores ──────────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <StatPill label="Categorias" value={loading ? "…" : String(cats.length)} />
        <StatPill label="Artigos" value={loading ? "…" : String(totalArticles)} />
      </div>

      {/* ── Editor de estrutura ─────────────────────────────────────────── */}
      <StructureEditor cats={cats} arts={arts} loading={loading} onRefresh={loadData} />

      {/* ── Importar PDF ────────────────────────────────────────────────── */}
      <PdfImporter onImported={loadData} />

      {/* ── Seed base ───────────────────────────────────────────────────── */}
      <SeedPanel onSeeded={loadData} />
    </div>
  );
}

/* ─── stat pill ──────────────────────────────────────────────────────────── */

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2">
      <span className="text-lg font-bold text-[var(--foreground)]">{value}</span>
      <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
    </div>
  );
}

/* ─── structure editor ───────────────────────────────────────────────────── */

function StructureEditor({
  cats, arts, loading, onRefresh,
}: {
  cats: Category[]; arts: Article[]; loading: boolean; onRefresh: () => void;
}) {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [addingCat, setAddingCat] = useState(false);

  // Drag state for category reorder
  const [dragCatId, setDragCatId] = useState<string | null>(null);
  const [overCatId, setOverCatId] = useState<string | null>(null);
  const [localCats, setLocalCats] = useState(cats);
  useEffect(() => { setLocalCats(cats); }, [cats]);

  function articlesOf(catId: string) {
    return arts.filter((a) => a.categoryId === catId).sort((a, b) => a.order - b.order);
  }

  async function deleteCategory(cat: Category) {
    if (cat._count.articles > 0) {
      await confirm({
        message: `A categoria "${cat.name}" tem ${cat._count.articles} artigos. Move-os ou apaga-os primeiro.`,
        variant: "default",
        confirmLabel: "OK",
      });
      return;
    }
    if (!await confirm({ message: `Apagar a categoria "${cat.name}"?`, variant: "danger", confirmLabel: "Apagar" })) return;
    await fetch(`/api/manual/categories/${cat.id}`, { method: "DELETE" });
    onRefresh();
  }

  async function deleteArticle(art: Article) {
    const title = art.currentVersion?.title ?? art.slug;
    if (!await confirm({ message: `Arquivar o artigo "${title}"?`, variant: "warning", confirmLabel: "Arquivar" })) return;
    await fetch(`/api/manual/articles/${art.id}`, { method: "DELETE" });
    onRefresh();
  }

  // category drag handlers
  function onCatDragStart(e: React.DragEvent, id: string) {
    setDragCatId(id);
    e.dataTransfer.effectAllowed = "move";
  }
  function onCatDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    setOverCatId(id);
  }
  function onCatDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!dragCatId || dragCatId === targetId) { setDragCatId(null); setOverCatId(null); return; }
    const reordered = [...localCats];
    const from = reordered.findIndex((c) => c.id === dragCatId);
    const to = reordered.findIndex((c) => c.id === targetId);
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setLocalCats(reordered);
    setDragCatId(null);
    setOverCatId(null);
    fetch("/api/manual/categories/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((c) => c.id) }),
    }).then(onRefresh);
  }

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Estrutura do manual</h3>
          <p className="text-xs text-[var(--muted-foreground)]">Gerir categorias e artigos. Arrasta para reordenar.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="grid size-7 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            title="Atualizar"
          >
            <RefreshCw className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setAddingCat(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--vd-blue-500)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
          >
            <Plus className="size-3.5" /> Nova categoria
          </button>
        </div>
      </div>

      <div className="p-2">
        {loading ? (
          <div className="space-y-1 p-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-[var(--muted)]" />)}
          </div>
        ) : localCats.length === 0 && !addingCat ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <FolderOpen className="size-8 text-[var(--muted-foreground)]/40" />
            <p className="text-sm text-[var(--muted-foreground)]">Sem categorias. Cria uma ou importa um PDF.</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {localCats.map((cat) => {
              const isExpanded = expandedCat === cat.id;
              const catArts = articlesOf(cat.id);
              const isDragOver = overCatId === cat.id;
              return (
                <div
                  key={cat.id}
                  draggable
                  onDragStart={(e) => onCatDragStart(e, cat.id)}
                  onDragOver={(e) => onCatDragOver(e, cat.id)}
                  onDragLeave={() => setOverCatId(null)}
                  onDrop={(e) => onCatDrop(e, cat.id)}
                  className={cn(
                    "rounded-lg border transition-colors",
                    isDragOver ? "border-[var(--vd-blue-500)] bg-[var(--vd-blue-500)]/5" : "border-transparent",
                  )}
                >
                  {/* Category row */}
                  <div className="group flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-[var(--muted)]">
                    <GripVertical className="size-3.5 shrink-0 cursor-grab text-[var(--muted-foreground)]/40 group-hover:text-[var(--muted-foreground)]" />
                    <button
                      type="button"
                      onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                      className="flex flex-1 items-center gap-2 text-left"
                    >
                      {isExpanded
                        ? <ChevronDown className="size-3.5 shrink-0 text-[var(--muted-foreground)]" />
                        : <ChevronRight className="size-3.5 shrink-0 text-[var(--muted-foreground)]" />
                      }
                      <FolderOpen className="size-3.5 shrink-0 text-[var(--muted-foreground)]" />
                      <span className="flex-1 truncate text-sm font-semibold text-[var(--foreground)]">{cat.name}</span>
                      <span className="shrink-0 rounded-full bg-[var(--muted)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted-foreground)]">
                        {cat._count.articles}
                      </span>
                    </button>
                    <div className="ml-1 flex shrink-0 gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => setEditingCat(cat)}
                        className="grid size-6 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--card)] hover:text-[var(--foreground)]"
                        title="Renomear"
                      >
                        <Pencil className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCategory(cat)}
                        className="grid size-6 place-items-center rounded text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                        title="Apagar categoria"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded articles */}
                  {isExpanded && (
                    <div className="ml-8 mb-1 space-y-0.5">
                      {catArts.length === 0 ? (
                        <p className="px-2 py-1 text-xs text-[var(--muted-foreground)]">Sem artigos nesta categoria.</p>
                      ) : (
                        catArts.map((art) => (
                          <ArticleRow key={art.id} art={art} cats={cats} onRefresh={onRefresh} onDelete={() => deleteArticle(art)} />
                        ))
                      )}
                      <AddArticleRow catId={cat.id} onRefresh={onRefresh} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* New category form */}
        {addingCat && (
          <CategoryForm onSave={async (name, desc) => {
            await fetch("/api/manual/categories", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, description: desc }),
            });
            setAddingCat(false);
            onRefresh();
          }} onCancel={() => setAddingCat(false)} />
        )}
      </div>

      {/* Edit category modal-inline */}
      {editingCat && (
        <CategoryForm
          initial={editingCat}
          onSave={async (name, desc) => {
            await fetch(`/api/manual/categories/${editingCat.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, description: desc }),
            });
            setEditingCat(null);
            onRefresh();
          }}
          onCancel={() => setEditingCat(null)}
        />
      )}
    </section>
  );
}

/* ─── article row ────────────────────────────────────────────────────────── */

function ArticleRow({
  art, cats, onRefresh, onDelete,
}: {
  art: Article; cats: Category[]; onRefresh: () => void; onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(art.currentVersion?.title ?? "");
  const [newCatId, setNewCatId] = useState(art.categoryId);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/manual/articles/${art.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, categoryId: newCatId, overwrite: true }),
    });
    setSaving(false);
    setEditing(false);
    onRefresh();
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2.5">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="w-full rounded border border-[var(--border)] bg-[var(--muted)] px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          autoFocus
        />
        <div className="flex items-center gap-2">
          <select
            value={newCatId}
            onChange={(e) => setNewCatId(e.target.value)}
            className="flex-1 rounded border border-[var(--border)] bg-[var(--muted)] px-2 py-1 text-xs focus:outline-none"
          >
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button
            type="button"
            onClick={save}
            disabled={saving || !newTitle.trim()}
            className="flex items-center gap-1 rounded bg-[var(--vd-blue-500)] px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
          >
            <Save className="size-3" /> {saving ? "…" : "Guardar"}
          </button>
          <button type="button" onClick={() => setEditing(false)} className="grid size-6 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
            <X className="size-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--muted)]">
      <BookOpen className="size-3.5 shrink-0 text-[var(--muted-foreground)]/50" />
      <span className="flex-1 truncate text-xs text-[var(--foreground)]">
        {art.currentVersion?.title ?? art.slug}
      </span>
      <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="grid size-6 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--card)] hover:text-[var(--foreground)]"
          title="Renomear / mover"
        >
          <Pencil className="size-3" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="grid size-6 place-items-center rounded text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
          title="Arquivar artigo"
        >
          <Trash2 className="size-3" />
        </button>
      </div>
    </div>
  );
}

/* ─── add article row ────────────────────────────────────────────────────── */

function AddArticleRow({ catId, onRefresh }: { catId: string; onRefresh: () => void }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    await fetch("/api/manual/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), content: "<p></p>", categoryId: catId }),
    });
    setSaving(false);
    setTitle("");
    setAdding(false);
    onRefresh();
  }

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
      >
        <Plus className="size-3" /> Novo artigo
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-1.5">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setAdding(false); }}
        placeholder="Título do artigo"
        autoFocus
        className="flex-1 bg-transparent text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none"
      />
      <button
        type="button"
        onClick={save}
        disabled={saving || !title.trim()}
        className="rounded bg-[var(--vd-blue-500)] px-2 py-0.5 text-[10px] font-bold text-white disabled:opacity-50"
      >
        {saving ? "…" : "Criar"}
      </button>
      <button type="button" onClick={() => setAdding(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
        <X className="size-3" />
      </button>
    </div>
  );
}

/* ─── category form ──────────────────────────────────────────────────────── */

function CategoryForm({
  initial, onSave, onCancel,
}: {
  initial?: Category;
  onSave: (name: string, description: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), desc.trim());
    setSaving(false);
  }

  return (
    <div className="mt-1 flex flex-col gap-2 rounded-lg border border-[var(--vd-blue-500)]/30 bg-[var(--vd-blue-500)]/5 p-3">
      <p className="text-xs font-semibold text-[var(--foreground)]">
        {initial ? "Renomear categoria" : "Nova categoria"}
      </p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") onCancel(); }}
        placeholder="Nome da categoria"
        autoFocus
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
      />
      <input
        type="text"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Descrição (opcional)"
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving || !name.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--vd-blue-500)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          <Save className="size-3" /> {saving ? "A guardar…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

/* ─── pdf importer ───────────────────────────────────────────────────────── */

function PdfImporter({ onImported }: { onImported: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [structure, setStructure] = useState<ImportStructure | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [importResult, setImportResult] = useState<{ createdCategories: number; createdArticles: number } | null>(null);
  const [expandedCat, setExpandedCat] = useState<number | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f); setPhase("idle"); setErrorMsg(""); setStructure(null); setImportResult(null);
  }

  async function handleAnalyse() {
    if (!file) return;
    setPhase("uploading"); setErrorMsg(""); setStructure(null); setExpandedCat(null);
    try {
      const fd = new FormData(); fd.append("mode", "preview"); fd.append("file", file);
      const res = await fetch("/api/admin/manual/import-pdf", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? `Erro ${res.status}`); setPhase("error"); return; }
      setStructure(data.structure); setPageCount(data.pageCount ?? 0); setPhase("preview");
    } catch (err) { setErrorMsg(err instanceof Error ? err.message : "Erro de rede"); setPhase("error"); }
  }

  async function handleImport() {
    if (!structure) return;
    const totalArts = structure.categories.reduce((s, c) => s + c.articles.length, 0);
    if (!await confirm({
      message: `Importar ${structure.categories.length} categorias e ${totalArts} artigos?`,
      variant: "warning", confirmLabel: "Importar",
    })) return;
    setPhase("importing");
    try {
      const fd = new FormData(); fd.append("mode", "import"); fd.append("structure", JSON.stringify(structure));
      const res = await fetch("/api/admin/manual/import-pdf", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? `Erro ${res.status}`); setPhase("error"); return; }
      setImportResult(data); setPhase("done"); onImported();
    } catch (err) { setErrorMsg(err instanceof Error ? err.message : "Erro de rede"); setPhase("error"); }
  }

  function reset() {
    setFile(null); setPhase("idle"); setStructure(null); setErrorMsg("");
    setImportResult(null); setExpandedCat(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const totalPreviewArts = structure?.categories.reduce((s, c) => s + c.articles.length, 0) ?? 0;
  const isWorking = phase === "uploading" || phase === "importing";

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <div className="border-b border-[var(--border)] px-5 py-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Importar via PDF</h3>
        <p className="text-xs text-[var(--muted-foreground)]">
          O PDF é analisado com IA (Claude) e convertido em categorias e artigos estruturados.
        </p>
      </div>
      <div className="space-y-4 p-5">
        {/* File picker */}
        <div className="flex flex-wrap items-center gap-3">
          <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={handleFileChange} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isWorking}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-50"
          >
            <FileText className="size-4 text-[var(--muted-foreground)]" />
            {file ? file.name : "Escolher PDF…"}
          </button>
          {file && <span className="text-xs text-[var(--muted-foreground)]">{(file.size / 1024 / 1024).toFixed(1)} MB</span>}
          {file && !isWorking && (
            <button type="button" onClick={reset} className="grid size-6 place-items-center rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {(phase === "idle" || phase === "error") && file && (
          <button type="button" onClick={handleAnalyse}
            className="flex items-center gap-2 rounded-lg bg-[var(--vd-blue-500)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Upload className="size-4" /> Analisar com IA
          </button>
        )}

        {isWorking && (
          <div className="flex items-center gap-2.5 text-sm text-[var(--muted-foreground)]">
            <Loader2 className="size-4 animate-spin" />
            {phase === "uploading" ? "A extrair texto e processar com Claude…" : "A importar…"}
          </div>
        )}

        {phase === "error" && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /><span>{errorMsg}</span>
          </div>
        )}

        {phase === "done" && importResult && (
          <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <span>Importação concluída — {importResult.createdCategories} {importResult.createdCategories === 1 ? "categoria" : "categorias"} e {importResult.createdArticles} {importResult.createdArticles === 1 ? "artigo" : "artigos"} criados.</span>
          </div>
        )}

        {phase === "preview" && structure && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-2.5 py-0.5 text-xs font-semibold text-[var(--foreground)]">
                {structure.categories.length} {structure.categories.length === 1 ? "categoria" : "categorias"}
              </span>
              <span className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-2.5 py-0.5 text-xs font-semibold text-[var(--foreground)]">
                {totalPreviewArts} {totalPreviewArts === 1 ? "artigo" : "artigos"}
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">{pageCount} pág.</span>
            </div>

            <div className="overflow-hidden rounded-lg border border-[var(--border)]">
              {structure.categories.map((cat, i) => {
                const isOpen = expandedCat === i;
                return (
                  <div key={i} className="border-b border-[var(--border)] last:border-b-0">
                    <button type="button" onClick={() => setExpandedCat(isOpen ? null : i)}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-[var(--muted)]"
                    >
                      {isOpen ? <ChevronDown className="size-3.5 shrink-0 text-[var(--muted-foreground)]" /> : <ChevronRight className="size-3.5 shrink-0 text-[var(--muted-foreground)]" />}
                      <FolderOpen className="size-3.5 shrink-0 text-[var(--muted-foreground)]" />
                      <span className="flex-1 truncate text-sm font-semibold text-[var(--foreground)]">{cat.name}</span>
                      <span className="shrink-0 rounded-full bg-[var(--muted)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted-foreground)]">{cat.articles.length}</span>
                    </button>
                    {isOpen && (
                      <div className="border-t border-[var(--border)] bg-[var(--muted)] px-3 py-2">
                        {cat.description && <p className="mb-2 text-xs italic text-[var(--muted-foreground)]">{cat.description}</p>}
                        {cat.articles.length === 0 ? (
                          <p className="text-xs text-[var(--muted-foreground)]">Sem artigos</p>
                        ) : (
                          <ul className="space-y-0.5">
                            {cat.articles.map((art, j) => (
                              <li key={j} className="flex items-center gap-1.5 text-xs text-[var(--foreground)]">
                                <BookOpen className="size-3 shrink-0 text-[var(--muted-foreground)]" />{art.title}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={reset}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]"
              >Cancelar</button>
              <button type="button" onClick={handleImport}
                className="flex items-center gap-2 rounded-lg bg-[var(--vd-blue-500)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                <CheckCircle2 className="size-4" /> Confirmar importação
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── seed panel ─────────────────────────────────────────────────────────── */

function SeedPanel({ onSeeded }: { onSeeded: () => void }) {
  const [seedState, setSeedState] = useState<SeedState>("idle");
  const [seedResult, setSeedResult] = useState<{
    createdCategories?: number; createdArticles?: number; archivedExisting?: number; error?: string;
  } | null>(null);

  async function runSeed(force: boolean) {
    if (force && !await confirm({
      message: "Isto vai arquivar todos os artigos existentes (o histórico é preservado) e re-popular com o Manual Operativo de Balcão v1.1. Continuar?",
      variant: "warning", confirmLabel: "Continuar",
    })) return;
    setSeedState("running"); setSeedResult(null);
    try {
      const res = await fetch(`/api/admin/seed-manual${force ? "?force=true" : ""}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) { setSeedResult(data); setSeedState("ok"); onSeeded(); }
      else { setSeedResult({ error: data.error ?? "Erro desconhecido" }); setSeedState("error"); }
    } catch { setSeedResult({ error: "Erro de rede" }); setSeedState("error"); }
  }

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <div className="border-b border-[var(--border)] px-5 py-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Conteúdo base (v1.1)</h3>
        <p className="text-xs text-[var(--muted-foreground)]">
          Popula o manual com o Manual Operativo de Balcão Volto Drive de <strong>9 março 2026</strong> — 6 categorias, 22 artigos.
        </p>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => runSeed(false)}
            disabled={seedState === "running"}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white bg-[var(--vd-orange-500)] hover:opacity-90",
              seedState === "running" && "opacity-70 cursor-not-allowed",
            )}
          >
            <BookOpen className={cn("size-4", seedState === "running" && "animate-spin")} />
            {seedState === "running" ? "A popular…" : "Popular manual"}
          </button>
          <button
            type="button"
            onClick={() => runSeed(true)}
            disabled={seedState === "running"}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-semibold text-[var(--muted-foreground)] hover:bg-[var(--muted)] disabled:opacity-50"
          >
            <RefreshCw className="size-4" /> Repopular (force)
          </button>
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">
          <strong className="text-[var(--foreground)]">Popular</strong> — só funciona se não houver artigos activos. <strong className="text-[var(--foreground)]">Repopular</strong> — arquiva o que existe e re-insere (histórico preservado).
        </p>
        {seedResult && (
          <div className={cn(
            "flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm",
            seedState === "ok" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
          )}>
            {seedState === "ok" ? (
              <>
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                <div>
                  <div className="font-semibold">Manual populado com sucesso.</div>
                  <div className="mt-0.5 text-xs">
                    {seedResult.createdCategories} categorias e {seedResult.createdArticles} artigos criados
                    {seedResult.archivedExisting ? ` · ${seedResult.archivedExisting} artigos anteriores arquivados` : ""}.
                  </div>
                </div>
              </>
            ) : (
              <><AlertCircle className="mt-0.5 size-4 shrink-0" /> {seedResult.error}</>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
