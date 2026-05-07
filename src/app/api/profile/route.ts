import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/profile — perfil completo do utilizador autenticado
export async function GET() {
  const session = (await auth()) as Session | null;
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const email = (session.user as any).email ?? session.user.email;
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: { select: { id: true, name: true, description: true } } },
  });

  if (!user) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });

  return NextResponse.json({ user });
}

// PATCH /api/profile — atualiza campos editáveis (bio, linkedinUrl, workLocation)
export async function PATCH(req: NextRequest) {
  const session = (await auth()) as Session | null;
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const email = (session.user as any).email ?? session.user.email;

  const body = (await req.json()) as {
    bio?: string;
    linkedinUrl?: string;
    workLocation?: string;
  };

  const data: Record<string, unknown> = {};

  if (body.bio !== undefined) {
    const bio = body.bio.trim().slice(0, 300);
    data.bio = bio || null;
  }
  if (body.linkedinUrl !== undefined) {
    const url = body.linkedinUrl.trim();
    if (url && !url.startsWith("https://linkedin.com") && !url.startsWith("https://www.linkedin.com")) {
      return NextResponse.json({ error: "URL do LinkedIn inválido" }, { status: 400 });
    }
    data.linkedinUrl = url || null;
  }
  if (body.workLocation !== undefined) {
    data.workLocation = body.workLocation.trim().slice(0, 100) || null;
  }

  const user = await prisma.user.update({
    where: { email },
    data,
    include: { role: { select: { id: true, name: true, description: true } } },
  });

  return NextResponse.json({ user });
}
