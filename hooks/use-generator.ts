"use client";

import type {
  GenerateValidNumberSetOptions,
  GenerateValidNumberSetResult,
  LotteryTuple,
} from "@/lib/generator";
import type { WorkerResponse } from "@/workers/generateNumbers.worker";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export interface UseGenerator {
  isGenerating: boolean;
  results: GenerateValidNumberSetResult | null;
  durationMs: number | null;
  generate: (
    pastNumbers: LotteryTuple[],
    genOptions: GenerateValidNumberSetOptions,
    positionCounters?: Array<Record<string, number>>,
    pairCounts?: Record<string, number>,
    tripletCounts?: Record<string, number>,
  ) => void;
}

export function useGenerator(): UseGenerator {
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerateValidNumberSetResult | null>(
    null,
  );
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("@/workers/generateNumbers.worker.ts", import.meta.url),
      { type: "module" },
    );
    return () => workerRef.current?.terminate();
  }, []);

  const generate: UseGenerator["generate"] = (
    pastNumbers,
    genOptions,
    positionCounters,
    pairCounts,
    tripletCounts,
  ) => {
    if (!workerRef.current) throw new Error("Worker not ready");

    setIsGenerating(true);
    setDurationMs(null);
    startTimeRef.current = performance.now();

    const finishTimer = () => {
      const end = performance.now();
      const start = startTimeRef.current ?? end;
      setDurationMs(end - start);
    };

    workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
      finishTimer();
      const msg = e.data;
      if (msg.ok) {
        setResults(msg.res);
      } else {
        console.error("Generator worker error:", msg.error);
        toast.error("Generation failed", { description: msg.error });
      }
      setIsGenerating(false);
    };

    workerRef.current.onerror = (err) => {
      console.error(err);
      finishTimer();
      setIsGenerating(false);
      toast.error("Generation failed", {
        description: err.message || "Worker crashed",
      });
    };

    workerRef.current.postMessage({
      pastNumbers,
      genOptions,
      positionCounters,
      pairCounts,
      tripletCounts,
    });
  };

  return { isGenerating, results, durationMs, generate };
}
