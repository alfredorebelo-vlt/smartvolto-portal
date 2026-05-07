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

function isAuthError(msg: string) {
  return ["invalid_grant", "insufficientPermissions", "insufficient authentication", "Request had insufficient"]
    .some((s) => msg.includes(s));
}

function mapEvent(
  e: {
    id?: string | null;
    summary?: string | null;
    description?: string | null;
    location?: string | null;
    start?: { dateTime?: string | null; date?: string | null } | null;
    end?: { dateTime?: string | null; date?: string | null } | null;
    htmlLink?: string | null;
    status?: string | null;
    organizer?: { email?: string | null; displayName?: string | null } | null;
    attendees?: { email?: string | null; responseStatus?: string | null }[] | null;
    conferenceData?: { entryPoints?: { uri?: string | null; entryPointType?: string | null }[] | null } | null;
  },
  calendarName?: string | null,
  calendarColor?: string | null,
) {
  const startDt = e.start?.dateTime ?? e.start?.date ?? null;
  const endDt = e.end?.dateTime ?? e.end?.date ?? null;
  const isAllDay = !e.start?.dateTime;
  const meetLink = e.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === "video")?.uri ?? null;

  return {
    id: e.id,
    summary: e.summary ?? "(Sem título)",
    description: e.description ?? null,
    location: e.location ?? null,
    start: startDt,
    end: endDt,
    isAllDay,
    htmlLink: e.htmlLink ?? null,
    organizer: e.organizer?.displayName ?? e.organizer?.email ?? null,
    attendeesCount: e.attendees?.length ?? 0,
    meetLink,
    calendarName: calendarName ?? null,
    calendarColor: calendarColor ?? null,
  };
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

  if (!account?.access_token) return NextResponse.json({ error: "drive_auth_required" });

  const hasCalendar = (account.scope ?? "").includes("calendar");
  if (!hasCalendar) return NextResponse.json({ error: "calendar_scope_missing" });

  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("mode") ?? "personal"; // personal | shared
  const daysAhead = Math.min(parseInt(searchParams.get("days") ?? "14"), 60);

  const now = new Date();
  const future = new Date(now);
  future.setDate(future.getDate() + daysAhead);

  try {
    const oauth2 = makeOAuth2(account.access_token, account.refresh_token, account.expires_at);
    const calendar = google.calendar({ version: "v3", auth: oauth2 });

    if (mode === "personal") {
      // Obter todos os calendários subscritos do utilizador
      const calListRes = await calendar.calendarList.list({ minAccessRole: "reader" });
      const calItems = calListRes.data.items ?? [];

      // Buscar eventos de cada calendário em paralelo
      const calResults = await Promise.allSettled(
        calItems.map(async (cal) => {
          const id = cal.id!;
          const name = cal.summaryOverride ?? cal.summary ?? id;
          const color = cal.backgroundColor ?? null;
          const res = await calendar.events.list({
            calendarId: id,
            timeMin: now.toISOString(),
            timeMax: future.toISOString(),
            maxResults: 50,
            singleEvents: true,
            orderBy: "startTime",
          });
          return { name, color, items: res.data.items ?? [] };
        })
      );

      // Juntar todos os eventos, ordenar por data de início
      const allEvents = calResults
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => {
          const { name, color, items } = (r as PromiseFulfilledResult<{ name: string; color: string | null; items: typeof calItems }>).value as { name: string; color: string | null; items: Parameters<typeof mapEvent>[0][] };
          return items
            .filter((e) => e.status !== "cancelled")
            .map((e) => mapEvent(e, name, color));
        })
        .sort((a, b) => {
          const ta = a.start ? new Date(a.start).getTime() : 0;
          const tb = b.start ? new Date(b.start).getTime() : 0;
          return ta - tb;
        });

      // Remover duplicados (mesmo evento pode aparecer em múltiplos calendários)
      const seen = new Set<string>();
      const events = allEvents.filter((e) => {
        if (!e.id || seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });

      return NextResponse.json({ events, calendarName: "A minha agenda" });
    }

    if (mode === "shared") {
      const dbCalendars = await prisma.sharedCalendar.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
      });

      // fallback para env var se não houver registos na DB
      let sharedCalendars: { id: string; name: string }[] = dbCalendars.map((c) => ({ id: c.calendarId, name: c.name }));
      if (sharedCalendars.length === 0) {
        const raw = process.env.GOOGLE_SHARED_CALENDAR_IDS ?? "";
        sharedCalendars = raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((entry) => {
            const [id, ...nameParts] = entry.split("::");
            return { id: id.trim(), name: nameParts.join("::").trim() || id.trim() };
          });
      }

      if (sharedCalendars.length === 0) {
        return NextResponse.json({ calendars: [], message: "Nenhum calendário partilhado configurado." });
      }

      const results = await Promise.allSettled(
        sharedCalendars.map(async ({ id, name }) => {
          const res = await calendar.events.list({
            calendarId: id,
            timeMin: now.toISOString(),
            timeMax: future.toISOString(),
            maxResults: 30,
            singleEvents: true,
            orderBy: "startTime",
          });
          const events = (res.data.items ?? [])
            .filter((e) => e.status !== "cancelled")
            .map((e) => mapEvent(e, name, null));
          return { id, name, events };
        })
      );

      const calendars = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => (r as PromiseFulfilledResult<{ id: string; name: string; events: ReturnType<typeof mapEvent>[] }>).value);

      return NextResponse.json({ calendars });
    }

    return NextResponse.json({ error: "Modo inválido" }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (isAuthError(msg)) return NextResponse.json({ error: "drive_auth_required" });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
