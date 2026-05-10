"use client";

import { useEffect, useRef, useState } from "react";
import { LayoutGrid, ExternalLink, Search, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomSheet } from "@/components/ui/bottom-sheet";

type ToolMeta = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

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

export function Tools() {
  const [tools, setTools] = useState<ToolMeta[]>([]);
  const [active, setActive] = useState<ToolMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/tools")
      .then((r) => r.json())
      .then((d) => {
        const list: ToolMeta[] = d.tools ?? [];
        setTools(list);
        if (list.length > 0) setActive(list[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Ctrl+F / Cmd+F dentro da sidebar abre a pesquisa
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") setSearch("");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const q = search.toLowerCase().trim();
  const filtered = q
    ? tools.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q)
      )
    : tools;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
        A carregar ferramentas…
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <div className="grid h-full place-items-center p-8">
        <div className="max-w-sm rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-[var(--muted)]">
            <LayoutGrid className="size-5 text-[var(--muted-foreground)]" />
          </div>
          <h3 className="m-0 text-base font-semibold text-[var(--foreground)]">Sem ferramentas disponíveis</h3>
          <p className="m-0 mt-1.5 text-sm text-[var(--muted-foreground)]">
            Ainda não tens acesso a nenhuma ferramenta. Contacta um administrador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Mobile trigger */}
      <button
        onClick={() => setSheetOpen(true)}
        className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-4 py-3 lg:hidden"
      >
        <div className="flex items-center gap-2">
          <LayoutGrid className="size-4 text-[var(--muted-foreground)]" />
          <span className="text-sm font-medium text-[var(--foreground)]">
            {active?.name ?? "Seleciona uma ferramenta"}
          </span>
        </div>
        <ChevronDown className="size-4 text-[var(--muted-foreground)]" />
      </button>

      {/* Bottom sheet mobile */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Ferramentas">
        <div className="p-2">
          <div className="relative mb-2 px-1">
            <Search className="absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Pesquisar…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--muted)] py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
            />
          </div>
          {filtered.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setActive(t); setSearch(""); setSheetOpen(false); }}
              className={cn(
                "flex w-full flex-col gap-0.5 rounded-lg px-3 py-3 text-left transition-colors",
                active?.id === t.id ? "bg-[var(--vd-blue-500)]/10 font-semibold text-[var(--vd-blue-500)]" : "hover:bg-[var(--muted)]"
              )}
            >
              <span className="text-sm font-medium">{t.name}</span>
              {t.description && (
                <span className="text-xs text-[var(--muted-foreground)] line-clamp-2">{t.description}</span>
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      <div className="flex flex-1 overflow-hidden">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--card)] lg:flex">
        {/* Header */}
        <div className="border-b border-[var(--border)] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutGrid className="size-3.5 text-[var(--muted-foreground)]" />
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
                Ferramentas
              </span>
            </div>
            <span className="text-[10px] text-[var(--muted-foreground)] opacity-60">{tools.length}</span>
          </div>
        </div>

        {/* Pesquisa */}
        <div className="border-b border-[var(--border)] px-3 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Pesquisar…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--muted)] py-1.5 pl-8 pr-7 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30"
            />
            {search ? (
              <button
                type="button"
                onClick={() => { setSearch(""); searchRef.current?.focus(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="size-3" />
              </button>
            ) : (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-[var(--border)] px-1 py-px font-mono text-[9px] text-[var(--muted-foreground)] opacity-60">
                ⌘K
              </span>
            )}
          </div>
        </div>

        {/* Lista */}
        <nav className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-2 py-6 text-center text-xs text-[var(--muted-foreground)]">
              Sem resultados para{" "}
              <strong>&ldquo;{search}&rdquo;</strong>
            </div>
          ) : (
            <>
              {q && (
                <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
                </div>
              )}
              {filtered.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setActive(t); setSearch(""); }}
                  className={cn(
                    "flex w-full flex-col gap-0.5 rounded-md px-3 py-2.5 text-left text-xs transition-colors",
                    active?.id === t.id && !q
                      ? "bg-[var(--vd-blue-500)]/10 font-semibold text-[var(--vd-blue-500)]"
                      : "text-[var(--foreground)] hover:bg-[var(--muted)]",
                  )}
                >
                  <span className="font-semibold">{highlight(t.name, search)}</span>
                  {t.description && (
                    <span className="text-[10px] font-normal text-[var(--muted-foreground)] line-clamp-2">
                      {highlight(t.description, search)}
                    </span>
                  )}
                </button>
              ))}
            </>
          )}
        </nav>
      </aside>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {active ? (
          <>
            <div className="hidden items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-4 py-2.5 lg:flex">
              <span className="text-sm font-semibold text-[var(--foreground)]">{active.name}</span>
              <a
                href={`/api/tools/${active.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <ExternalLink className="size-3" /> Abrir em separador
              </a>
            </div>
            <iframe
              key={active.id}
              src={`/api/tools/${active.slug}`}
              className="flex-1 border-0 w-full"
              title={active.name}
            />
          </>
        ) : (
          <div className="grid flex-1 place-items-center text-sm text-[var(--muted-foreground)]">
            Seleciona uma ferramenta
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
