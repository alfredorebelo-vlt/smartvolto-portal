import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { injectBridge } from "@/lib/tool-bridge";

// GET — devolve o HTML da ferramenta se o utilizador tiver acesso
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = (await auth()) as Session | null;
  if (!session?.user) return new NextResponse("Não autenticado", { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session.user as any;
  const userRoleId: string | null = u.roleId ?? null;
  const isAdmin: boolean = u.isAdmin ?? false;

  const { slug } = await params;
  const tool = await prisma.tool.findUnique({ where: { slug } });

  if (!tool || !tool.isActive) return new NextResponse("Não encontrado", { status: 404 });

  const ids = tool.roleIds as string[];
  const hasAccess = isAdmin || ids.length === 0 || (userRoleId && ids.includes(userRoleId));
  if (!hasAccess) return new NextResponse("Sem permissão", { status: 403 });

  return new NextResponse(injectBridge(tool.content, slug), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Permite iframe apenas do mesmo origem (o portal)
      "X-Frame-Options": "SAMEORIGIN",
      "Cache-Control": "no-store",
    },
  });
}
