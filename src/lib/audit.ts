import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "RESTORE";
export type AuditEntity =
  | "Article"
  | "ArticleVersion"
  | "ArticleCategory"
  | "Announcement"
  | "User"
  | "Role";

export async function logAudit(params: {
  session: Session | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  meta?: Record<string, unknown>;
}) {
  const { session, action, entity, entityId, meta } = params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = (session?.user as any) ?? null;

  try {
    await prisma.auditLog.create({
      data: {
        userId: u?.id ?? null,
        userEmail: u?.email ?? null,
        userName:
          (u?.givenName && u?.familyName ? `${u.givenName} ${u.familyName}` : u?.name) ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        meta: meta ? (meta as object) : undefined,
      },
    });
  } catch (err) {
    // Audit não deve quebrar a operação principal
    console.error("[audit] Failed to write log:", err);
  }
}
