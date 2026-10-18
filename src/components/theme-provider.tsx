"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as "light" | "dark") || "dark";
    setTheme(stored);
    document.documentElement.classList.toggle("dark", stored === "dark");
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
  };

  if (!mounted) {
    return <div className="min-h-screen bg-[#0b0f19]" />;
  }

  return (
    <>
      <button
        onClick={toggle}
        className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-lg transition-colors hover:bg-accent/10"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun className="h-4 w-4 text-accent" /> : <Moon className="h-4 w-4 text-accent" />}
      </button>
      {children}
    </>
  );
}
