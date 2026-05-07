"use client";

import { useSession } from "next-auth/react";
import { hasPermission, type AnyPermissionKey } from "@/lib/sections";

export function usePermissions() {
  const { data: session } = useSession();
  const user = session?.user;
  const isAdmin: boolean = (user as any)?.isAdmin ?? false;
  const sections: string[] = (user as any)?.sections ?? [];

  return {
    isAdmin,
    can: (key: AnyPermissionKey) => hasPermission(sections, key, isAdmin),
    sections,
  };
}
