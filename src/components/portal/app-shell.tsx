"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ShieldOff } from "lucide-react";
import { Sidebar, type NavId } from "./sidebar";
import { Topbar } from "./topbar";
import { Home } from "./home";
import { People } from "./people";
import { Feed } from "./feed";
import { Profile } from "./profile";
import { Manual } from "./manual";
import { Calendar as CalendarView } from "./calendar";
import { Admin } from "./admin";
import { Tools } from "./tools";
import { Docs } from "./docs";
import { Placeholder } from "./placeholder";
import { Footer } from "./footer";
import { usePermissions } from "@/hooks/use-permissions";
import type { NavSectionKey } from "@/lib/sections";

const SECTION_META: Record<NavId, { title: string; subtitle: string }> = {
  home:     { title: "Início",               subtitle: "Resumo" },
  feed:     { title: "Anúncios da empresa",  subtitle: "Newsroom" },
  calendar: { title: "Calendário",           subtitle: "Agenda da equipa" },
  people:   { title: "Diretório de pessoas", subtitle: "Quem é quem" },
  docs:     { title: "Documentos",           subtitle: "Repositório" },
  manual:   { title: "Manual de operações",  subtitle: "Procedimentos" },
  profile:  { title: "O meu perfil",         subtitle: "Conta" },
  tools:    { title: "Ferramentas",          subtitle: "Stack interno" },
  admin:    { title: "Administração",        subtitle: "Gestão do portal" },
};

const PUBLIC_NAV: NavSectionKey[] = ["home", "profile"];

export function AppShell() {
  const { data: session } = useSession();
  const { isAdmin, can } = usePermissions();
  const [active, setActive] = useState<NavId>("home");
  const [mobileOpen, setMobileOpen] = useState(false);

  const meta = SECTION_META[active];
  const displayMeta =
    active === "home" && session?.user
      ? {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          title: `Bem-vindo, ${(session.user as any).givenName ?? session.user.name?.split(" ")[0] ?? ""}`,
          subtitle: meta.subtitle,
        }
      : meta;

  const handleNav = (id: NavId) => {
    setActive(id);
    setMobileOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const hasAccess = (() => {
    if (active === "admin") return isAdmin;
    if (PUBLIC_NAV.includes(active as NavSectionKey)) return true;
    return can(active as NavSectionKey);
  })();

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <Sidebar
        active={active}
        onNav={handleNav}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          title={displayMeta.title}
          subtitle={displayMeta.subtitle}
          onMenuClick={() => setMobileOpen(true)}
          onNav={(s) => handleNav(s as NavId)}
        />
        <main className="flex-1 overflow-auto">
          {!hasAccess ? (
            <AccessDenied />
          ) : active === "home" ? (
            <Home />
          ) : active === "people" ? (
            <People />
          ) : active === "feed" ? (
            <Feed />
          ) : active === "profile" ? (
            <Profile />
          ) : active === "calendar" ? (
            <CalendarView />
          ) : active === "manual" ? (
            <Manual />
          ) : active === "docs" ? (
            <Docs />
          ) : active === "admin" ? (
            <Admin />
          ) : active === "tools" ? (
            <Tools />
          ) : (
            <Placeholder section={active} />
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="grid min-h-full place-items-center bg-[var(--muted)] p-8">
      <div className="max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-[var(--vd-orange-50)]">
          <ShieldOff className="size-5 text-[var(--vd-orange-500)]" />
        </div>
        <h2
          className="m-0 text-xl font-bold text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.015em" }}
        >
          Sem permissão
        </h2>
        <p className="m-0 mt-2 text-sm text-[var(--muted-foreground)]">
          Não tens acesso a esta secção. Contacta um administrador se precisares de acesso.
        </p>
      </div>
    </div>
  );
}
