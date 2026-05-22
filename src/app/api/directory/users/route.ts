import { NextRequest, NextResponse } from "next/server";
import { getDirectoryProvider } from "@/lib/directory";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const provider = getDirectoryProvider();

  const users = await provider.listUsers({
    department: searchParams.get("department") || undefined,
    officeLocation: searchParams.get("office") || undefined,
    status: (searchParams.get("status") as "active" | "suspended") || undefined,
    search: searchParams.get("search") || undefined,
  });

  return NextResponse.json({ users });
}
