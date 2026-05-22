import { NextResponse } from "next/server";

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
      // Mostra apenas o host/db, não a password
      try {
        const url = new URL(val);
        status[v] = `${url.protocol}//${url.username}@${url.hostname}${url.pathname}`;
      } catch {
        status[v] = "SET (invalid url)";
      }
    } else if (v.includes("SECRET") || v.includes("KEY")) {
      status[v] = `SET (${val.length} chars)`;
    } else {
      status[v] = val;
    }
  }

  return NextResponse.json({ env: status, timestamp: new Date().toISOString() });
}
