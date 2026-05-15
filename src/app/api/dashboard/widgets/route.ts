import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET — widgets activos visíveis para o utilizador actual
export async function GET() {
  const session = (await auth()) as Session | null;
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session.user as any;
  const userRoleId: string | null = u.roleId ?? null;

  const all = await prisma.dashboardWidget.findMany({
    where: { isActive: true },
    orderBy: [{ col: "asc" }, { order: "asc" }],
    select: { id: true, type: true, title: true, config: true, col: true, order: true, cacheTtl: true, roleIds: true },
  });

  // Filter by role: empty roleIds = visible to everyone
  const visible = all.filter((w) => {
    const ids = w.roleIds as string[];
    return ids.length === 0 || (userRoleId && ids.includes(userRoleId));
  });

  // Strip widget-level roleIds; for quick_links, filter individual links by role
  const widgets = visible.map(({ roleIds: _r, ...w }) => {
    if (w.type !== "quick_links") return w;
    const cfg = w.config as { links?: { roleIds?: string[]; [k: string]: unknown }[] };
    if (!cfg?.links) return w;
    const filteredLinks = cfg.links
      .filter((l) => {
        const ids = l.roleIds ?? [];
        return ids.length === 0 || (userRoleId && ids.includes(userRoleId));
      })
      .map(({ roleIds: _lr, ...l }) => l);
    return { ...w, config: { ...cfg, links: filteredLinks } };
  });

  return NextResponse.json({ widgets });
}
