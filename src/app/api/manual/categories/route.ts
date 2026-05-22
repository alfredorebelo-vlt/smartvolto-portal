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

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// GET — lista categorias com contagem de artigos ativos
export async function GET() {
  const session = (await auth()) as Session | null;
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const categories = await prisma.manualCategory.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { articles: { where: { archivedAt: null } } } },
    },
  });

  return NextResponse.json({ categories });
}

// POST — cria categoria (apenas com manual.write)
export async function POST(req: NextRequest) {
  const session = (await auth()) as Session | null;
  if (!canWrite(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = (await req.json()) as { name: string; description?: string; color?: string; order?: number };
  if (!body.name?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  const name = body.name.trim();
  const slug = slugify(name);

  const category = await prisma.manualCategory.create({
    data: {
      name,
      slug,
      description: body.description?.trim() || null,
      color: body.color?.trim() || null,
      order: body.order ?? 0,
    },
  });

  await logAudit({
    session,
    action: "CREATE",
    entity: "ArticleCategory",
    entityId: category.id,
    meta: { name },
  });

  return NextResponse.json({ category }, { status: 201 });
}
