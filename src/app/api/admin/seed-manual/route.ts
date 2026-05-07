import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { manualSeed } from "@/lib/manual-seed-data";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// POST /api/admin/seed-manual?force=true — popula manual com base no PDF v1.1
// Apenas admin. Sem ?force=true, falha se já existirem artigos.
export async function POST(req: Request) {
  const session = (await auth()) as Session | null;
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = session.user as any;
  if (!u.isAdmin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const force = searchParams.get("force") === "true";

  const existingCount = await prisma.manualArticle.count({ where: { archivedAt: null } });
  if (existingCount > 0 && !force) {
    return NextResponse.json({
      error: `Já existem ${existingCount} artigos. Usa ?force=true para arquivar e re-popular.`,
    }, { status: 409 });
  }

  const dbUser = await prisma.user.findUnique({ where: { email: u.email } });
  if (!dbUser) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });

  // Se force=true, arquivar artigos existentes (mantém histórico)
  if (force && existingCount > 0) {
    await prisma.manualArticle.updateMany({
      where: { archivedAt: null },
      data: { archivedAt: new Date() },
    });
  }

  const createdCategories: string[] = [];
  const createdArticles: string[] = [];

  for (const cat of manualSeed.categories) {
    let category = await prisma.manualCategory.findUnique({ where: { slug: slugify(cat.name) } });
    if (!category) {
      category = await prisma.manualCategory.create({
        data: {
          name: cat.name,
          slug: slugify(cat.name),
          description: cat.description ?? null,
          color: cat.color ?? null,
          order: cat.order,
        },
      });
      createdCategories.push(cat.name);
      await logAudit({
        session,
        action: "CREATE",
        entity: "ArticleCategory",
        entityId: category.id,
        meta: { name: cat.name, source: "seed-manual v1.1" },
      });
    }

    for (const art of cat.articles) {
      const baseSlug = slugify(art.title);
      let slug = baseSlug;
      let n = 1;
      while (await prisma.manualArticle.findUnique({ where: { slug } })) {
        n += 1;
        slug = `${baseSlug}-${n}`;
      }

      const article = await prisma.manualArticle.create({
        data: { slug, categoryId: category.id },
      });
      const version = await prisma.manualArticleVersion.create({
        data: {
          articleId: article.id,
          title: art.title,
          content: art.content,
          changeNote: "Versão inicial — Manual Operativo de Balcão v1.1 (09 março 2026)",
          authorId: dbUser.id,
        },
      });
      await prisma.manualArticle.update({
        where: { id: article.id },
        data: { currentVersionId: version.id },
      });

      createdArticles.push(art.title);
      await logAudit({
        session,
        action: "CREATE",
        entity: "Article",
        entityId: article.id,
        meta: { title: art.title, source: "seed-manual v1.1" },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    createdCategories: createdCategories.length,
    createdArticles: createdArticles.length,
    archivedExisting: force ? existingCount : 0,
  });
}
