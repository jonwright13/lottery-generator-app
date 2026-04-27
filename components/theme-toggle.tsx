"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Server and the first client render must match. next-themes resolves the
  // theme synchronously on the client (via an inlined script), so we can't
  // rely on `resolvedTheme` being undefined during the first paint — it's
  // already populated. Gate on a post-mount state to keep both renders the
  // same and only swap to the real icon afterwards.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
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
