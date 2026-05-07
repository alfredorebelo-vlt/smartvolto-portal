import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fetchWidgetData } from "@/lib/dashboard/adapters";
import type { WidgetType, WidgetConfig } from "@/lib/dashboard/types";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = (await auth()) as Session | null;
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const widget = await prisma.dashboardWidget.findUnique({ where: { id } });
  if (!widget || !widget.isActive) {
    return NextResponse.json({ error: "Widget não encontrado" }, { status: 404 });
  }

  const result = await fetchWidgetData(widget.type as WidgetType, widget.config as WidgetConfig);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }

  return NextResponse.json(
    { ok: true, data: result.data, cachedAt: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": `s-maxage=${widget.cacheTtl}, stale-while-revalidate`,
      },
    }
  );
}
