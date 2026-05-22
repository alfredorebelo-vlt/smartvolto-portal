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

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// GET — lista artigos (com filtros opcionais)
export async function GET(req: NextRequest) {
  const session = (await auth()) as Session | null;
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const search = searchParams.get("search")?.toLowerCase().trim() || "";

  const articles = await prisma.manualArticle.findMany({
    where: {
      archivedAt: null,
      ...(categoryId ? { categoryId } : {}),
    },
    include: {
      category: { select: { id: true, name: true, slug: true, color: true } },
      currentVersion: {
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          author: { select: { id: true, givenName: true, familyName: true, name: true, image: true } },
        },
      },
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  const filtered = search
    ? articles.filter((a) => {
        const title = a.currentVersion?.title.toLowerCase() ?? "";
        const content = a.currentVersion?.content.toLowerCase() ?? "";
        return title.includes(search) || content.includes(search);
      })
    : articles;

  return NextResponse.json({ articles: filtered });
}

// POST — cria artigo + 1ª versão
export async function POST(req: NextRequest) {
  const session = (await auth()) as Session | null;
  if (!canWrite(session)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = (await req.json()) as {
    title: string;
    content: string;
    categoryId: string;
    changeNote?: string;
  };

  if (!body.title?.trim() || !body.content?.trim() || !body.categoryId) {
    return NextResponse.json({ error: "Título, conteúdo e categoria são obrigatórios" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session!.user as any;
  const dbUser = await prisma.user.findUnique({ where: { email: u.email } });
  if (!dbUser) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });

  const title = body.title.trim();
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let n = 1;
  while (await prisma.manualArticle.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }

  // Cria artigo com placeholder e depois liga primeira versão
  const article = await prisma.manualArticle.create({
    data: { slug, categoryId: body.categoryId },
  });

  const version = await prisma.manualArticleVersion.create({
    data: {
      articleId: article.id,
      title,
      content: body.content,
      changeNote: body.changeNote?.trim() || "Versão inicial",
      authorId: dbUser.id,
    },
  });

  const updated = await prisma.manualArticle.update({
    where: { id: article.id },
    data: { currentVersionId: version.id },
    include: {
      category: { select: { id: true, name: true, slug: true, color: true } },
      currentVersion: {
        include: {
          author: { select: { id: true, givenName: true, familyName: true, name: true, image: true } },
        },
      },
    },
  });

  await logAudit({
    session,
    action: "CREATE",
    entity: "Article",
    entityId: article.id,
    meta: { title, categoryId: body.categoryId, versionId: version.id },
  });

  return NextResponse.json({ article: updated }, { status: 201 });
}
