import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const key = new URL(req.url).searchParams.get("key");
  if (!key) return NextResponse.json({ error: "key obrigatório" }, { status: 400 });

  const setting = await prisma.siteSetting.findUnique({ where: { key } });
  return NextResponse.json({ value: setting?.value ?? null });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(session?.user as any)?.isAdmin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { key, value } = await req.json() as { key: string; value: unknown };
  if (!key) return NextResponse.json({ error: "key obrigatório" }, { status: 400 });

  const setting = await prisma.siteSetting.upsert({
    where: { key },
    update: { value: value as never },
    create: { key, value: value as never },
  });
  return NextResponse.json({ value: setting.value });
}
