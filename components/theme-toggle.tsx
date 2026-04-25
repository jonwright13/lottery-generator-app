"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();

  // resolvedTheme is undefined until next-themes runs on the client.
  // Render a placeholder to avoid an SSR/CSR mismatch on the icon.
  if (!resolvedTheme) {
    return (
      <Button size="icon" variant="outline" disabled aria-hidden>
        <Sun size={16} className="opacity-0" />
      </Button>
    );
  }

  return (
    <Button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      title={resolvedTheme === "dark" ? "Toggle Light" : "Toggle Dark"}
      size="icon"
      variant="outline"
    >
      {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </Button>
  );
};
