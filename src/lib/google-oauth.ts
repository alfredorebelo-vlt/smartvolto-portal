import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

type AccountTokens = {
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null;
  scope: string | null;
};

/**
 * Cria um cliente OAuth2 para o utilizador com userId.
 * Ouve o evento "tokens" do SDK e persiste automaticamente os novos tokens
 * na BD sempre que o Google emite um refresh — evita o ciclo de "Renovar sessão".
 */
export async function getGoogleOAuth2(userId: string): Promise<{
  oauth2: InstanceType<typeof google.auth.OAuth2>;
  account: AccountTokens;
} | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: { id: true, access_token: true, refresh_token: true, expires_at: true, scope: true },
  });

  if (!account?.access_token) return null;

  const oauth2 = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
    process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
  );

  oauth2.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  // Persiste novos tokens na BD sempre que o SDK faz refresh automático
  oauth2.on("tokens", async (tokens) => {
    try {
      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: tokens.access_token ?? account.access_token,
          ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
          ...(tokens.expiry_date ? { expires_at: Math.floor(tokens.expiry_date / 1000) } : {}),
        },
      });
    } catch (e) {
      console.error("[google-oauth] falha ao persistir tokens:", e);
    }
  });

  return { oauth2, account };
}

export function isAuthError(err: unknown): boolean {
  // GaxiosError from googleapis: check HTTP status
  const status = (err as { status?: number })?.status
    ?? (err as { response?: { status?: number } })?.response?.status;
  if (status === 401 || status === 403) return true;

  const msg = err instanceof Error ? err.message : String(err);
  return [
    "invalid_grant",
    "insufficientPermissions",
    "insufficient authentication",
    "Request had insufficient",
    "Token has been expired",
    "token expired",
    "invalid_credentials",
    "UNAUTHENTICATED",
    "caller does not have permission",
  ].some((s) => msg.toLowerCase().includes(s.toLowerCase()));
}
