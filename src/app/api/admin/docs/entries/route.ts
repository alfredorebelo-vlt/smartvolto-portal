import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(s: Session | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(s?.user && (s.user as any).isAdmin);
}

export async function GET(req: NextRequest) {
  const session = (await auth()) as Session | null;
  if (!isAdmin(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const areaId = req.nextUrl.searchParams.get("areaId");
  const entries = await prisma.docEntry.findMany({
    where: areaId ? { areaId } : undefined,
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { area: { select: { id: true, name: true, slug: true } } },
  });
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const session = (await auth()) as Session | null;
  if (!isAdmin(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = await req.json();
  if (!body.title?.trim()) return NextResponse.json({ error: "title obrigatório" }, { status: 400 });
  if (!body.driveUrl?.trim()) return NextResponse.json({ error: "driveUrl obrigatório" }, { status: 400 });
  if (!body.areaId) return NextResponse.json({ error: "areaId obrigatório" }, { status: 400 });

  const maxOrder = await prisma.docEntry.aggregate({
    where: { areaId: body.areaId },
    _max: { order: true },
  });

  const entry = await prisma.docEntry.create({
    data: {
      areaId: body.areaId,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      driveFileId: body.driveFileId?.trim() || null,
      driveUrl: body.driveUrl.trim(),
      embedType: body.embedType || "none",
      isActive: body.isActive ?? true,
      order: (maxOrder._max.order ?? -1) + 1,
      roleIds: body.roleIds ?? [],
    },
    include: { area: { select: { id: true, name: true, slug: true } } },
  });

  return NextResponse.json({ entry }, { status: 201 });
}
