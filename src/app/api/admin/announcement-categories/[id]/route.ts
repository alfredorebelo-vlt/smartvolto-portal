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
  const data: Record<string, unknown> = {};
  if (body.label    !== undefined) data.label    = body.label.trim();
  if (body.color    !== undefined) data.color    = body.color;
  if (body.bg       !== undefined) data.bg       = body.bg;
  if (body.order    !== undefined) data.order    = body.order;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  const cat = await prisma.announcementCategory.update({ where: { id }, data });
  return NextResponse.json({ category: cat });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await auth()) as Session | null;
  if (!isAdmin(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const { id } = await params;
  await prisma.announcementCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
