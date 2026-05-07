import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const AUTHOR_SELECT = {
  id: true, givenName: true, familyName: true, name: true, image: true,
};

// GET — lista comentários de um anúncio
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id: announcementId } = await params;
  const comments = await prisma.announcementComment.findMany({
    where: { announcementId },
    orderBy: { createdAt: "asc" },
    include: { author: { select: AUTHOR_SELECT } },
  });
  return NextResponse.json({ comments });
}

// POST — adiciona comentário
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session.user as any;

  const { id: announcementId } = await params;
  const { content } = (await req.json()) as { content: string };
  if (!content?.trim()) return NextResponse.json({ error: "Conteúdo obrigatório" }, { status: 400 });

  const dbUser = await prisma.user.findUnique({ where: { email: u.email }, select: { id: true } });
  if (!dbUser) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });

  const comment = await prisma.announcementComment.create({
    data: { announcementId, authorId: dbUser.id, content: content.trim() },
    include: { author: { select: AUTHOR_SELECT } },
  });
  return NextResponse.json({ comment }, { status: 201 });
}

// DELETE — apaga comentário (autor ou admin)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session.user as any;

  const { commentId } = (await req.json()) as { commentId: string };
  const comment = await prisma.announcementComment.findUnique({ where: { id: commentId } });
  if (!comment) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const dbUser = await prisma.user.findUnique({ where: { email: u.email }, select: { id: true } });
  if (!u.isAdmin && dbUser?.id !== comment.authorId)
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  await prisma.announcementComment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
