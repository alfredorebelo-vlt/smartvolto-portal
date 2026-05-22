import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ slug: string }> };

async function getToolWithAccess(slug: string, session: Session | null) {
  if (!session?.user) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session.user as any;
  const userRoleId: string | null = u.roleId ?? null;
  const isAdmin: boolean = u.isAdmin ?? false;

  const tool = await prisma.tool.findUnique({ where: { slug } });
  if (!tool || !tool.isActive) return null;

  const ids = tool.roleIds as string[];
  const hasAccess = isAdmin || ids.length === 0 || (userRoleId && ids.includes(userRoleId));
  return hasAccess ? tool : null;
}

// GET /api/tools/[slug]/data?key=state
export async function GET(req: NextRequest, { params }: Params) {
  const session = (await auth()) as Session | null;
  const { slug } = await params;
  const tool = await getToolWithAccess(slug, session);
  if (!tool) return NextResponse.json({ error: "Sem acesso" }, { status: 403 });

  const key = new URL(req.url).searchParams.get("key") ?? "state";
  const record = await prisma.toolData.findUnique({
    where: { toolId_key: { toolId: tool.id, key } },
  });

  return NextResponse.json({ data: record?.data ?? null, updatedAt: record?.updatedAt ?? null });
}

// POST /api/tools/[slug]/data
// Body: { key?: string, data: unknown }
export async function POST(req: NextRequest, { params }: Params) {
  const session = (await auth()) as Session | null;
  const { slug } = await params;
  const tool = await getToolWithAccess(slug, session);
  if (!tool) return NextResponse.json({ error: "Sem acesso" }, { status: 403 });

  const body = await req.json();
  const key: string = body.key ?? "state";
  if (body.data === undefined) return NextResponse.json({ error: "data obrigatório" }, { status: 400 });

  const record = await prisma.toolData.upsert({
    where: { toolId_key: { toolId: tool.id, key } },
    create: { toolId: tool.id, key, data: body.data },
    update: { data: body.data },
  });

  return NextResponse.json({ ok: true, updatedAt: record.updatedAt });
}
