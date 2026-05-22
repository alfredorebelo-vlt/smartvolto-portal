import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = (await auth()) as Session | null;
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session.user as any;
  const canWrite = u.isAdmin || ((u.sections as string[]) ?? []).includes("manual.write");
  if (!canWrite) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = (await req.json()) as { ids: string[] };
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "ids obrigatório" }, { status: 400 });
  }

  await prisma.$transaction(
    body.ids.map((id, idx) =>
      prisma.manualCategory.update({ where: { id }, data: { order: idx } })
    )
  );

  return NextResponse.json({ ok: true });
}
