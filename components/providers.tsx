"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

import { useEffect, useState } from "react";
import { DataProvider } from "@/context/useDataProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <DataProvider>{children}</DataProvider>
      <Toaster position="top-center" />
    </ThemeProvider>
  );
}
