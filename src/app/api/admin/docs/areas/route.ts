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

export async function GET() {
  const session = (await auth()) as Session | null;
  if (!isAdmin(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  try {
    const areas = await prisma.docArea.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { entries: true } } },
    });
    return NextResponse.json({ areas });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[admin/docs/areas GET]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = (await auth()) as Session | null;
  if (!isAdmin(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "name obrigatório" }, { status: 400 });

  const baseSlug = slugify(body.name.trim());
  let slug = baseSlug;
  let n = 1;
  while (await prisma.docArea.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++n}`;
  }

  const maxOrder = await prisma.docArea.aggregate({ _max: { order: true } });

  const area = await prisma.docArea.create({
    data: {
      name: body.name.trim(),
      slug,
      description: body.description?.trim() || null,
      color: body.color || "#2e3c8f",
      isActive: body.isActive ?? true,
      order: (maxOrder._max.order ?? -1) + 1,
      roleIds: body.roleIds ?? [],
    },
  });

  return NextResponse.json({ area }, { status: 201 });
}
