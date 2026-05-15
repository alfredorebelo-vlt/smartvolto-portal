import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { google } from "googleapis";
import { getGoogleOAuth2 } from "@/lib/google-oauth";

export async function GET(request: NextRequest) {
  const session = (await auth()) as Session | null;
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id as string;

  const result = await getGoogleOAuth2(userId);
  if (!result) return NextResponse.json({ error: "auth_required" });
  const { oauth2, account } = result;

  if (!(account.scope ?? "").includes("tasks")) return NextResponse.json({ error: "tasks_scope_missing" });

  const showCompleted = request.nextUrl.searchParams.get("showCompleted") === "true";
  const maxTasks = Math.min(parseInt(request.nextUrl.searchParams.get("max") ?? "10"), 50);

  try {
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
