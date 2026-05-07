import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const cats = await prisma.announcementCategory.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { label: "asc" }],
    select: { id: true, slug: true, label: true, color: true, bg: true },
  });
  return NextResponse.json({ categories: cats });
}
