import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import Anthropic from "@anthropic-ai/sdk";
import { createRequire } from "module";

export const maxDuration = 120;

const _require = createRequire(import.meta.url);

function isAdmin(session: Session | null): boolean {
  return !!(session?.user && (session.user as { isAdmin?: boolean }).isAdmin);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

type ImportArticle = { title: string; content: string };
type ImportCategory = { name: string; description?: string; articles: ImportArticle[] };
type ImportStructure = { categories: ImportCategory[] };

async function extractPdfText(buffer: ArrayBuffer): Promise<{ text: string; pageCount: number }> {
  // Dynamic import — pdfjs-dist v5 is ESM only
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // Point to the bundled worker so pdfjs doesn't try to fetch one
  pdfjsLib.GlobalWorkerOptions.workerSrc = _require.resolve(
    "pdfjs-dist/legacy/build/pdf.worker.mjs"
  );

  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pageTexts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item) => ("str" in item ? (item.str as string) : ""))
      .join(" ");
    pageTexts.push(text);
  }

  return { text: pageTexts.join("\n\n").trim(), pageCount: pdf.numPages };
}

function extractJson(raw: string): string {
  // Strip markdown code fences if Claude wraps the response
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  // Find first { and last }
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return raw.slice(start, end + 1);
  return raw.trim();
}

async function callClaude(text: string): Promise<ImportStructure> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are a technical documentation specialist. Structure the following Portuguese operations manual text into a JSON object with this exact shape:
{
  "categories": [
    {
      "name": "Category Name",
      "description": "Short description (1-2 sentences)",
      "articles": [
        {
          "title": "Article Title",
          "content": "<p>HTML content...</p>"
        }
      ]
    }
  ]
}

Rules:
- Group related topics into logical categories. Use Portuguese names that match the document structure.
- Each article must have a clear title and content as valid HTML using only: <p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>, <br>. Never use <html>, <head>, <body>, <style>, or <script>.
- Preserve all procedures, numbered steps, rules, and important details from the original text. Do not summarize or omit content.
- If the document has numbered sections or clear headings, use them as article boundaries.
- Return ONLY the JSON object. No markdown, no explanation, no code blocks.

MANUAL TEXT:
${text.slice(0, 80000)}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (message.content[0] as { type: string; text: string }).text;
  const cleaned = extractJson(raw);

  const structure = JSON.parse(cleaned) as ImportStructure;
  if (!Array.isArray(structure.categories)) throw new Error("Resposta sem array 'categories'");
  return structure;
}

async function importStructure(session: Session, structure: ImportStructure) {
  const u = session.user as { email?: string };
  const dbUser = await prisma.user.findUnique({ where: { email: u.email ?? "" } });
  if (!dbUser) throw new Error("Utilizador não encontrado");

  let createdCategories = 0;
  let createdArticles = 0;

  for (let catIdx = 0; catIdx < structure.categories.length; catIdx++) {
    const cat = structure.categories[catIdx];
    if (!cat.name?.trim()) continue;

    const catSlug = slugify(cat.name);
    let category = await prisma.manualCategory.findUnique({ where: { slug: catSlug } });

    if (!category) {
      // Find the current max order to append at end
      const maxOrder = await prisma.manualCategory.aggregate({ _max: { order: true } });
      category = await prisma.manualCategory.create({
        data: {
          name: cat.name.trim(),
          slug: catSlug,
          description: cat.description?.trim() || null,
          color: null,
          order: (maxOrder._max.order ?? -1) + 1,
        },
      });
      createdCategories++;
      await logAudit({
        session,
        action: "CREATE",
        entity: "ArticleCategory",
        entityId: category.id,
        meta: { name: cat.name, source: "pdf-import" },
      });
    }

    const maxArtOrder = await prisma.manualArticle.aggregate({
      _max: { order: true },
      where: { categoryId: category.id },
    });

    for (let artIdx = 0; artIdx < cat.articles.length; artIdx++) {
      const art = cat.articles[artIdx];
      if (!art.title?.trim() || !art.content?.trim()) continue;

      const baseSlug = slugify(art.title);
      let artSlug = baseSlug;
      let n = 1;
      while (await prisma.manualArticle.findUnique({ where: { slug: artSlug } })) {
        n++;
        artSlug = `${baseSlug}-${n}`;
      }

      const article = await prisma.manualArticle.create({
        data: {
          slug: artSlug,
          categoryId: category.id,
          order: (maxArtOrder._max.order ?? -1) + 1 + artIdx,
        },
      });

      const version = await prisma.manualArticleVersion.create({
        data: {
          articleId: article.id,
          title: art.title.trim(),
          content: art.content,
          changeNote: "Importado via PDF",
          authorId: dbUser.id,
        },
      });

      await prisma.manualArticle.update({
        where: { id: article.id },
        data: { currentVersionId: version.id },
      });

      createdArticles++;
      await logAudit({
        session,
        action: "CREATE",
        entity: "Article",
        entityId: article.id,
        meta: { title: art.title, source: "pdf-import" },
      });
    }
  }

  return { createdCategories, createdArticles };
}

export async function POST(req: NextRequest) {
  const session = (await auth()) as Session | null;
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const formData = await req.formData();
  const mode = formData.get("mode") as string;

  // ── IMPORT: write confirmed structure to DB ─────────────────────────────
  if (mode === "import") {
    const structureRaw = formData.get("structure");
    if (!structureRaw || typeof structureRaw !== "string") {
      return NextResponse.json({ error: "Estrutura em falta" }, { status: 400 });
    }
    try {
      const structure = JSON.parse(structureRaw) as ImportStructure;
      const result = await importStructure(session!, structure);
      return NextResponse.json({ ok: true, ...result });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Erro ao importar" },
        { status: 500 }
      );
    }
  }

  // ── PREVIEW: parse PDF → Claude → return structured JSON ────────────────
  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Ficheiro PDF em falta" }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "PDF demasiado grande (máximo 20 MB)" }, { status: 413 });
  }

  const arrayBuffer = await file.arrayBuffer();

  let extracted: { text: string; pageCount: number };
  try {
    extracted = await extractPdfText(arrayBuffer);
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao ler o PDF: ${err instanceof Error ? err.message : String(err)}` },
      { status: 422 }
    );
  }

  if (!extracted.text || extracted.text.length < 50) {
    return NextResponse.json(
      { error: "Não foi possível extrair texto do PDF. O ficheiro é uma imagem ou está encriptado." },
      { status: 422 }
    );
  }

  let structure: ImportStructure;
  try {
    structure = await callClaude(extracted.text);
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao processar com Claude: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, structure, pageCount: extracted.pageCount });
}
