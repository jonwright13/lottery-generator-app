"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { DataProvider } from "@/context/useDataProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <DataProvider>{children}</DataProvider>
      <Toaster position="top-center" />
    </ThemeProvider>
  );
}
