"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Search, X, User, Megaphone, Folder, BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getInitials, getAvatarColor } from "@/lib/avatar";

type ResultType = "person" | "announcement" | "doc" | "manual";

type SearchResult = {
  type: ResultType;
  id: string;
  title: string;
  subtitle: string;
  image: string | null;
  url?: string;
  nav: string;
};

const TYPE_LABELS: Record<ResultType, string> = {
  person: "Pessoas",
  announcement: "Anúncios",
  doc: "Documentos",
  manual: "Manual",
};

const TYPE_ICONS: Record<ResultType, React.ElementType> = {
  person: User,
  announcement: Megaphone,
  doc: Folder,
  manual: BookOpen,
};

function groupResults(results: SearchResult[]): { type: ResultType; items: SearchResult[] }[] {
  const order: ResultType[] = ["person", "announcement", "doc", "manual"];
  return order
    .map((type) => ({ type, items: results.filter((r) => r.type === type) }))
    .filter((g) => g.items.length > 0);
}

type Props = {
  onNav: (section: string) => void;
};

export function GlobalSearch({ onNav }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const d = await res.json();
      setResults(d.results ?? []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  // Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") { setOpen(false); setQuery(""); setResults([]); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false); setQuery(""); setResults([]);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function handleSelect(result: SearchResult) {
    if (result.url) {
      window.open(result.url, "_blank", "noopener noreferrer");
    } else {
      onNav(result.nav);
    }
    setOpen(false); setQuery(""); setResults([]);
  }

  const groups = groupResults(results);
  const flatResults = groups.flatMap((g) => g.items);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setFocused((f) => Math.min(f + 1, flatResults.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setFocused((f) => Math.max(f - 1, 0)); }
    if (e.key === "Enter" && flatResults[focused]) handleSelect(flatResults[focused]);
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] sm:w-56"
      >
        <Search className="size-3.5 shrink-0" />
        <span className="hidden flex-1 text-left sm:block">Pesquisar…</span>
        <span className="hidden rounded border border-[var(--border)] px-1.5 py-px font-mono text-[10px] sm:block">⌘K</span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Panel */}
          <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden">
            {/* Input */}
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
              {loading
                ? <Loader2 className="size-4 shrink-0 animate-spin text-[var(--muted-foreground)]" />
                : <Search className="size-4 shrink-0 text-[var(--muted-foreground)]" />
              }
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setFocused(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Pesquisar pessoas, documentos, anúncios…"
                className="flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
              />
              {query && (
                <button type="button" onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
                  className="grid size-5 place-items-center rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  <X className="size-3.5" />
                </button>
              )}
              <kbd className="hidden rounded border border-[var(--border)] px-1.5 py-px font-mono text-[10px] text-[var(--muted-foreground)] sm:block">Esc</kbd>
            </div>

            {/* Results */}
            {query.length >= 2 && (
              <div className="max-h-[60vh] overflow-y-auto">
                {groups.length === 0 && !loading ? (
                  <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                    Sem resultados para <strong>"{query}"</strong>
                  </p>
                ) : (
                  groups.map((group) => {
                    const Icon = TYPE_ICONS[group.type];
                    return (
                      <div key={group.type}>
                        <div className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                          <Icon className="size-3" /> {TYPE_LABELS[group.type]}
                        </div>
                        {group.items.map((result) => {
                          const globalIdx = flatResults.indexOf(result);
                          const isFocused = globalIdx === focused;
                          return (
                            <button
                              key={result.id}
                              type="button"
                              onClick={() => handleSelect(result)}
                              onMouseEnter={() => setFocused(globalIdx)}
                              className={cn(
                                "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                                isFocused ? "bg-[var(--muted)]" : "hover:bg-[var(--muted)]"
                              )}
                            >
                              {result.type === "person" ? (
                                result.image
                                  ? <img src={result.image} alt="" className="size-8 rounded-full object-cover shrink-0" />
                                  : <span className="grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                                      style={{ background: getAvatarColor(result.id) }}>
                                      {getInitials(result.title.split(" ")[0] ?? "", result.title.split(" ").slice(-1)[0] ?? "")}
                                    </span>
                              ) : (
                                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)]">
                                  <Icon className="size-4" />
                                </span>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-semibold text-[var(--foreground)]">{result.title}</p>
                                {result.subtitle && (
                                  <p className="truncate text-xs text-[var(--muted-foreground)]">{result.subtitle}</p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Empty state */}
            {query.length < 2 && (
              <div className="px-4 py-6 text-center text-xs text-[var(--muted-foreground)]">
                Escreve pelo menos 2 caracteres para pesquisar
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
