"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative grid size-9 place-items-center rounded-[10px] border border-[var(--border)] bg-[var(--card)] transition-colors hover:bg-[var(--muted)]"
    >
      <Sun
        className={`size-4 text-[var(--muted-foreground)] transition-all ${
          isDark ? "scale-0 rotate-90" : "scale-100 rotate-0"
        }`}
      />
      <Moon
        className={`absolute size-4 text-[var(--muted-foreground)] transition-all ${
          isDark ? "scale-100 rotate-0" : "scale-0 -rotate-90"
        }`}
      />
    </button>
  );
}
