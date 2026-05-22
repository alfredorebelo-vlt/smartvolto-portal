import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDirectoryProvider } from "@/lib/directory";

export async function POST() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const provider = getDirectoryProvider();

  if (!process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL) {
    return NextResponse.json(
      { error: "Google Workspace não configurado" },
      { status: 400 }
    );
  }

  try {
    const count = await provider.syncUsers();
    return NextResponse.json({ synced: count });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
