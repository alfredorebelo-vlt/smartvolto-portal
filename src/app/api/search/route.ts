import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = (await auth()) as Session | null;
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const [people, announcements, docs, articles] = await Promise.all([
    // Pessoas
    prisma.user.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { givenName: { contains: q } },
          { familyName: { contains: q } },
          { name: { contains: q } },
          { email: { contains: q } },
          { jobTitle: { contains: q } },
          { department: { contains: q } },
        ],
      },
      select: { id: true, givenName: true, familyName: true, name: true, email: true, jobTitle: true, department: true, image: true },
      take: 5,
    }),

    // Anúncios
    prisma.announcement.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
        ],
      },
      select: { id: true, title: true, content: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 4,
    }),

    // Documentos
    prisma.docEntry.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
        ],
      },
      select: { id: true, title: true, description: true, driveUrl: true, area: { select: { name: true } } },
      take: 4,
    }),

    // Manual
    prisma.manualArticle.findMany({
      where: {
        archivedAt: null,
        currentVersion: {
          OR: [
            { title: { contains: q } },
            { content: { contains: q } },
          ],
        },
      },
      select: {
        id: true,
        currentVersion: { select: { title: true } },
        category: { select: { name: true } },
      },
      take: 4,
    }),
  ]);

  const results = [
    ...people.map((p) => ({
      type: "person" as const,
      id: p.id,
      title: [p.givenName, p.familyName].filter(Boolean).join(" ") || p.name || p.email,
      subtitle: [p.jobTitle, p.department].filter(Boolean).join(" · ") || p.email,
      image: p.image ?? null,
      nav: "people",
    })),
    ...announcements.map((a) => ({
      type: "announcement" as const,
      id: a.id,
      title: a.title,
      subtitle: new Date(a.publishedAt).toLocaleDateString("pt-PT", { day: "numeric", month: "short", year: "numeric" }),
      image: null,
      nav: "feed",
    })),
    ...docs.map((d) => ({
      type: "doc" as const,
      id: d.id,
      title: d.title,
      subtitle: d.area?.name ?? "",
      image: null,
      url: d.driveUrl,
      nav: "docs",
    })),
    ...articles.map((a) => ({
      type: "manual" as const,
      id: a.id,
      title: a.currentVersion?.title ?? "",
      subtitle: a.category?.name ?? "",
      image: null,
      nav: "manual",
    })),
  ];

  return NextResponse.json({ results, query: q });
}
