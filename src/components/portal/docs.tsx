"use client";

import { useEffect, useState, useRef } from "react";
import {
  FolderOpen, FileText, ExternalLink, Clock, Search, X,
  FileSpreadsheet, FileType, Presentation, File, AlertCircle,
  ChevronRight, ChevronLeft, ChevronDown, Folder, Home, HardDrive, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { SECTIONS } from "@/lib/sections";
import { BottomSheet } from "@/components/ui/bottom-sheet";

/* ─── Types ─── */

type DocArea = {
  id: string; name: string; slug: string; description: string | null;
  color: string; entries: DocEntry[];
};

type DocEntry = {
  id: string; areaId: string; title: string; description: string | null;
  driveFileId: string | null; driveUrl: string; embedType: string;
};

type DriveFile = {
  id: string | null; name: string | null; mimeType: string | null;
  webViewLink: string | null; iconLink: string | null; modifiedTime: string | null;
  size?: string | null; isFolder?: boolean; parents?: string[] | null;
  driveId?: string | null; isSharedDrive?: boolean;
};

type Tab = "library" | "recent";

/* ─── Helpers ─── */

function mimeIcon(mimeType: string | null) {
  if (!mimeType) return <File className="size-4 text-[var(--muted-foreground)]" />;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return <FileSpreadsheet className="size-4 text-emerald-600" />;
  if (mimeType.includes("document") || mimeType.includes("word"))
    return <FileType className="size-4 text-[var(--vd-blue-500)]" />;
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return <Presentation className="size-4 text-[var(--vd-orange-500)]" />;
  if (mimeType.includes("pdf"))
    return <FileText className="size-4 text-red-500" />;
  return <File className="size-4 text-[var(--muted-foreground)]" />;
}

function embedUrl(entry: DocEntry): string | null {
  if (entry.embedType === "none") return null;
  const url = entry.driveUrl;
  if (entry.embedType === "sheets") {
    const base = url.replace(/\/edit.*$/, "").replace(/\/pub.*$/, "");
    return `${base}/htmlview?rm=minimal`;
  }
  if (entry.embedType === "docs" || entry.embedType === "slides") {
    const base = url.replace(/\/edit.*$/, "").replace(/\/pub.*$/, "");
    return `${base}/preview`;
  }
  return url;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `há ${d}d`;
  return new Date(iso).toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
}

/* ─── Main ─── */

export function Docs() {
  const { can, isAdmin } = usePermissions();
  const canDrive = isAdmin || can(SECTIONS.DOCS_DRIVE);
  const canLibrary = isAdmin || can(SECTIONS.DOCS_LIBRARY);

  const defaultTab: Tab = canLibrary ? "library" : "recent";
  const [tab, setTab] = useState<Tab>(defaultTab);

  return (
    <div className="flex min-h-full flex-col gap-4 bg-[var(--muted)] p-4 sm:gap-5 sm:p-6 lg:p-8">
      {/* Header */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6">
        <div className="vd-eyebrow mb-1">Repositório</div>
        <h2 className="m-0 text-xl font-bold text-[var(--vd-blue-500)] dark:text-[var(--foreground)] sm:text-2xl"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.015em" }}>
          Documentos
        </h2>

        {/* Tabs */}
        {canLibrary && canDrive && (
          <div className="mt-4 flex gap-1 rounded-xl bg-[var(--muted)] p-1 w-fit">
            {([["library", "Biblioteca"], ["recent", "Drive pessoal"]] as [Tab, string][]).map(([t, label]) => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={cn("rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors",
                  tab === t
                    ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]")}>
                {label}
              </button>
            ))}
          </div>
        )}
      </section>

      {tab === "library" && canLibrary && <LibraryView />}
      {tab === "recent" && canDrive && <RecentView />}

      {!canLibrary && !canDrive && (
        <div className="grid place-items-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <AlertCircle className="mx-auto mb-3 size-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">Sem acesso a documentos.</p>
        </div>
      )}
    </div>
  );
}

/* ─── Biblioteca ─── */

function LibraryView() {
  const [areas, setAreas] = useState<DocArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeArea, setActiveArea] = useState<string | null>(null);
  const [activeEntry, setActiveEntry] = useState<DocEntry | null>(null);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    fetch("/api/docs/library")
      .then((r) => r.json())
      .then((d) => {
        const a = d.areas ?? [];
        setAreas(a);
        if (a.length > 0) setActiveArea(a[0].id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const currentArea = areas.find((a) => a.id === activeArea) ?? null;

  const filteredEntries = search.trim()
    ? areas.flatMap((a) => a.entries.filter((e) =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.description ?? "").toLowerCase().includes(search.toLowerCase())
      ))
    : currentArea?.entries ?? [];

  if (loading) return <LibrarySkeleton />;

  if (areas.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-12 text-center">
        <FolderOpen className="mx-auto mb-3 size-8 text-[var(--muted-foreground)]" />
        <p className="text-sm font-semibold text-[var(--foreground)]">Biblioteca vazia</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">Ainda não foram catalogados documentos.</p>
      </div>
    );
  }

  const activeAreaName = areas.find((a) => a.id === activeArea)?.name ?? "Seleciona uma área";

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setSheetOpen(true)}
        className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 lg:hidden"
      >
        <div className="flex items-center gap-2">
          <FolderOpen className="size-4 text-[var(--muted-foreground)]" />
          <span className="text-sm font-medium text-[var(--foreground)]">
            {search ? `Pesquisa: "${search}"` : activeAreaName}
          </span>
        </div>
        <ChevronDown className="size-4 text-[var(--muted-foreground)]" />
      </button>

      {/* Bottom sheet mobile */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Documentos">
        <div className="p-3 flex flex-col gap-1">
          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar…"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] py-2 pl-8 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30" />
            {search && (
              <button type="button" onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X className="size-3.5" />
              </button>
            )}
          </div>
          {areas.map((area) => (
            <button key={area.id} type="button"
              onClick={() => { setActiveArea(area.id); setSearch(""); setActiveEntry(null); setSheetOpen(false); }}
              className={cn("flex items-center gap-2.5 rounded-lg px-3 py-3 text-left text-sm transition-colors",
                activeArea === area.id && !search
                  ? "bg-[var(--vd-blue-500)] text-white"
                  : "text-[var(--foreground)] hover:bg-[var(--accent)]")}>
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: area.color }} />
              <span className="flex-1 truncate font-medium">{area.name}</span>
              <span className={cn("shrink-0 text-[10px] font-semibold",
                activeArea === area.id && !search ? "text-white/70" : "text-[var(--muted-foreground)]")}>
                {area.entries.length}
              </span>
            </button>
          ))}
        </div>
      </BottomSheet>

    <div className="flex flex-1 gap-4 overflow-hidden" style={{ minHeight: 0 }}>
      {/* Sidebar áreas — desktop only */}
      <aside className="hidden w-56 shrink-0 flex-col gap-1 lg:flex">
        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar…"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2 pl-8 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30" />
          {search && (
            <button type="button" onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {areas.map((area) => (
          <button key={area.id} type="button"
            onClick={() => { setActiveArea(area.id); setSearch(""); setActiveEntry(null); }}
            className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
              activeArea === area.id && !search
                ? "bg-[var(--vd-blue-500)] text-white"
                : "text-[var(--foreground)] hover:bg-[var(--accent)]")}>
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: area.color }} />
            <span className="flex-1 truncate font-medium">{area.name}</span>
            <span className={cn("shrink-0 text-[10px] font-semibold",
              activeArea === area.id && !search ? "text-white/70" : "text-[var(--muted-foreground)]")}>
              {area.entries.length}
            </span>
          </button>
        ))}
      </aside>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col gap-3 overflow-auto min-w-0">

        {/* Preview de embed */}
        {activeEntry && activeEntry.embedType !== "none" && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <span className="text-sm font-semibold text-[var(--foreground)] truncate">{activeEntry.title}</span>
              <div className="flex shrink-0 items-center gap-2">
                <a href={activeEntry.driveUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]">
                  <ExternalLink className="size-3" /> Abrir
                </a>
                <button type="button" onClick={() => setActiveEntry(null)}
                  className="grid size-7 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <iframe
              src={embedUrl(activeEntry) ?? ""}
              className="w-full border-0"
              style={{ height: "520px" }}
              title={activeEntry.title}
            />
          </div>
        )}

        {/* Lista de documentos */}
        {filteredEntries.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
            <FileText className="mx-auto mb-2 size-7 text-[var(--muted-foreground)]" />
            <p className="text-sm text-[var(--muted-foreground)]">
              {search ? "Sem resultados para a pesquisa." : "Sem documentos nesta área."}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            {search && (
              <div className="border-b border-[var(--border)] px-4 py-2.5 text-xs text-[var(--muted-foreground)]">
                {filteredEntries.length} resultado{filteredEntries.length !== 1 ? "s" : ""} para <strong>"{search}"</strong>
              </div>
            )}
            <div className="divide-y divide-[var(--border)]">
              {filteredEntries.map((entry) => {
                const isActive = activeEntry?.id === entry.id;
                const hasEmbed = entry.embedType !== "none";
                return (
                  <div key={entry.id}
                    className={cn("group flex items-center gap-3 px-4 py-3.5 transition-colors",
                      isActive ? "bg-[var(--vd-blue-50)] dark:bg-[var(--vd-blue-500)]/10" : "hover:bg-[var(--muted)]")}>
                    <FileText className="size-4 shrink-0 text-[var(--muted-foreground)]" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--foreground)]">{entry.title}</p>
                      {entry.description && (
                        <p className="truncate text-xs text-[var(--muted-foreground)]">{entry.description}</p>
                      )}
                    </div>
                    {hasEmbed && (
                      <span className="shrink-0 rounded-full bg-[var(--vd-blue-50)] px-2 py-0.5 text-[10px] font-semibold text-[var(--vd-blue-500)]">
                        {entry.embedType}
                      </span>
                    )}
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {hasEmbed && (
                        <button type="button"
                          onClick={() => setActiveEntry(isActive ? null : entry)}
                          className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--accent)]">
                          {isActive ? "Fechar" : "Ver aqui"}
                          <ChevronRight className="size-3" />
                        </button>
                      )}
                      <a href={entry.driveUrl} target="_blank" rel="noopener noreferrer"
                        className="grid size-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--accent)]">
                        <ExternalLink className="size-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

/* ─── Drive Pessoal ─── */

type DriveMode = "recent" | "folder" | "my-drive" | "search" | "shared-drives" | "shared-drive";

type BreadcrumbEntry = { id: string; name: string };

function RecentView() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<DriveMode>("recent");
  const [folderId, setFolderId] = useState("root");
  const [currentDriveId, setCurrentDriveId] = useState("");
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbEntry[]>([]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  function fetchFiles(m: DriveMode, fid = "root", sq = "", did = "") {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ mode: m });
    if (m === "folder" || m === "shared-drive") params.set("folderId", fid);
    if (did) params.set("driveId", did);
    if (m === "search") params.set("q", sq);
    fetch(`/api/docs/recent?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error === "drive_auth_required") { setError("drive_auth"); }
        else if (d.error) { setError(d.error); }
        else { setFiles(d.files ?? []); }
        setLoading(false);
      })
      .catch(() => { setError("Erro de rede"); setLoading(false); });
  }

  useEffect(() => { fetchFiles("recent"); }, []);

  function switchMode(m: DriveMode) {
    setMode(m);
    setFolderId("root");
    setCurrentDriveId("");
    setBreadcrumbs([]);
    setSearch("");
    setSearchInput("");
    fetchFiles(m);
  }

  function openSharedDrive(file: DriveFile) {
    if (!file.id) return;
    setMode("shared-drive");
    setCurrentDriveId(file.id);
    setFolderId(file.id);
    setBreadcrumbs([{ id: file.id, name: file.name ?? file.id }]);
    fetchFiles("shared-drive", file.id, "", file.id);
  }

  function openFolder(file: DriveFile) {
    if (!file.id || !file.isFolder) return;
    const newId = file.id;
    const newName = file.name ?? newId;
    setBreadcrumbs((prev) => [...prev, { id: newId, name: newName }]);
    setFolderId(newId);
    fetchFiles("folder", newId, "", currentDriveId);
  }

  function goToBreadcrumb(idx: number) {
    const crumb = breadcrumbs[idx];
    const newCrumbs = breadcrumbs.slice(0, idx + 1);
    setBreadcrumbs(newCrumbs);
    setFolderId(crumb.id);
    // Se estamos num disco partilhado, o primeiro crumb é o disco
    if (mode === "shared-drive" && idx === 0) {
      fetchFiles("shared-drive", crumb.id, "", currentDriveId);
    } else {
      fetchFiles("folder", crumb.id, "", currentDriveId);
    }
  }

  function goToRoot() {
    setBreadcrumbs([]);
    setFolderId("root");
    setCurrentDriveId("");
    if (mode === "shared-drive") {
      setMode("shared-drives");
      fetchFiles("shared-drives");
    } else {
      fetchFiles("folder", "root");
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setMode("search");
    setSearch(searchInput.trim());
    fetchFiles("search", "root", searchInput.trim());
  }

  if (error === "drive_auth") {
    return (
      <div className="rounded-2xl border border-[var(--vd-orange-500)]/30 bg-[var(--vd-orange-50)] p-8 text-center">
        <AlertCircle className="mx-auto mb-3 size-6 text-[var(--vd-orange-500)]" />
        <p className="text-sm font-semibold text-[var(--foreground)]">Acesso à Drive não autorizado</p>
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">
          A tua sessão foi criada antes de o acesso à Drive ser ativado. Faz login novamente para autorizar o acesso.
        </p>
        <a
          href="/api/auth/reauthorize?callbackUrl=/"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--vd-blue-500)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Renovar sessão
        </a>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
        <AlertCircle className="mx-auto mb-2 size-5 text-red-500" />
        <p className="text-xs text-[var(--muted-foreground)]">{error}</p>
      </div>
    );
  }

  const modeLabel: Record<DriveMode, string> = {
    recent: "Abertos recentemente",
    folder: breadcrumbs.length === 0 ? "O meu Drive" : (breadcrumbs[breadcrumbs.length - 1]?.name ?? "Pasta"),
    "my-drive": "O meu Drive",
    "shared-drives": "Discos partilhados",
    "shared-drive": breadcrumbs[breadcrumbs.length - 1]?.name ?? "Disco partilhado",
    search: `Resultados para "${search}"`,
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Modos */}
          <div className="flex gap-1 rounded-lg bg-[var(--muted)] p-0.5">
            {([
              ["recent", "Recentes", Clock],
              ["my-drive", "O meu Drive", Home],
              ["shared-drives", "Partilhados", Users],
            ] as [DriveMode, string, React.ElementType][]).map(([m, label, Icon]) => (
              <button key={m} type="button" onClick={() => switchMode(m)}
                className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                  (mode === m || (mode === "shared-drive" && m === "shared-drives") || (mode === "folder" && m === "my-drive"))
                    ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]")}>
                <Icon className="size-3.5" />{label}
              </button>
            ))}
          </div>

          {/* Pesquisa */}
          <form onSubmit={handleSearch} className="flex flex-1 items-center gap-1 min-w-[160px]">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input ref={searchRef} value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Pesquisar na Drive…"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30" />
            </div>
            <button type="submit"
              className="rounded-lg bg-[var(--vd-blue-500)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">
              OK
            </button>
            {mode === "search" && (
              <button type="button" onClick={() => switchMode("recent")}
                className="grid size-7 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
                <X className="size-3.5" />
              </button>
            )}
          </form>

          {/* Link abrir Drive */}
          <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">
            <ExternalLink className="size-3.5" /> Abrir Drive
          </a>
        </div>

        {/* Breadcrumbs — modos com pasta */}
        {(mode === "folder" || mode === "shared-drive") && (
          <div className="mt-2 flex items-center gap-1 text-xs text-[var(--muted-foreground)] flex-wrap">
            <button type="button" onClick={goToRoot}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-[var(--muted)] hover:text-[var(--foreground)]">
              {mode === "shared-drive"
                ? <><Users className="size-3" /> Partilhados</>
                : <><Home className="size-3" /> Drive</>}
            </button>
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.id} className="flex items-center gap-1">
                <ChevronRight className="size-3" />
                <button type="button" onClick={() => goToBreadcrumb(i)}
                  className={cn("rounded px-1.5 py-0.5 hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
                    i === breadcrumbs.length - 1 && "font-semibold text-[var(--foreground)]")}>
                  {crumb.name}
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Lista de ficheiros */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <div className="flex items-center gap-2">
            {mode === "folder" && breadcrumbs.length > 0 && (
              <button type="button" onClick={() => {
                const prev = breadcrumbs[breadcrumbs.length - 2];
                if (prev) { goToBreadcrumb(breadcrumbs.length - 2); }
                else { goToRoot(); }
              }}
                className="grid size-6 place-items-center rounded text-[var(--muted-foreground)] hover:bg-[var(--muted)]">
                <ChevronLeft className="size-4" />
              </button>
            )}
            <span className="text-sm font-bold text-[var(--foreground)]">{modeLabel[mode]}</span>
          </div>
          <span className="text-xs text-[var(--muted-foreground)]">{loading ? "A carregar…" : `${files.length} item${files.length !== 1 ? "s" : ""}`}</span>
        </div>

        {loading ? (
          <div className="divide-y divide-[var(--border)]">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="size-4 animate-pulse rounded bg-[var(--muted)]" />
                <div className="h-3 flex-1 animate-pulse rounded bg-[var(--muted)]" />
                <div className="h-3 w-14 animate-pulse rounded bg-[var(--muted)]" />
              </div>
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="grid place-items-center p-10 text-center">
            <FolderOpen className="mx-auto mb-3 size-7 text-[var(--muted-foreground)]" />
            <p className="text-sm text-[var(--muted-foreground)]">
              {mode === "search" ? "Sem resultados." : mode === "shared-drives" ? "Sem discos partilhados." : "Pasta vazia."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {files.map((f, i) => {
              const isSharedDrive = f.isSharedDrive ?? f.mimeType === "application/vnd.google-apps.drive";
              const isFolder = !isSharedDrive && (f.isFolder ?? f.mimeType === "application/vnd.google-apps.folder");
              if (isSharedDrive) {
                return (
                  <button key={f.id ?? i} type="button" onClick={() => openSharedDrive(f)}
                    className="group flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--muted)] text-left">
                    <HardDrive className="size-4 shrink-0 text-[var(--vd-blue-500)]" />
                    <span className="flex-1 truncate text-sm font-medium text-[var(--foreground)]">{f.name ?? "Sem nome"}</span>
                    <ChevronRight className="size-3.5 shrink-0 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                );
              }
              if (isFolder) {
                return (
                  <button key={f.id ?? i} type="button" onClick={() => openFolder(f)}
                    className="group flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--muted)] text-left">
                    <Folder className="size-4 shrink-0 text-[var(--vd-blue-500)]" />
                    <span className="flex-1 truncate text-sm font-medium text-[var(--foreground)]">{f.name ?? "Sem nome"}</span>
                    <ChevronRight className="size-3.5 shrink-0 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                );
              }
              return (
                <a key={f.id ?? i} href={f.webViewLink ?? "#"} target="_blank" rel="noopener noreferrer"
                  className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--muted)]">
                  {mimeIcon(f.mimeType)}
                  <span className="flex-1 truncate text-sm font-medium text-[var(--foreground)]">{f.name ?? "Sem nome"}</span>
                  <span className="shrink-0 text-xs text-[var(--muted-foreground)]">{timeAgo(f.modifiedTime)}</span>
                  <ExternalLink className="size-3.5 shrink-0 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100" />
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Skeletons ─── */

function LibrarySkeleton() {
  return (
    <div className="flex gap-4">
      <div className="hidden w-56 shrink-0 flex-col gap-2 lg:flex">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-9 animate-pulse rounded-lg bg-[var(--muted)]" />)}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--muted)]" />)}
      </div>
    </div>
  );
}

