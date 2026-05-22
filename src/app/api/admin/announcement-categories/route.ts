import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(s: Session | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(s?.user && (s.user as any).isAdmin);
}

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

export async function GET() {
  const session = (await auth()) as Session | null;
  if (!isAdmin(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const cats = await prisma.announcementCategory.findMany({ orderBy: [{ order: "asc" }, { label: "asc" }] });
  return NextResponse.json({ categories: cats });
}

export async function POST(req: NextRequest) {
  const session = (await auth()) as Session | null;
  if (!isAdmin(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const body = await req.json();
  if (!body.label?.trim()) return NextResponse.json({ error: "label obrigatório" }, { status: 400 });

  const slug = slugify(body.label.trim());
  const max = await prisma.announcementCategory.aggregate({ _max: { order: true } });

  const cat = await prisma.announcementCategory.create({
    data: {
      slug,
      label: body.label.trim(),
      color: body.color ?? "#1A1F3C",
      bg: body.bg ?? "#F0F2F8",
      order: (max._max.order ?? -1) + 1,
      isActive: true,
    },
  });
  return NextResponse.json({ category: cat }, { status: 201 });
}
