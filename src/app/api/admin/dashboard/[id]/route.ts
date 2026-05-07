import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(session: Session | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(session?.user && (session.user as any).isAdmin);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await auth()) as Session | null;
  if (!isAdmin(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.title     !== undefined) data.title     = body.title;
  if (body.config    !== undefined) data.config    = body.config;
  if (body.col       !== undefined) data.col       = body.col;
  if (body.order     !== undefined) data.order     = body.order;
  if (body.isActive  !== undefined) data.isActive  = body.isActive;
  if (body.roleIds   !== undefined) data.roleIds   = body.roleIds;
  if (body.cacheTtl  !== undefined) data.cacheTtl  = body.cacheTtl;

  const widget = await prisma.dashboardWidget.update({ where: { id }, data });
  return NextResponse.json({ widget });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await auth()) as Session | null;
  if (!isAdmin(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  await prisma.dashboardWidget.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
