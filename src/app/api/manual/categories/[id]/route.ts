import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

function canWrite(session: Session | null): boolean {
  if (!session?.user) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session.user as any;
  if (u.isAdmin) return true;
  return ((u.sections as string[]) ?? []).includes("manual.write");
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await auth()) as Session | null;
  if (!canWrite(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const { id } = await params;

  const body = (await req.json()) as { name?: string; description?: string; color?: string; order?: number };
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name.trim();
  if (body.description !== undefined) data.description = body.description.trim() || null;
  if (body.color !== undefined) data.color = body.color.trim() || null;
  if (body.order !== undefined) data.order = body.order;

  const category = await prisma.manualCategory.update({ where: { id }, data });

  await logAudit({
    session,
    action: "UPDATE",
    entity: "ArticleCategory",
    entityId: id,
    meta: { changes: Object.keys(data) },
  });

  return NextResponse.json({ category });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await auth()) as Session | null;
  if (!canWrite(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const { id } = await params;

  const count = await prisma.manualArticle.count({ where: { categoryId: id, archivedAt: null } });
  if (count > 0) {
    return NextResponse.json(
      { error: `Categoria tem ${count} artigos ativos. Move-os primeiro.` },
      { status: 400 }
    );
  }

  const category = await prisma.manualCategory.findUnique({ where: { id } });
  await prisma.manualCategory.delete({ where: { id } });

  await logAudit({
    session,
    action: "DELETE",
    entity: "ArticleCategory",
    entityId: id,
    meta: { name: category?.name },
  });

  return NextResponse.json({ ok: true });
}
