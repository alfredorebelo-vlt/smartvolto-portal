import type { NextAuthConfig } from "next-auth";

const ALLOWED_DOMAIN = "voltodrive.com";

/**
 * Edge-safe config: usado pelo middleware (que corre em Edge runtime
 * e não suporta o adapter Prisma). O ficheiro `auth.ts` estende este
 * com o adapter para Node runtime.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, profile }) {
      const email = user?.email ?? profile?.email;
      if (!email) return false;
      const domain = email.split("@")[1]?.toLowerCase();
      if (domain !== ALLOWED_DOMAIN) {
        return `/login?error=AccessDenied`;
      }
      return true;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const isPublic =
        pathname.startsWith("/login") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/restart") ||
        pathname.startsWith("/api/debug/") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/brand") ||
        pathname === "/favicon.ico";
      if (isPublic) return true;
      return isLoggedIn;
    },
  },
  providers: [], // injetados em auth.ts (Node runtime) e middleware (Edge)
} satisfies NextAuthConfig;
