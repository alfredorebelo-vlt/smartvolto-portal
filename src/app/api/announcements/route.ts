import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { sendWebhookMessage, formatAnnouncementMessage, isSlackConfigured } from "@/lib/slack";

const AUTHOR_SELECT = {
  id: true, givenName: true, familyName: true, name: true, image: true, jobTitle: true,
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session.user as any;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 100);
  const cursor = searchParams.get("cursor") ?? undefined;
  const category = searchParams.get("category") ?? undefined;

  const dbUser = await prisma.user.findUnique({ where: { email: u.email }, select: { id: true } });

  const where = {
    isPinned: false,
    ...(category ? { category } : {}),
  };

  // Pinned sempre no topo (sem paginação)
  const pinned = !cursor && !category
    ? await prisma.announcement.findMany({
        where: { isPinned: true },
        orderBy: { publishedAt: "desc" },
        include: {
          author: { select: AUTHOR_SELECT },
          _count: { select: { reactions: true, comments: true } },
          reactions: dbUser ? { where: { userId: dbUser.id }, select: { emoji: true } } : false,
        },
      })
    : [];

  const items = await prisma.announcement.findMany({
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    where,
    orderBy: { publishedAt: "desc" },
    include: {
      author: { select: AUTHOR_SELECT },
      _count: { select: { reactions: true, comments: true } },
      reactions: dbUser ? { where: { userId: dbUser.id }, select: { emoji: true } } : false,
    },
  });

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return NextResponse.json({ announcements: [...pinned, ...page], nextCursor });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session.user as any;
  const canWrite = u.isAdmin || (u.sections as string[])?.includes("announcements.write");
  if (!canWrite) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = (await req.json()) as {
    title: string; content: string; category?: string; isPinned?: boolean; publishedAt?: string;
  };
  if (!body.title?.trim() || !body.content?.trim())
    return NextResponse.json({ error: "Título e conteúdo obrigatórios" }, { status: 400 });

  const dbUser = await prisma.user.findUnique({ where: { email: u.email } });
  if (!dbUser) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });

  const announcement = await prisma.announcement.create({
    data: {
      title: body.title.trim(),
      content: body.content.trim(),
      category: body.category ?? null,
      isPinned: body.isPinned ?? false,
      authorId: dbUser.id,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
    },
    include: {
      author: { select: AUTHOR_SELECT },
      _count: { select: { reactions: true, comments: true } },
      reactions: { where: { userId: dbUser.id }, select: { emoji: true } },
    },
  });

  await logAudit({ session, action: "CREATE", entity: "Announcement", entityId: announcement.id, meta: { title: announcement.title } });

  // Notificar Slack (fire-and-forget — não bloqueia a resposta)
  if (isSlackConfigured()) {
    const authorName = [dbUser.givenName, dbUser.familyName].filter(Boolean).join(" ") || dbUser.name || dbUser.email;
    const baseUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "https://portal.voltodrive.com";
    const payload = formatAnnouncementMessage({
      title: announcement.title,
      content: announcement.content,
      authorName,
      category: announcement.category,
      portalUrl: `${baseUrl}/`,
    });
    sendWebhookMessage(payload).catch(() => null);
  }

  return NextResponse.json({ announcement }, { status: 201 });
}
