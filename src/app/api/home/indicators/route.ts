import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { google } from "googleapis";
import { getGoogleOAuth2 } from "@/lib/google-oauth";

export async function GET() {
  const session = (await auth()) as Session | null;
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id as string;

  const googleResult = await getGoogleOAuth2(userId);
  if (!googleResult) return NextResponse.json({ needsReauth: true });
  const { oauth2, account } = googleResult;

  const scope = account.scope ?? "";
  const hasCalendar = scope.includes("calendar");
  const hasDrive = scope.includes("drive");
  const hasGmail = scope.includes("gmail");
  const hasTasks = scope.includes("tasks");
  const results: Record<string, unknown> = {};

  // Drive — quota de armazenamento
  if (hasDrive) {
    try {
      const drive = google.drive({ version: "v3", auth: oauth2 });
      const about = await drive.about.get({ fields: "storageQuota" });
      const q = about.data.storageQuota;
      if (q) {
        const used = Number(q.usage ?? 0);
        const total = Number(q.limit ?? 0);
        results.drive = {
          usedBytes: used,
          totalBytes: total,
          usedGb: +(used / 1e9).toFixed(2),
          totalGb: total > 0 ? +(total / 1e9).toFixed(2) : null,
          percent: total > 0 ? Math.round((used / total) * 100) : null,
        };
      }
    } catch {
      results.drive = null;
    }
  }

  // Calendar — próximo evento de hoje
  if (hasCalendar) {
    try {
      const calendar = google.calendar({ version: "v3", auth: oauth2 });
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const res = await calendar.events.list({
        calendarId: "primary",
        timeMin: now.toISOString(),
        timeMax: endOfDay.toISOString(),
        maxResults: 5,
        singleEvents: true,
        orderBy: "startTime",
      });

      const events = (res.data.items ?? [])
        .filter((e) => e.status !== "cancelled")
        .map((e) => ({
          id: e.id,
          summary: e.summary,
          start: e.start?.dateTime ?? e.start?.date,
          end: e.end?.dateTime ?? e.end?.date,
          htmlLink: e.htmlLink,
          isAllDay: !e.start?.dateTime,
        }));

      results.calendar = { events, count: events.length };
    } catch {
      results.calendar = null;
    }
  }

  // Gmail — emails não lidos na caixa de entrada
  if (hasGmail) {
    try {
      const gmail = google.gmail({ version: "v1", auth: oauth2 });
      const res = await gmail.users.messages.list({
        userId: "me",
        labelIds: ["INBOX", "UNREAD"],
        maxResults: 1,
      });
      results.gmail = { unread: res.data.resultSizeEstimate ?? 0 };
    } catch {
      results.gmail = null;
    }
  }

  // Tasks — tarefas em atraso
  if (hasTasks) {
    try {
      const tasks = google.tasks({ version: "v1", auth: oauth2 });
      const listsRes = await tasks.tasklists.list({ maxResults: 10 });
      const lists = listsRes.data.items ?? [];
      const now = new Date().toISOString();
      let overdue = 0;
      await Promise.all(
        lists.map(async (list) => {
          if (!list.id) return;
          const res = await tasks.tasks.list({
            tasklist: list.id,
            showCompleted: false,
            showHidden: false,
            dueMax: now,
            maxResults: 100,
          });
          const overdueTasks = (res.data.items ?? []).filter(
            (t) => t.due && t.status !== "completed"
          );
          overdue += overdueTasks.length;
        })
      );
      results.tasks = { overdue };
    } catch {
      results.tasks = null;
    }
  }

  return NextResponse.json({ ...results, needsReauth: false });
}
