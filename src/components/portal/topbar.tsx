"use client";

import { Bell, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "./search";

type Props = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onMenuClick?: () => void;
  onNav?: (section: string) => void;
};

export function Topbar({ title, subtitle, actions, onMenuClick, onNav }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Abrir menu"
          className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-[var(--border)] bg-[var(--card)] transition-colors hover:bg-[var(--muted)] lg:hidden"
        >
          <Menu className="size-4 text-[var(--muted-foreground)]" />
        </button>
        <div className="min-w-0 flex-1">
          {subtitle ? (
            <div className="vd-eyebrow truncate">{subtitle}</div>
          ) : null}
          <h1
            className="m-0 truncate text-xl font-bold leading-tight text-[var(--vd-blue-500)] dark:text-[var(--foreground)] sm:text-[22px] lg:text-[26px]"
            style={{ letterSpacing: "-0.015em" }}
          >
            {title}
          </h1>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
        {actions}
        <GlobalSearch onNav={onNav ?? (() => {})} />
        <ThemeToggle />
        <button
          type="button"
          aria-label="Notificações"
          className="relative grid size-9 place-items-center rounded-[10px] border border-[var(--border)] bg-[var(--card)] transition-colors hover:bg-[var(--muted)]"
        >
          <Bell className="size-4 text-[var(--muted-foreground)]" />
          <span
            className="absolute right-[7px] top-[7px] size-[7px] rounded-full bg-[var(--vd-orange-500)]"
            style={{ border: "2px solid var(--card)" }}
          />
        </button>
      </div>
    </div>
  );
}
