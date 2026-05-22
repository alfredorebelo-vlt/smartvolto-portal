import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(session?.user as any)?.isAdmin) return null;
  return session;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const { name, calendarId, color, isActive, order } = body;
  const cal = await prisma.sharedCalendar.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(calendarId !== undefined && { calendarId: calendarId.trim() }),
      ...(color !== undefined && { color }),
      ...(isActive !== undefined && { isActive }),
      ...(order !== undefined && { order }),
    },
  });
  return NextResponse.json({ calendar: cal });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const { id } = await params;
  await prisma.sharedCalendar.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
