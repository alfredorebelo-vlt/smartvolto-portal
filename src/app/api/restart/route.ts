import { NextResponse } from "next/server";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

export async function POST(req: Request) {
  const token = process.env.RESTART_TOKEN;
  const provided = req.headers.get("x-restart-token");

  if (!token || token !== provided) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const tmpDir = join(process.cwd(), "tmp");
    mkdirSync(tmpDir, { recursive: true });
    writeFileSync(join(tmpDir, "restart.txt"), new Date().toISOString());
    return NextResponse.json({ ok: true, restarted_at: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
