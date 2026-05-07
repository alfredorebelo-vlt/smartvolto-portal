import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(session?.user as any)?.isAdmin) return null;
  return session;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const calendars = await prisma.sharedCalendar.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ calendars });
}

export async function POST(request: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const body = await request.json();
  const { name, calendarId, color } = body;
  if (!name?.trim() || !calendarId?.trim()) {
    return NextResponse.json({ error: "Nome e ID do calendário são obrigatórios" }, { status: 400 });
  }
  const count = await prisma.sharedCalendar.count();
  const cal = await prisma.sharedCalendar.create({
    data: { name: name.trim(), calendarId: calendarId.trim(), color: color ?? "#2e3c8f", order: count },
  });
  return NextResponse.json({ calendar: cal }, { status: 201 });
}
