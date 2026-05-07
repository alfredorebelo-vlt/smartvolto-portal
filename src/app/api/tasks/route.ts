import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

function makeOAuth2(accessToken: string, refreshToken?: string | null, expiresAt?: number | null) {
  const oauth2 = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
    process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
  );
  oauth2.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken ?? undefined,
    expiry_date: expiresAt ? expiresAt * 1000 : undefined,
  });
  return oauth2;
}

export async function GET(request: NextRequest) {
  const session = (await auth()) as Session | null;
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id as string;
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: { access_token: true, refresh_token: true, expires_at: true, scope: true },
  });

  if (!account?.access_token) return NextResponse.json({ error: "auth_required" });
  if (!(account.scope ?? "").includes("tasks")) return NextResponse.json({ error: "tasks_scope_missing" });

  const showCompleted = request.nextUrl.searchParams.get("showCompleted") === "true";
  const maxTasks = Math.min(parseInt(request.nextUrl.searchParams.get("max") ?? "10"), 50);

  try {
    const oauth2 = makeOAuth2(account.access_token, account.refresh_token, account.expires_at);
    const tasks = google.tasks({ version: "v1", auth: oauth2 });

    const listsRes = await tasks.tasklists.list({ maxResults: 20 });
    const lists = listsRes.data.items ?? [];

    const allTasks: {
      id: string; title: string; due: string | null; notes: string | null;
      status: string; listTitle: string; listId: string;
    }[] = [];

    await Promise.all(
      lists.map(async (list) => {
        if (!list.id) return;
        const res = await tasks.tasks.list({
          tasklist: list.id,
          showCompleted,
          showHidden: false,
          maxResults: maxTasks,
        });
        for (const t of res.data.items ?? []) {
          if (!showCompleted && t.status === "completed") continue;
          allTasks.push({
            id: t.id ?? "",
            title: t.title ?? "(Sem título)",
            due: t.due ?? null,
            notes: t.notes ?? null,
            status: t.status ?? "needsAction",
            listTitle: list.title ?? "",
            listId: list.id,
          });
        }
      })
    );

    // Sort: overdue first, then by due date, then no due date
    const now = new Date();
    allTasks.sort((a, b) => {
      const da = a.due ? new Date(a.due) : null;
      const db = b.due ? new Date(b.due) : null;
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da.getTime() - db.getTime();
    });

    return NextResponse.json({ tasks: allTasks.slice(0, maxTasks) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
