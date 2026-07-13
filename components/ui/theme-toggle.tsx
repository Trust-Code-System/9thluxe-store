"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const currentTheme = mounted && resolvedTheme === "light" ? "Light" : "Dark";
  const nextTheme = currentTheme === "Dark" ? "Light" : "Dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="relative h-11 w-11 rounded-sm text-foreground/80 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      onClick={() => setTheme(nextTheme.toLowerCase())}
      disabled={!mounted}
      aria-label={`Switch to ${nextTheme} theme. Current theme: ${currentTheme}`}
      aria-pressed={currentTheme === "Dark"}
      title={`Current theme: ${currentTheme}. Switch to ${nextTheme} theme`}
      data-theme-control
      data-current-theme={currentTheme.toLowerCase()}
    >
      <Sun
        className={`h-5 w-5 rotate-0 scale-100 transition-[transform,opacity] dark:-rotate-90 dark:scale-0 ${!mounted ? "opacity-0" : ""}`}
        strokeWidth={1.75}
        aria-hidden
      />
      <Moon
        className={`absolute h-5 w-5 rotate-90 scale-0 transition-[transform,opacity] dark:rotate-0 dark:scale-100 ${!mounted ? "opacity-0" : ""}`}
        strokeWidth={1.75}
        aria-hidden
      />
      <span className="sr-only">Current theme: {currentTheme}</span>
    </Button>
  );
}
