import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import mysql2 from "mysql2/promise";

// Endpoint temporário de diagnóstico — remover após resolver o problema de deploy
export async function GET() {
  const vars = [
    "AUTH_SECRET",
    "AUTH_TRUST_HOST",
    "AUTH_GOOGLE_ID",
    "AUTH_GOOGLE_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "DATABASE_URL",
    "NEXTAUTH_URL",
    "NODE_ENV",
    "MARIADB_SOCKET_PATH",
  ];

  const status: Record<string, string> = {};
  for (const v of vars) {
    const val = process.env[v];
    if (!val) {
      status[v] = "MISSING";
    } else if (v === "DATABASE_URL") {
      const match = val.match(/mysql:\/\/([^:]+):[^@]+@([^/]+)(\/\S+)?/);
      if (match) {
        status[v] = `mysql://${match[1]}@${match[2]}${match[3] ?? ""}`;
      } else {
        // Mostra primeiros 12 chars reais para diagnóstico de formato
        const preview = JSON.stringify(val.slice(0, 15));
        status[v] = `NO-MATCH (${val.length} chars) prefix=${preview}`;
      }
    } else if (v.includes("SECRET") || v.includes("KEY")) {
      status[v] = `SET (${val.length} chars)`;
    } else {
      status[v] = val;
    }
  }

  // Teste Prisma
  let dbTest: string;
  let userCount: number | null = null;
  try {
    userCount = await prisma.user.count();
    dbTest = "OK";
  } catch (e: unknown) {
    // Captura a cadeia completa de erros para diagnóstico
    const msgs: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cur: any = e;
    while (cur && msgs.length < 4) {
      msgs.push(cur instanceof Error ? cur.message : String(cur));
      cur = cur?.cause;
    }
    dbTest = msgs.join(" → ");
  }

  // Teste direto mysql2 — bypass do Prisma para isolar o problema
  let mysql2Test: string;
  try {
    const rawUrl = process.env.DATABASE_URL ?? "";
    const m = rawUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:/]+)(?::(\d+))?\/([^?]+)/);
    if (!m) throw new Error("DATABASE_URL inválido");
    const [, user, password, host, port, database] = m;
    const socketPath = process.env.MARIADB_SOCKET_PATH;
    const conn = await mysql2.createConnection({
      ...(socketPath ? { socketPath } : { host, port: Number(port ?? 3306) }),
      user,
      password,
      database,
      connectTimeout: 8000,
    });
    const [rows] = await conn.query("SELECT 1 AS ok");
    mysql2Test = `OK → ${JSON.stringify(rows)}`;
    await conn.end();
  } catch (e: unknown) {
    mysql2Test = e instanceof Error ? `${e.message} (code: ${(e as NodeJS.ErrnoException).code})` : String(e);
  }

  return NextResponse.json({
    env: status,
    db: { status: dbTest, userCount },
    mysql2: mysql2Test,
    timestamp: new Date().toISOString(),
    codeVersion: "format-check-1",
  });
}
