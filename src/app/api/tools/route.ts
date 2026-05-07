import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET — ferramentas activas visíveis para o role do utilizador (sem content)
export async function GET() {
  const session = (await auth()) as Session | null;
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session.user as any;
  const userRoleId: string | null = u.roleId ?? null;
  const isAdmin: boolean = u.isAdmin ?? false;

  const all = await prisma.tool.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, slug: true, name: true, description: true, roleIds: true },
  });

  const visible = all.filter((t) => {
    if (isAdmin) return true;
    const ids = t.roleIds as string[];
    return ids.length === 0 || (userRoleId && ids.includes(userRoleId));
  });

  return NextResponse.json({ tools: visible.map(({ roleIds: _r, ...t }) => t) });
}
