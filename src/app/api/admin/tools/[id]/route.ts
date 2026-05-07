import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(s: Session | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(s?.user && (s.user as any).isAdmin);
}

// GET — ferramenta completa (inclui content) — para o editor
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await auth()) as Session | null;
  if (!isAdmin(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const { id } = await params;
  const tool = await prisma.tool.findUnique({ where: { id } });
  if (!tool) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json({ tool });
}

// PATCH — actualiza ferramenta
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await auth()) as Session | null;
  if (!isAdmin(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.name        !== undefined) data.name        = body.name.trim();
  if (body.description !== undefined) data.description = body.description?.trim() || null;
  if (body.content     !== undefined) data.content     = body.content;
  if (body.isActive    !== undefined) data.isActive    = body.isActive;
  if (body.roleIds     !== undefined) data.roleIds     = body.roleIds;
  if (body.order       !== undefined) data.order       = body.order;

  const tool = await prisma.tool.update({ where: { id }, data });
  return NextResponse.json({ tool });
}

// DELETE
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await auth()) as Session | null;
  if (!isAdmin(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const { id } = await params;
  await prisma.tool.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
