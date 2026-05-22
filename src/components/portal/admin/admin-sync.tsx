"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle, AlertCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type SyncState = "idle" | "running" | "ok" | "error";

export function AdminSync() {
  const [state, setState] = useState<SyncState>("idle");
  const [result, setResult] = useState<{ synced?: number; error?: string } | null>(null);

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
            "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity bg-[var(--vd-blue-500)]",
            state === "running" ? "opacity-70 cursor-not-allowed" : "hover:opacity-90",
          )}
        >
          <RefreshCw className={cn("size-4", state === "running" && "animate-spin")} />
          {state === "running" ? "A sincronizar…" : "Sincronizar agora"}
        </button>

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

      <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] p-4 text-sm text-[var(--muted-foreground)]">
        <p className="m-0 font-semibold text-[var(--foreground)]">Como funciona</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>Vai à Admin Directory API do Google e atualiza utilizadores e fotos.</li>
          <li>Utilizadores suspensos no Workspace são marcados como <strong>SUSPENDED</strong> e escondidos do diretório.</li>
        </ul>
      </div>
    </div>
  );
}
