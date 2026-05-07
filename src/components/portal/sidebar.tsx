"use client";

import Image from "next/image";
import {
  Home,
  Megaphone,
  Calendar,
  Users,
  Folder,
  BookOpen,
  LayoutGrid,
  X,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";
import { usePermissions } from "@/hooks/use-permissions";
import type { NavSectionKey } from "@/lib/sections";

export type NavId = NavSectionKey;

type Item = {
  id: NavId;
  label: string;
  icon: React.ElementType;
  badge?: number;
  adminOnly?: boolean;
};

const ITEMS: Item[] = [
  { id: "home",     label: "Home",             icon: Home },
  { id: "feed",     label: "Anúncios",         icon: Megaphone },
  { id: "calendar", label: "Calendário",       icon: Calendar },
  { id: "people",   label: "Pessoas",          icon: Users },
  { id: "docs",     label: "Documentos",       icon: Folder },
  { id: "manual",   label: "Manual operações", icon: BookOpen },
  { id: "tools",    label: "Ferramentas",      icon: LayoutGrid },
  { id: "admin",    label: "Administração",    icon: ShieldCheck, adminOnly: true },
];

type Props = {
  active: NavId;
  onNav: (id: NavId) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
};

export function Sidebar({ active, onNav, mobileOpen = false, onCloseMobile }: Props) {
  const { isAdmin, can } = usePermissions();

  const mainItems = ITEMS.filter((item) => {
    if (item.adminOnly) return false;
    if (item.id === "home") return true;
    return can(item.id as NavSectionKey);
  });

  return (
    <>
      {/* Overlay mobile */}
      <div
        onClick={onCloseMobile}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] shrink-0 flex-col gap-1 border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] px-3.5 pb-5 pt-0 transition-transform duration-300",
          "lg:static lg:w-[244px] lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo + fechar mobile */}
        <div className="mb-3 border-b border-[var(--sidebar-border)] pb-3">
          {/* botão fechar apenas mobile */}
          <div className="flex w-full items-center justify-end pt-3 lg:hidden">
            <button type="button" onClick={onCloseMobile} aria-label="Fechar menu" className="grid size-8 place-items-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]">
              <X className="size-4" />
            </button>
          </div>
          <div className="flex items-center gap-2.5 py-4 pl-1">
            <Image src="/brand/symbol.png" alt="" width={40} height={40} priority className="size-10 shrink-0" />
            <div className="flex flex-col leading-none">
              <span className="text-xl font-bold text-[var(--vd-blue-500)]" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}>Smart Volto</span>
            </div>
          </div>
        </div>

{/* Navegação principal */}
        <nav className="flex flex-col gap-1 overflow-y-auto">
          {mainItems.map((item) => (
            <NavItem key={item.id} item={item} isActive={item.id === active} onClick={() => onNav(item.id)} />
          ))}
        </nav>

        {/* Administração — separada na base, só para admins */}
        {isAdmin && (
          <div className="mt-auto flex flex-col gap-1 border-t border-[var(--sidebar-border)] pt-2">
            <NavItem
              item={ITEMS.find((i) => i.id === "admin")!}
              isActive={active === "admin"}
              onClick={() => onNav("admin")}
            />
          </div>
        )}

        <div className={cn("mt-2", !isAdmin && "mt-auto")}>
          <UserMenu onNav={(id) => onNav(id as NavId)} />
        </div>
      </aside>
    </>
  );
}

function NavItem({ item, isActive, onClick }: { item: Item; isActive: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg border-0 px-3 py-2.5 text-left text-sm transition-colors lg:py-2",
        isActive
          ? "bg-[var(--sidebar-accent)] font-semibold text-[var(--sidebar-accent-foreground)]"
          : "font-medium text-[var(--sidebar-foreground)] hover:bg-[var(--muted)]",
      )}
    >
      <Icon className={cn("size-4 shrink-0", isActive ? "text-[var(--sidebar-accent-foreground)]" : "text-[var(--muted-foreground)]")} />
      <span>{item.label}</span>
      {item.badge ? (
        <span className="ml-auto rounded-full bg-[var(--vd-orange-500)] px-1.5 py-px text-[10px] font-bold text-white">
          {item.badge}
        </span>
      ) : null}
    </button>
  );
}
