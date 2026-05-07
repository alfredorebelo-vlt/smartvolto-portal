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

// GET /api/admin/users — lista todos os utilizadores com role
export async function GET() {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const users = await prisma.user.findMany({
    orderBy: [{ givenName: "asc" }, { familyName: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      givenName: true,
      familyName: true,
      image: true,
      jobTitle: true,
      department: true,
      isAdmin: true,
      status: true,
      lastSyncedAt: true,
      roleId: true,
      role: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ users });
}

// PATCH /api/admin/users — actualiza roleId e/ou isAdmin de um utilizador
export async function PATCH(req: NextRequest) {
  const session: AdminSession | null = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = (await req.json()) as {
    id: string;
    roleId?: string | null;
    isAdmin?: boolean;
    status?: string;
  };

  if (!body.id)
    return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if ("roleId" in body) data.roleId = body.roleId ?? null;
  if ("isAdmin" in body) data.isAdmin = body.isAdmin;
  if ("status" in body) data.status = body.status;

  const user = await prisma.user.update({
    where: { id: body.id },
    data,
    include: { role: { select: { id: true, name: true } } },
  });

  await logAudit({
    session,
    action: "UPDATE",
    entity: "User",
    entityId: body.id,
    meta: { changes: data, targetEmail: user.email },
  });

  return NextResponse.json({ user });
}
