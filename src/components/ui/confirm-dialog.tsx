"use client";

import { useState, useCallback } from "react";
import { AlertTriangle, X } from "lucide-react";

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
};

type PromptOptions = {
  title?: string;
  message: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type DialogState =
  | { type: "confirm"; options: ConfirmOptions; resolve: (v: boolean) => void }
  | { type: "prompt"; options: PromptOptions; resolve: (v: string | null) => void }
  | null;

let _setDialog: ((d: DialogState) => void) | null = null;

export function confirm(options: ConfirmOptions | string): Promise<boolean> {
  const opts: ConfirmOptions =
    typeof options === "string" ? { message: options } : options;
  return new Promise((resolve) => {
    _setDialog?.({ type: "confirm", options: opts, resolve });
  });
}

export function prompt(options: PromptOptions | string, defaultValue?: string): Promise<string | null> {
  const opts: PromptOptions =
    typeof options === "string" ? { message: options, defaultValue } : options;
  return new Promise((resolve) => {
    _setDialog?.({ type: "prompt", options: opts, resolve });
  });
}

export function ConfirmDialogProvider() {
  const [dialog, setDialog] = useState<DialogState>(null);
  const [inputValue, setInputValue] = useState("");

  _setDialog = useCallback((d: DialogState) => {
    if (d?.type === "prompt") setInputValue(d.options.defaultValue ?? "");
    setDialog(d);
  }, []);

  if (!dialog) return null;

  const close = () => setDialog(null);

  const variantColor =
    dialog.type === "confirm" && dialog.options.variant === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : dialog.type === "confirm" && dialog.options.variant === "warning"
      ? "bg-[var(--vd-orange-500)] hover:bg-[var(--vd-orange-600)]"
      : "bg-[var(--vd-blue-600)] hover:bg-[var(--vd-blue-700)]";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl">
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-[var(--muted)]">
              <AlertTriangle className="size-5 text-[var(--vd-orange-500)]" />
            </div>
            <div>
              {dialog.options.title && (
                <h3 className="text-base font-semibold text-[var(--foreground)] mb-1">
                  {dialog.options.title}
                </h3>
              )}
              <p className="text-sm text-[var(--muted-foreground)]">{dialog.options.message}</p>
            </div>
          </div>
          <button onClick={() => {
            if (dialog.type === "confirm") dialog.resolve(false);
            else dialog.resolve(null);
            close();
          }} className="rounded-lg p-1 hover:bg-[var(--muted)] transition-colors shrink-0">
            <X className="size-4 text-[var(--muted-foreground)]" />
          </button>
        </div>

        {dialog.type === "prompt" && (
          <div className="px-6 pb-4">
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { dialog.resolve(inputValue); close(); }
                if (e.key === "Escape") { dialog.resolve(null); close(); }
              }}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--vd-blue-600)]"
            />
          </div>
        )}

        <div className="flex justify-end gap-2 px-6 pb-5">
          <button
            onClick={() => {
              if (dialog.type === "confirm") dialog.resolve(false);
              else dialog.resolve(null);
              close();
            }}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            {dialog.type === "confirm"
              ? (dialog.options.cancelLabel ?? "Cancelar")
              : (dialog.options.cancelLabel ?? "Cancelar")}
          </button>
          <button
            onClick={() => {
              if (dialog.type === "confirm") dialog.resolve(true);
              else dialog.resolve(inputValue);
              close();
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${variantColor}`}
          >
            {dialog.type === "confirm"
              ? (dialog.options.confirmLabel ?? "Confirmar")
              : (dialog.options.confirmLabel ?? "OK")}
          </button>
        </div>
      </div>
    </div>
  );
}
