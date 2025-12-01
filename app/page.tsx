"use client";

import { CheckNumbersContainer } from "@/components/check-numbers-container";
import { GenerateNumbersContainer } from "@/components/generate-new-numbers";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center gap-y-6 py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-2xl font-bold">Euro Millions Number Generator</h1>
        <CheckNumbersContainer />
        <GenerateNumbersContainer />
      </main>
    </div>
  );
}
