import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth({
  ...authConfig,
  // No middleware (Edge runtime) usamos JWT — sem adapter
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret:
        process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
});

export default auth;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand|api/admin).*)",
  ],
};
