"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  return (
    <button
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="lp-iconbtn"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      type="button"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
