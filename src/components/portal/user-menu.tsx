"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { LogOut, User, ChevronUp } from "lucide-react";
import { getInitials, getAvatarColor } from "@/lib/avatar";
import { cn } from "@/lib/utils";

export function UserMenu({ onNav, compact = false }: { onNav?: (id: string) => void; compact?: boolean }) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (status === "loading") {
    return compact
      ? <div className="size-9 animate-pulse rounded-full bg-[var(--muted)]" />
      : (
        <div className="flex items-center gap-2.5 rounded-xl bg-[var(--muted)] p-2.5">
          <div className="size-8 animate-pulse rounded-full bg-[var(--border)]" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-20 animate-pulse rounded bg-[var(--border)]" />
            <div className="h-2.5 w-28 animate-pulse rounded bg-[var(--border)]" />
          </div>
        </div>
      );
  }

  if (!session?.user) return null;

  const user = session.user;
  const givenName = user.givenName ?? user.name?.split(" ")[0] ?? "Utilizador";
  const familyName =
    user.familyName ??
    user.name?.split(" ").slice(-1).join("") ??
    "";
  const initials = getInitials(givenName, familyName);
  const avatarBg = getAvatarColor(user.email ?? "u");

  const avatar = user.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.image} alt="" className="size-8 shrink-0 rounded-full object-cover" />
  ) : (
    <div
      className="grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
      style={{ background: avatarBg, fontFamily: "var(--font-display)" }}
    >
      {initials}
    </div>
  );

  const dropdown = open ? (
    <div className={cn(
      "absolute z-50 w-52 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg",
      compact ? "right-0 top-full mt-2" : "bottom-full left-0 right-0 mb-2",
    )}>
      <div className="border-b border-[var(--border)] px-3 py-2.5">
        <div className="truncate text-[13px] font-semibold text-[var(--foreground)]">{givenName} {familyName}</div>
        <div className="truncate text-[11px] text-[var(--muted-foreground)]">{user.email}</div>
      </div>
      <button
        type="button"
        onClick={() => { onNav?.("profile"); setOpen(false); }}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
      >
        <User className="size-4 text-[var(--muted-foreground)]" />
        O meu perfil
      </button>
      <div className="border-t border-[var(--border)]" />
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-[var(--destructive)] transition-colors hover:bg-[var(--destructive)]/10"
      >
        <LogOut className="size-4" />
        Terminar sessão
      </button>
    </div>
  ) : null;

  if (compact) {
    return (
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "rounded-full transition-opacity hover:opacity-80",
            open && "opacity-80",
          )}
        >
          {avatar}
        </button>
        {dropdown}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-xl bg-[var(--muted)] p-2.5 text-left transition-colors hover:bg-[var(--accent)]",
          open && "bg-[var(--accent)]",
        )}
      >
        {avatar}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-[var(--sidebar-foreground)]">
            {givenName} {familyName}
          </div>
          <div className="truncate text-[11px] text-[var(--muted-foreground)]">
            {user.email}
          </div>
        </div>
        <ChevronUp
          className={cn(
            "size-3.5 shrink-0 text-[var(--muted-foreground)] transition-transform",
            open ? "rotate-0" : "rotate-180",
          )}
        />
      </button>
      {dropdown}
    </div>
  );
}
