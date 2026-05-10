"use client";

import { useState } from "react";
import {
  Users, ShieldCheck, RefreshCw, ScrollText, LayoutDashboard,
  LayoutGrid, Megaphone, FolderOpen, CalendarDays, BookOpen,
  ChevronRight, ChevronDown, Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { AdminUsers } from "./admin-users";
import { AdminRoles } from "./admin-roles";
import { AdminSync } from "./admin-sync";
import { AdminAudit } from "./admin-audit";
import { AdminDashboard } from "./admin-dashboard";
import { AdminTools } from "./admin-tools";
import { AdminAnnouncementCategories } from "./admin-announcement-categories";
import { AdminDocs } from "./admin-docs";
import { AdminCalendars } from "./admin-calendars";
import { AdminManual } from "./admin-manual";

type Tab = "users" | "roles" | "tools" | "feed" | "docs" | "manual" | "calendars" | "dashboard" | "sync" | "audit";

type TabGroup = {
  label: string;
  items: { id: Tab; label: string; icon: React.ElementType }[];
};

const GROUPS: TabGroup[] = [
  {
    label: "Pessoas",
    items: [
      { id: "users", label: "Utilizadores", icon: Users },
      { id: "roles", label: "Roles",        icon: ShieldCheck },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { id: "feed",      label: "Feed",        icon: Megaphone },
      { id: "docs",      label: "Documentos",  icon: FolderOpen },
      { id: "manual",    label: "Manual",      icon: BookOpen },
      { id: "tools",     label: "Ferramentas", icon: LayoutGrid },
      { id: "calendars", label: "Calendários", icon: CalendarDays },
    ],
  },
  {
    label: "Sistema",
    items: [
      { id: "dashboard", label: "Dashboard",     icon: LayoutDashboard },
      { id: "sync",      label: "Sincronização", icon: RefreshCw },
      { id: "audit",     label: "Auditoria",     icon: ScrollText },
    ],
  },
];

const ALL_ITEMS = GROUPS.flatMap((g) => g.items);

export function Admin() {
  const [tab, setTab] = useState<Tab>("users");
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeItem = ALL_ITEMS.find((i) => i.id === tab)!;
  const ActiveIcon = activeItem.icon;

  function select(id: Tab) {
    setTab(id);
    setSheetOpen(false);
  }

  return (
    <div className="flex h-full flex-col bg-[var(--muted)]">

      {/* ── Mobile trigger (mesmo padrão do Tools/Manual) ─────────────────── */}
      <button
        onClick={() => setSheetOpen(true)}
        className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-4 py-3 lg:hidden"
      >
        <div className="flex items-center gap-2">
          <ActiveIcon className="size-4 text-[var(--muted-foreground)]" />
          <span className="text-sm font-medium text-[var(--foreground)]">{activeItem.label}</span>
        </div>
        <ChevronDown className="size-4 text-[var(--muted-foreground)]" />
      </button>

      {/* ── Bottom sheet mobile ────────────────────────────────────────────── */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Administração">
        <div className="p-3 pb-8">
          {GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                {group.label}
              </p>
              {group.items.map(({ id, label, icon: Icon }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => select(id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                      active
                        ? "bg-[var(--vd-blue-500)]/10 font-semibold text-[var(--vd-blue-500)]"
                        : "text-[var(--foreground)] hover:bg-[var(--muted)]",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1 text-sm">{label}</span>
                    {active && <ChevronRight className="size-3.5 shrink-0 opacity-60" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </BottomSheet>

      {/* ── Layout principal (desktop: sidebar + content / mobile: só content) */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar — desktop only */}
        <aside className="hidden w-52 shrink-0 flex-col gap-5 overflow-y-auto border-r border-[var(--border)] bg-[var(--card)] p-3 lg:flex">
          <div className="flex items-center gap-2 px-2 pt-1">
            <Settings2 className="size-4 text-[var(--muted-foreground)]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              Administração
            </span>
          </div>
          {GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map(({ id, label, icon: Icon }) => {
                  const active = tab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTab(id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-[var(--vd-blue-500)]/10 font-semibold text-[var(--vd-blue-500)] dark:bg-[var(--vd-blue-500)]/20"
                          : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="flex-1 text-left">{label}</span>
                      {active && <ChevronRight className="size-3 shrink-0 opacity-50" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <AdminContent tab={tab} />
        </div>

      </div>
    </div>
  );
}

function AdminContent({ tab }: { tab: Tab }) {
  return (
    <>
      {tab === "users"     && <AdminUsers />}
      {tab === "roles"     && <AdminRoles />}
      {tab === "tools"     && <AdminTools />}
      {tab === "feed"      && <AdminAnnouncementCategories />}
      {tab === "docs"      && <AdminDocs />}
      {tab === "manual"    && <AdminManual />}
      {tab === "dashboard" && <AdminDashboard />}
      {tab === "calendars" && <AdminCalendars />}
      {tab === "sync"      && <AdminSync />}
      {tab === "audit"     && <AdminAudit />}
    </>
  );
}
