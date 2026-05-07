import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(s: Session | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(s?.user && (s.user as any).isAdmin);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await auth()) as Session | null;
  if (!isAdmin(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const entry = await prisma.docEntry.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(body.description !== undefined && { description: body.description?.trim() || null }),
      ...(body.driveFileId !== undefined && { driveFileId: body.driveFileId?.trim() || null }),
      ...(body.driveUrl !== undefined && { driveUrl: body.driveUrl.trim() }),
      ...(body.embedType !== undefined && { embedType: body.embedType }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.order !== undefined && { order: body.order }),
      ...(body.areaId !== undefined && { areaId: body.areaId }),
      ...(body.roleIds !== undefined && { roleIds: body.roleIds }),
    },
    include: { area: { select: { id: true, name: true, slug: true } } },
  });

  return NextResponse.json({ entry });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await auth()) as Session | null;
  if (!isAdmin(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  await prisma.docEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
