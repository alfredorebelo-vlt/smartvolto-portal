import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(s: Session | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(s?.user && (s.user as any).isAdmin);
}

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

// GET — lista todas as ferramentas (admin)
export async function GET() {
  const session = (await auth()) as Session | null;
  if (!isAdmin(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const tools = await prisma.tool.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, slug: true, name: true, description: true, isActive: true, order: true, roleIds: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json({ tools });
}

// POST — cria ferramenta
export async function POST(req: NextRequest) {
  const session = (await auth()) as Session | null;
  if (!isAdmin(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = await req.json();
  if (!body.name?.trim() || !body.content?.trim()) {
    return NextResponse.json({ error: "name e content obrigatórios" }, { status: 400 });
  }

  const baseSlug = slugify(body.name.trim());
  let slug = baseSlug;
  let n = 1;
  while (await prisma.tool.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++n}`;
  }

  const maxOrder = await prisma.tool.aggregate({ _max: { order: true } });

  const tool = await prisma.tool.create({
    data: {
      slug,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      content: body.content,
      isActive: body.isActive ?? true,
      order: (maxOrder._max.order ?? -1) + 1,
      roleIds: body.roleIds ?? [],
    },
  });

  return NextResponse.json({ tool }, { status: 201 });
}
