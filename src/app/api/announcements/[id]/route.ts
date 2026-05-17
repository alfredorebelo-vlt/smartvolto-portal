import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

const AUTHOR_SELECT = {
  id: true, givenName: true, familyName: true, name: true, image: true, jobTitle: true,
};

async function canManage(session: Session | null, authorId: string) {
  if (!session?.user) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session.user as any;
  if (u.isAdmin) return true;
  if ((u.sections as string[])?.includes("announcements.write")) {
    const dbUser = await prisma.user.findUnique({ where: { email: u.email } });
    return dbUser?.id === authorId;
  }
  return false;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (!(await canManage(session, existing.authorId)))
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = (await req.json()) as {
    title?: string; content?: string; category?: string | null; isPinned?: boolean; roleIds?: string[];
  };
  const data: Record<string, unknown> = {};
  if (body.title     !== undefined) data.title    = body.title.trim();
  if (body.content   !== undefined) data.content  = body.content.trim();
  if (body.category  !== undefined) data.category = body.category;
  if (body.isPinned  !== undefined) data.isPinned = body.isPinned;
  if (body.roleIds   !== undefined) data.roleIds  = body.roleIds;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = (session as any)?.user as any;
  const dbUser = await prisma.user.findUnique({ where: { email: u?.email }, select: { id: true } });

  const announcement = await prisma.announcement.update({
    where: { id },
    data,
    include: {
      author: { select: AUTHOR_SELECT },
      _count: { select: { reactions: true, comments: true } },
      reactions: dbUser ? { where: { userId: dbUser.id }, select: { emoji: true } } : false,
    },
  });

  await logAudit({ session, action: "UPDATE", entity: "Announcement", entityId: id, meta: { changes: Object.keys(data) } });
  return NextResponse.json({ announcement });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (!(await canManage(session, existing.authorId)))
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  await prisma.announcement.delete({ where: { id } });
  await logAudit({ session, action: "DELETE", entity: "Announcement", entityId: id, meta: { title: existing.title } });
  return NextResponse.json({ ok: true });
}
