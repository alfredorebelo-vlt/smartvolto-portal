import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(session.user as any).isAdmin) return null;
  return session;
}

type AdminSession = NonNullable<Awaited<ReturnType<typeof requireAdmin>>>;

// GET /api/admin/roles — lista todos os roles com contagem de utilizadores
export async function GET() {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const roles = await prisma.role.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } },
  });

  return NextResponse.json({ roles });
}

// POST /api/admin/roles — cria um novo role
export async function POST(req: NextRequest) {
  const session: AdminSession | null = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = (await req.json()) as {
    name: string;
    description?: string;
    sections: string[];
  };

  if (!body.name?.trim())
    return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  const role = await prisma.role.create({
    data: {
      name: body.name.trim(),
      description: body.description?.trim() ?? null,
      sections: body.sections ?? [],
    },
  });

  await logAudit({
    session,
    action: "CREATE",
    entity: "Role",
    entityId: role.id,
    meta: { name: role.name, sections: body.sections ?? [] },
  });

  return NextResponse.json({ role }, { status: 201 });
}

// PATCH /api/admin/roles — actualiza um role existente
export async function PATCH(req: NextRequest) {
  const session: AdminSession | null = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = (await req.json()) as {
    id: string;
    name?: string;
    description?: string;
    sections?: string[];
  };

  if (!body.id)
    return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const existing = await prisma.role.findUnique({ where: { id: body.id } });
  if (!existing)
    return NextResponse.json({ error: "Role não encontrado" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name.trim();
  if (body.description !== undefined) data.description = body.description.trim() || null;
  if (body.sections !== undefined) data.sections = body.sections;

  const role = await prisma.role.update({ where: { id: body.id }, data });

  await logAudit({
    session,
    action: "UPDATE",
    entity: "Role",
    entityId: role.id,
    meta: { name: role.name, changes: Object.keys(data) },
  });

  return NextResponse.json({ role });
}

// DELETE /api/admin/roles — apaga um role (não remove utilizadores, apenas desliga)
export async function DELETE(req: NextRequest) {
  const session: AdminSession | null = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ error: "Role não encontrado" }, { status: 404 });
  if (existing.isSystem)
    return NextResponse.json({ error: "Não é possível apagar roles de sistema" }, { status: 400 });

  // Desliga utilizadores deste role antes de apagar
  await prisma.user.updateMany({ where: { roleId: id }, data: { roleId: null } });
  await prisma.role.delete({ where: { id } });

  await logAudit({
    session,
    action: "DELETE",
    entity: "Role",
    entityId: id,
    meta: { name: existing.name },
  });

  return NextResponse.json({ ok: true });
}
