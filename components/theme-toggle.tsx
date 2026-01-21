"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react"; // optional icons
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid rendering until mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render nothing or a placeholder during hydration
    return null;
  }

  // Use resolvedTheme which represents the actual applied theme (light or dark)
  const currentTheme = resolvedTheme;

  return (
    <Button
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
      title={currentTheme === "dark" ? "Toggle Light" : "Toggle Dark"}
      size="icon"
      variant="outline"
    >
      {currentTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </Button>
  );
};
