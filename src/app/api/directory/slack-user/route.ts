import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSlackUserByEmail } from "@/lib/slack";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const email = new URL(req.url).searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });

  const slackUser = await getSlackUserByEmail(email);
  if (!slackUser) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ id: slackUser.id, name: slackUser.real_name || slackUser.name, teamId: slackUser.teamId ?? null });
}
