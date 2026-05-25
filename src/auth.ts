import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret:
        process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/tasks.readonly",
        },
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn(params) {
      const baseResult = await authConfig.callbacks!.signIn!(params);
      if (baseResult !== true) return baseResult;

      const { account, profile, user } = params;
      const email = user?.email ?? profile?.email;
      if (account?.provider === "google" && profile && email) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const p = profile as any;

          // Upsert: cria se não existe, atualiza se existe (utilizadores pré-criados pelo sync)
          const dbUser = await prisma.user.upsert({
            where: { email },
            create: {
              email,
              name: [p.given_name, p.family_name].filter(Boolean).join(" ") || email,
              googleUserId: p.sub ?? undefined,
              givenName: p.given_name ?? undefined,
              familyName: p.family_name ?? undefined,
              image: p.picture ?? undefined,
            },
            update: {
              googleUserId: p.sub ?? undefined,
              givenName: p.given_name ?? undefined,
              familyName: p.family_name ?? undefined,
              image: p.picture ?? undefined,
            },
          });

          // Liga a conta Google se ainda não existir (resolve OAuthAccountNotLinked)
          if (account.access_token && dbUser) {
            const existing = await prisma.account.findFirst({
              where: { userId: dbUser.id, provider: "google" },
            });
            if (existing) {
              // Atualiza tokens (re-consent ou refresh)
              await prisma.account.update({
                where: { id: existing.id },
                data: {
                  access_token: account.access_token,
                  refresh_token: account.refresh_token ?? existing.refresh_token,
                  expires_at: account.expires_at ?? undefined,
                  scope: account.scope ?? undefined,
                  providerAccountId: account.providerAccountId,
                },
              });
            } else {
              // Cria a ligação Account → User (primeiro login deste utilizador)
              await prisma.account.create({
                data: {
                  userId: dbUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  refresh_token: account.refresh_token ?? undefined,
                  expires_at: account.expires_at ?? undefined,
                  token_type: account.token_type ?? undefined,
                  scope: account.scope ?? undefined,
                  id_token: account.id_token ?? undefined,
                },
              });
            }
          }
        } catch (e) {
          console.error("[signIn callback]", e);
        }
      }
      return true;
    },
    async jwt({ token }) {
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = session.user as any;
        const email = (token.email as string | null) ?? u.email;
        if (email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email },
              select: {
                id: true, isAdmin: true, roleId: true,
                givenName: true, familyName: true, jobTitle: true, department: true,
                role: { select: { name: true, sections: true } },
              },
            });
            if (dbUser) {
              u.id         = dbUser.id;
              u.isAdmin    = dbUser.role?.name === "Admin" || dbUser.isAdmin;
              u.roleId     = dbUser.roleId ?? null;
              u.givenName  = dbUser.givenName;
              u.familyName = dbUser.familyName;
              u.jobTitle   = dbUser.jobTitle;
              u.department = dbUser.department;
              u.sections   = dbUser.isAdmin
                ? ["*"]
                : (dbUser.role?.sections as string[] | null) ?? [];
              return session;
            }
          } catch (e) {
            console.error("[session callback] DB error:", e);
          }
        }
        // fallback se DB falhar
        u.id         = (token.id as string) ?? (token.sub as string);
        u.isAdmin    = (token.isAdmin as boolean) ?? false;
        u.roleId     = (token.roleId as string | null) ?? null;
        u.givenName  = (token.givenName as string | null) ?? null;
        u.familyName = (token.familyName as string | null) ?? null;
        u.jobTitle   = (token.jobTitle as string | null) ?? null;
        u.department = (token.department as string | null) ?? null;
        u.sections   = (token.sections as string[]) ?? [];
      }
      return session;
    },
  },
});
