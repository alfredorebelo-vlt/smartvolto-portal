import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(session: Session | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(session?.user && (session.user as any).isAdmin);
}

// GET — lista todos os widgets (admin)
export async function GET() {
  const session = (await auth()) as Session | null;
  if (!isAdmin(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const widgets = await prisma.dashboardWidget.findMany({
    orderBy: [{ col: "asc" }, { order: "asc" }],
  });
  return NextResponse.json({ widgets });
}

// POST — cria widget
export async function POST(req: NextRequest) {
  const session = (await auth()) as Session | null;
  if (!isAdmin(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = await req.json();
  if (!body.type || !body.title) {
    return NextResponse.json({ error: "type e title obrigatórios" }, { status: 400 });
  }

  const maxOrder = await prisma.dashboardWidget.aggregate({
    _max: { order: true },
    where: { col: body.col ?? 1 },
  });

  const widget = await prisma.dashboardWidget.create({
    data: {
      type: body.type,
      title: body.title,
      config: body.config ?? {},
      col: body.col ?? 1,
      order: (maxOrder._max.order ?? -1) + 1,
      isActive: body.isActive ?? true,
      roleIds: body.roleIds ?? [],
      cacheTtl: body.cacheTtl ?? 300,
    },
  });

  return NextResponse.json({ widget }, { status: 201 });
}
