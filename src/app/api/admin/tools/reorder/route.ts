import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = (await auth()) as Session | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(session?.user && (session.user as any).isAdmin)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }
  const { ids } = (await req.json()) as { ids: string[] };
  if (!Array.isArray(ids)) return NextResponse.json({ error: "ids obrigatório" }, { status: 400 });

  await prisma.$transaction(
    ids.map((id, idx) => prisma.tool.update({ where: { id }, data: { order: idx } }))
  );
  return NextResponse.json({ ok: true });
}
