"use client";

import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { CHANGELOG, CURRENT_VERSION } from "@/lib/changelog";

export function Footer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <footer className="shrink-0 border-t border-[var(--border)] bg-[var(--card)] px-4 py-2 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
        <span>VOLTO DRIVE | Move Smart</span>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-[var(--muted)] transition-colors"
        >
          v{CURRENT_VERSION}
          <ChevronDown className="size-3" />
        </button>
      </footer>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-[var(--foreground)]">Histórico de versões</h2>
                <p className="text-xs text-[var(--muted-foreground)]">Smart Volto Portal</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors"
              >
                <X className="size-4 text-[var(--muted-foreground)]" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-6">
              {CHANGELOG.map((entry) => (
                <div key={entry.version}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="rounded-full bg-[var(--vd-blue-600)] px-2.5 py-0.5 text-xs font-semibold text-white">
                      v{entry.version}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)]">{entry.date}</span>
                    {entry.version === CURRENT_VERSION && (
                      <span className="rounded-full bg-[var(--vd-orange-500)] px-2 py-0.5 text-xs font-medium text-white">
                        atual
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[var(--foreground)] mb-2">{entry.description}</p>
                  <ul className="space-y-1">
                    {entry.changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[var(--muted-foreground)]">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--vd-blue-600)]" />
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
