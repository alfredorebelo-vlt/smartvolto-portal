"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle, AlertCircle, Users, BookOpen } from "lucide-react";
import { confirm } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

type SyncState = "idle" | "running" | "ok" | "error";

export function AdminSync() {
  const [state, setState] = useState<SyncState>("idle");
  const [result, setResult] = useState<{ synced?: number; error?: string } | null>(null);

  const [seedState, setSeedState] = useState<SyncState>("idle");
  const [seedResult, setSeedResult] = useState<{
    createdCategories?: number;
    createdArticles?: number;
    archivedExisting?: number;
    error?: string;
  } | null>(null);

  async function runSync() {
    setState("running");
    setResult(null);
    try {
      const res = await fetch("/api/directory/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setResult({ synced: data.synced });
        setState("ok");
      } else {
        setResult({ error: data.error ?? "Erro desconhecido" });
        setState("error");
      }
    } catch {
      setResult({ error: "Erro de rede" });
      setState("error");
    }
  }

  async function runSeedManual(force: boolean) {
    if (force && !await confirm({ message: "Isto vai arquivar todos os artigos do manual existentes (preserva histórico) e re-popular a partir do PDF v1.1. Continuar?", variant: "warning", confirmLabel: "Continuar" })) {
      return;
    }
    setSeedState("running");
    setSeedResult(null);
    try {
      const res = await fetch(`/api/admin/seed-manual${force ? "?force=true" : ""}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSeedResult(data);
        setSeedState("ok");
      } else {
        setSeedResult({ error: data.error ?? "Erro desconhecido" });
        setSeedState("error");
      }
    } catch (err) {
      console.error("Seed manual error:", err);
      setSeedResult({ error: "Erro de rede" });
      setSeedState("error");
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      {/* Google Workspace Sync */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--vd-blue-50)]">
            <Users className="size-5 text-[var(--vd-blue-500)]" />
          </div>
          <div>
            <h3 className="m-0 text-base font-bold text-[var(--foreground)]">
              Sincronização Google Workspace
            </h3>
            <p className="m-0 mt-1 text-sm text-[var(--muted-foreground)]">
              Importa todos os colaboradores do domínio <strong>voltodrive.com</strong> para a base de dados local. Atualiza nomes, cargos, departamentos, bases e fotos de perfil.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={runSync}
          disabled={state === "running"}
          className={cn(
            "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity",
            state === "running" ? "opacity-70 cursor-not-allowed" : "hover:opacity-90",
            "bg-[var(--vd-blue-500)]",
          )}
        >
          <RefreshCw className={cn("size-4", state === "running" && "animate-spin")} />
          {state === "running" ? "A sincronizar…" : "Sincronizar agora"}
        </button>

        {/* Feedback */}
        {result && (
          <div className={cn(
            "mt-4 flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-medium",
            state === "ok"
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
          )}>
            {state === "ok" ? (
              <><CheckCircle className="size-4 shrink-0" /> {result.synced} utilizadores sincronizados com sucesso.</>
            ) : (
              <><AlertCircle className="size-4 shrink-0" /> {result.error}</>
            )}
          </div>
        )}
      </div>

      {/* Manual Operativo Seed */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--vd-orange-50)]">
            <BookOpen className="size-5 text-[var(--vd-orange-500)]" />
          </div>
          <div>
            <h3 className="m-0 text-base font-bold text-[var(--foreground)]">
              Manual Operativo de Balcão (v1.1)
            </h3>
            <p className="m-0 mt-1 text-sm text-[var(--muted-foreground)]">
              Popula o manual com a versão consolidada de <strong>09 março 2026</strong>: 6 categorias
              e 22 artigos baseados no PDF original. Cada artigo fica registado como versão inicial
              com nota de alteração e log de auditoria.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => runSeedManual(false)}
            disabled={seedState === "running"}
            className={cn(
              "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity",
              seedState === "running" ? "opacity-70 cursor-not-allowed" : "hover:opacity-90",
              "bg-[var(--vd-orange-500)]",
            )}
          >
            <BookOpen className={cn("size-4", seedState === "running" && "animate-spin")} />
            {seedState === "running" ? "A popular…" : "Popular manual"}
          </button>

          <button
            type="button"
            onClick={() => runSeedManual(true)}
            disabled={seedState === "running"}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-5 py-2.5 text-sm font-semibold text-[var(--muted-foreground)] hover:bg-[var(--muted)] disabled:opacity-50"
          >
            <RefreshCw className="size-4" />
            Repopular (force)
          </button>
        </div>

        {seedResult && (
          <div className={cn(
            "mt-4 flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm",
            seedState === "ok"
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
          )}>
            {seedState === "ok" ? (
              <>
                <CheckCircle className="mt-0.5 size-4 shrink-0" />
                <div>
                  <div className="font-semibold">Manual populado com sucesso.</div>
                  <div className="mt-0.5 text-xs">
                    {seedResult.createdCategories} categorias e {seedResult.createdArticles} artigos criados
                    {seedResult.archivedExisting ? ` · ${seedResult.archivedExisting} artigos antigos arquivados (histórico preservado)` : ""}.
                  </div>
                </div>
              </>
            ) : (
              <><AlertCircle className="mt-0.5 size-4 shrink-0" /> {seedResult.error}</>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4 text-sm text-[var(--muted-foreground)]">
        <p className="m-0 font-semibold text-[var(--foreground)]">Como funciona</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li><strong>Sync Workspace</strong> — vai à Admin Directory API e atualiza utilizadores e fotos.</li>
          <li>Utilizadores suspensos no Workspace são marcados como <strong>SUSPENDED</strong> e escondidos do diretório.</li>
          <li><strong>Popular manual</strong> — só cria se ainda não existirem artigos; usa <em>Repopular</em> para arquivar a versão atual e re-popular a partir do PDF.</li>
          <li>Repopular preserva o histórico (soft-delete via <code>archivedAt</code>) — nada é apagado.</li>
        </ul>
      </div>
    </div>
  );
}
