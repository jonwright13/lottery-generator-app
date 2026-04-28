"use client";

import { Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { DataProvider } from "@/context/useDataProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {/* Suspense is required by useSearchParams() inside DataProvider. The
          fallback is null because the provider's children render their own
          loading affordances. */}
      <Suspense fallback={null}>
        <DataProvider>{children}</DataProvider>
      </Suspense>
      <Toaster position="top-center" />
    </ThemeProvider>
  );
}
