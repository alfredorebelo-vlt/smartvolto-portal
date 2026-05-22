import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function canRead(session: Session | null): boolean {
  if (!session?.user) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session.user as any;
  if (u.isAdmin) return true;
  return ((u.sections as string[]) ?? []).includes("admin.audit");
}

// GET — log de auditoria (admin/admin.audit), com filtros opcionais
export async function GET(req: NextRequest) {
  const session = (await auth()) as Session | null;
  if (!canRead(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const entity = searchParams.get("entity") ?? undefined;
  const entityId = searchParams.get("entityId") ?? undefined;
  const action = searchParams.get("action") ?? undefined;
  const userId = searchParams.get("userId") ?? undefined;
  const since = searchParams.get("since") ?? undefined;
  const until = searchParams.get("until") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);
  const cursor = searchParams.get("cursor") ?? undefined;

  const where: Record<string, unknown> = {};
  if (entity) where.entity = entity;
  if (entityId) where.entityId = entityId;
  if (action) where.action = action;
  if (userId) where.userId = userId;
  if (since || until) {
    where.createdAt = {
      ...(since ? { gte: new Date(since) } : {}),
      ...(until ? { lte: new Date(until) } : {}),
    };
  }

  const logs = await prisma.auditLog.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
  });

  const hasMore = logs.length > limit;
  const items = hasMore ? logs.slice(0, limit) : logs;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ logs: items, nextCursor });
}
