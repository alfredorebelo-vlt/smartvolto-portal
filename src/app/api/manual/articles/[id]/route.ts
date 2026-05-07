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

// GET — detalhe completo do artigo + versão atual
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await auth()) as Session | null;
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const article = await prisma.manualArticle.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true, color: true } },
      currentVersion: {
        include: {
          author: { select: { id: true, givenName: true, familyName: true, name: true, image: true } },
        },
      },
    },
  });
  if (!article || article.archivedAt) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ article });
}

// PATCH — cria nova versão (não sobrescreve)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await auth()) as Session | null;
  if (!canWrite(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  const body = (await req.json()) as {
    title?: string;
    content?: string;
    categoryId?: string;
    changeNote?: string;
  };

  const article = await prisma.manualArticle.findUnique({
    where: { id },
    include: { currentVersion: true },
  });
  if (!article || article.archivedAt) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session!.user as any;
  const dbUser = await prisma.user.findUnique({ where: { email: u.email } });
  if (!dbUser) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });

  // Categoria pode mudar, mas isso não cria versão
  if (body.categoryId && body.categoryId !== article.categoryId) {
    await prisma.manualArticle.update({
      where: { id },
      data: { categoryId: body.categoryId },
    });
    await logAudit({
      session,
      action: "UPDATE",
      entity: "Article",
      entityId: id,
      meta: { changedCategory: { from: article.categoryId, to: body.categoryId } },
    });
  }

  // Título/conteúdo → nova versão
  const titleChanged = body.title !== undefined && body.title !== article.currentVersion?.title;
  const contentChanged = body.content !== undefined && body.content !== article.currentVersion?.content;

  if (titleChanged || contentChanged) {
    if (!body.title?.trim() || !body.content?.trim()) {
      return NextResponse.json({ error: "Título e conteúdo obrigatórios" }, { status: 400 });
    }

    const newVersion = await prisma.manualArticleVersion.create({
      data: {
        articleId: id,
        title: body.title.trim(),
        content: body.content,
        changeNote: body.changeNote?.trim() || null,
        authorId: dbUser.id,
      },
    });

    await prisma.manualArticle.update({
      where: { id },
      data: { currentVersionId: newVersion.id },
    });

    await logAudit({
      session,
      action: "UPDATE",
      entity: "Article",
      entityId: id,
      meta: {
        versionId: newVersion.id,
        previousVersionId: article.currentVersionId,
        title: body.title.trim(),
        changeNote: body.changeNote?.trim() || null,
      },
    });
  }

  const updated = await prisma.manualArticle.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true, color: true } },
      currentVersion: {
        include: {
          author: { select: { id: true, givenName: true, familyName: true, name: true, image: true } },
        },
      },
    },
  });

  return NextResponse.json({ article: updated });
}

// DELETE — soft delete (mantém histórico)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await auth()) as Session | null;
  if (!canWrite(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  const article = await prisma.manualArticle.findUnique({
    where: { id },
    include: { currentVersion: { select: { title: true } } },
  });
  if (!article) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.manualArticle.update({
    where: { id },
    data: { archivedAt: new Date() },
  });

  await logAudit({
    session,
    action: "DELETE",
    entity: "Article",
    entityId: id,
    meta: { title: article.currentVersion?.title, soft: true },
  });

  return NextResponse.json({ ok: true });
}
