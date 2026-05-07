import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = (await auth()) as Session | null;
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session.user as any;
  const isAdmin: boolean = u.isAdmin ?? false;
  const roleId: string | null = u.roleId ?? null;

  const allAreas = await prisma.docArea.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      entries: {
        where: { isActive: true },
        orderBy: [{ order: "asc" }, { title: "asc" }],
      },
    },
  });

  // Filtra áreas e entradas pelo roleId do utilizador
  const visible = allAreas
    .filter((area) => {
      if (isAdmin) return true;
      const roleIds = area.roleIds as string[];
      return roleIds.length === 0 || (roleId && roleIds.includes(roleId));
    })
    .map((area) => ({
      ...area,
      entries: area.entries.filter((entry) => {
        if (isAdmin) return true;
        const entryRoles = entry.roleIds as string[];
        // Herda da área se vazio
        if (entryRoles.length === 0) return true;
        return roleId && entryRoles.includes(roleId);
      }),
    }));

  return NextResponse.json({ areas: visible });
}
