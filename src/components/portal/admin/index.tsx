"use client";

import { useState } from "react";
import { Users, ShieldCheck, RefreshCw, ScrollText, LayoutDashboard, LayoutGrid, Megaphone, FolderOpen, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminUsers } from "./admin-users";
import { AdminRoles } from "./admin-roles";
import { AdminSync } from "./admin-sync";
import { AdminAudit } from "./admin-audit";
import { AdminDashboard } from "./admin-dashboard";
import { AdminTools } from "./admin-tools";
import { AdminAnnouncementCategories } from "./admin-announcement-categories";
import { AdminDocs } from "./admin-docs";
import { AdminCalendars } from "./admin-calendars";

type Tab = "users" | "roles" | "sync" | "audit" | "dashboard" | "tools" | "feed" | "docs" | "calendars";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "users",     label: "Utilizadores",  icon: Users },
  { id: "roles",     label: "Roles",         icon: ShieldCheck },
  { id: "tools",     label: "Ferramentas",   icon: LayoutGrid },
  { id: "feed",      label: "Feed",          icon: Megaphone },
  { id: "docs",      label: "Documentos",    icon: FolderOpen },
  { id: "calendars", label: "Calendários",   icon: CalendarDays },
  { id: "dashboard", label: "Dashboard",     icon: LayoutDashboard },
  { id: "sync",      label: "Sincronização", icon: RefreshCw },
  { id: "audit",     label: "Auditoria",     icon: ScrollText },
];

export function Admin() {
  const [tab, setTab] = useState<Tab>("users");

  return (
    <div className="flex min-h-full flex-col gap-4 bg-[var(--muted)] p-4 sm:gap-6 sm:p-6 lg:p-8">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                active
                  ? "bg-[var(--vd-blue-500)] text-white shadow-sm"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo da tab */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6">
        {tab === "users"     && <AdminUsers />}
        {tab === "roles"     && <AdminRoles />}
        {tab === "tools"     && <AdminTools />}
        {tab === "feed"      && <AdminAnnouncementCategories />}
        {tab === "docs"      && <AdminDocs />}
        {tab === "dashboard" && <AdminDashboard />}
        {tab === "calendars" && <AdminCalendars />}
        {tab === "sync"      && <AdminSync />}
        {tab === "audit"     && <AdminAudit />}
      </div>
    </div>
  );
}
