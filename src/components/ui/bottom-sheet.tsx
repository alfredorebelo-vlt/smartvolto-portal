"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function BottomSheet({ open, onClose, title, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 lg:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={ref}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col rounded-t-2xl border-t border-[var(--border)] bg-[var(--card)] shadow-xl transition-transform duration-300 ease-out lg:hidden",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Handle */}
        <div className="flex shrink-0 items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-[var(--border)] absolute top-2 left-1/2 -translate-x-1/2" />
          {title && (
            <span className="text-sm font-semibold text-[var(--foreground)]">{title}</span>
          )}
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors"
          >
            <X className="size-4 text-[var(--muted-foreground)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}
