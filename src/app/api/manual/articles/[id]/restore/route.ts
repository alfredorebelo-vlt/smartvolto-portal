import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

function canWrite(session: Session | null): boolean {
  if (!session?.user) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session.user as any;
  if (u.isAdmin) return true;
  return ((u.sections as string[]) ?? []).includes("manual.write");
}

// POST — restaura versão (cria nova com o conteúdo da antiga)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await auth()) as Session | null;
  if (!canWrite(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  const body = (await req.json()) as { versionId: string };
  if (!body.versionId) return NextResponse.json({ error: "versionId obrigatório" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session!.user as any;
  const dbUser = await prisma.user.findUnique({ where: { email: u.email } });
  if (!dbUser) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });

  const target = await prisma.manualArticleVersion.findUnique({ where: { id: body.versionId } });
  if (!target || target.articleId !== id) {
    return NextResponse.json({ error: "Versão não encontrada" }, { status: 404 });
  }

  const restored = await prisma.manualArticleVersion.create({
    data: {
      articleId: id,
      title: target.title,
      content: target.content,
      changeNote: `Restauro da versão de ${target.createdAt.toISOString().slice(0, 10)}`,
      authorId: dbUser.id,
    },
  });

  await prisma.manualArticle.update({
    where: { id },
    data: { currentVersionId: restored.id },
  });

  await logAudit({
    session,
    action: "RESTORE",
    entity: "Article",
    entityId: id,
    meta: {
      restoredFromVersionId: target.id,
      restoredFromDate: target.createdAt.toISOString(),
      newVersionId: restored.id,
    },
  });

  return NextResponse.json({ versionId: restored.id });
}
