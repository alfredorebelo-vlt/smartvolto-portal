import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const AUTHOR_SELECT = {
  id: true, givenName: true, familyName: true, name: true, image: true, jobTitle: true,
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session.user as any;
  if (!u.isAdmin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 100);
  const cursor = searchParams.get("cursor") ?? undefined;

  // Pinned first on first page
  const pinned = !cursor
    ? await prisma.announcement.findMany({
        where: { isPinned: true },
        orderBy: { publishedAt: "desc" },
        include: { author: { select: AUTHOR_SELECT }, _count: { select: { reactions: true, comments: true } } },
      })
    : [];

  const items = await prisma.announcement.findMany({
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    where: { isPinned: false },
    orderBy: { publishedAt: "desc" },
    include: { author: { select: AUTHOR_SELECT }, _count: { select: { reactions: true, comments: true } } },
  });

  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return NextResponse.json({ announcements: [...pinned, ...page], nextCursor });
}
