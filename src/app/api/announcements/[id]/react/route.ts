import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST — toggle reação (adiciona se não existe, remove se já existe)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session.user as any;

  const { id: announcementId } = await params;
  const { emoji } = (await req.json()) as { emoji: string };

  const ALLOWED = ["👍", "❤️", "🎉", "👏", "🙌"];
  if (!ALLOWED.includes(emoji)) return NextResponse.json({ error: "Emoji inválido" }, { status: 400 });

  const dbUser = await prisma.user.findUnique({ where: { email: u.email }, select: { id: true } });
  if (!dbUser) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });

  const existing = await prisma.announcementReaction.findUnique({
    where: { announcementId_userId_emoji: { announcementId, userId: dbUser.id, emoji } },
  });

  if (existing) {
    await prisma.announcementReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.announcementReaction.create({
      data: { announcementId, userId: dbUser.id, emoji },
    });
  }

  // Devolver contagens actualizadas
  const counts = await prisma.announcementReaction.groupBy({
    by: ["emoji"],
    where: { announcementId },
    _count: { emoji: true },
  });
  const myReactions = await prisma.announcementReaction.findMany({
    where: { announcementId, userId: dbUser.id },
    select: { emoji: true },
  });

  return NextResponse.json({
    counts: counts.map((c) => ({ emoji: c.emoji, count: c._count.emoji })),
    mine: myReactions.map((r) => r.emoji),
  });
}
