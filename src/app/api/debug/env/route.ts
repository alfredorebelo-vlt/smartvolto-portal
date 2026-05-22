import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
  ];

  const status: Record<string, string> = {};
  for (const v of vars) {
    const val = process.env[v];
    if (!val) {
      status[v] = "MISSING";
    } else if (v === "DATABASE_URL") {
      // Mostra user@host/db sem a password
      const match = val.match(/mysql:\/\/([^:]+):[^@]+@([^/]+)(\/\S+)?/);
      if (match) {
        status[v] = `mysql://${match[1]}@${match[2]}${match[3] ?? ""}`;
      } else {
        status[v] = `SET (${val.length} chars)`;
      }
    } else if (v.includes("SECRET") || v.includes("KEY")) {
      status[v] = `SET (${val.length} chars)`;
    } else {
      status[v] = val;
    }
  }

  // Teste de ligação à BD
  let dbTest: string;
  let userCount: number | null = null;
  try {
    userCount = await prisma.user.count();
    dbTest = "OK";
  } catch (e: unknown) {
    dbTest = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    env: status,
    db: { status: dbTest, userCount },
    timestamp: new Date().toISOString(),
  });
}
