import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET — histórico completo de versões do artigo
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = (await auth()) as Session | null;
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const versions = await prisma.manualArticleVersion.findMany({
    where: { articleId: id },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, givenName: true, familyName: true, name: true, image: true } },
    },
  });

  const article = await prisma.manualArticle.findUnique({
    where: { id },
    select: { currentVersionId: true },
  });

  return NextResponse.json({ versions, currentVersionId: article?.currentVersionId });
}
