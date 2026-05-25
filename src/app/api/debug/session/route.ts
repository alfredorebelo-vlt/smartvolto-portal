import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  let dbUser = null;
  if (session?.user) {
    const email = (session.user as any).email;
    if (email) {
      try {
        dbUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, isAdmin: true, roleId: true },
        });
      } catch (e) {
        dbUser = { error: String(e) };
      }
    }
  }

  return NextResponse.json({
    session: session
      ? {
          user: session.user,
          expires: session.expires,
        }
      : null,
    dbUser,
  });
}
