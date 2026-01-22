"use client";

import { CopyToClipboardButton } from "@/components/copy-to-clipboard-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { generateValidNumberSet } from "@/lib/generator/generate-numbers";
import { GenerateValidNumberSetResult } from "@/lib/generator/types";
import { useEffect, useRef, useState } from "react";
import { GeneratorProps } from "../types";
import { LotteryTuple } from "@/lib/generator/types";

interface Props extends GeneratorProps {
  pastNumbers: LotteryTuple[] | null;
}

export const GeneratorContainer = ({ pastNumbers, genOptions }: Props) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerateValidNumberSetResult | null>(
    null,
  );
  const startTimeRef = useRef<number | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("@/workers/generateNumbers.worker.ts", import.meta.url),
      { type: "module" },
    );

    return () => workerRef.current?.terminate();
  }, []);

  const handleGenerate = async () => {
    if (!genOptions || !pastNumbers?.length)
      throw new Error("Error fetching data");
    if (!workerRef.current) throw new Error("Worker not ready");

    setIsGenerating(true);
    setDurationMs(null);

    startTimeRef.current = performance.now();

    workerRef.current.onmessage = (e) => {
      const msg = e.data as { ok: true; res: unknown };

      const end = performance.now();
      const start = startTimeRef.current ?? end;
      setDurationMs(end - start);

      setResults(msg.res as ReturnType<typeof generateValidNumberSet>);
      setIsGenerating(false);
    };

    workerRef.current.onerror = (err) => {
      console.error(err);

      const end = performance.now();
      const start = startTimeRef.current ?? end;
      setDurationMs(end - start);

      setIsGenerating(false);
      alert("Generation failed");
    };

    workerRef.current.postMessage({ pastNumbers, genOptions });
  };

  return (
    <Card className="flex flex-col gap-y-4 border rounded-md p-4 w-full">
      <div className="flex justify-between items-center px-2">
        <h3 className="text-lg font-semibold">Generate</h3>
        {isGenerating && <Spinner className="size-6" />}
      </div>
      <Button
        onClick={handleGenerate}
        className="px-2 py-1 border rounded-md cursor-pointer"
      >
        Generate
      </Button>
      {results && (
        <>
          <div className="grid grid-cols-[auto_3rem] lg:grid-cols-2 gap-2 items-center">
            <Label className="text-xs md:text-sm">Completed in:</Label>
            <Label className="text-xs md:text-sm">
              {durationMs ? (durationMs / 1000).toFixed(2) : 0}s
            </Label>
            <Label className="text-xs md:text-sm">Iterations:</Label>
            <Label className="text-xs md:text-sm">{results?.iterations}</Label>
            <Label className="text-xs md:text-sm">
              Positional Frequency Score:
            </Label>
            <Label className="text-xs md:text-sm">
              {results?.bestScore.toFixed(2)}%
            </Label>
          </div>
          <div className="flex flex-col md:flex-row gap-y-2 gap-x-1 md:gap-x-2 lg:gap-x-4 items-end md:items-center justify-between w-full">
            <Card className="p-2 py-2 lg:p-4 w-full">
              <ul className="flex gap-x-2 items-center w-fit mx-auto">
                {results?.bestCombination?.map((n, index) => (
                  <li
                    key={index}
                    title={`Pattern Probability Score: ${results.bestPatternProb ? results.bestPatternProb[index].toFixed(2) : 0}%`}
                    className="text-sm md:text-base"
                  >
                    {n}
                  </li>
                ))}
              </ul>
            </Card>
            <CopyToClipboardButton
              txtToCopy={
                results?.bestCombination
                  ? results.bestCombination.join(", ")
                  : undefined
              }
            />
          </div>
          <Label className="text-sm font-extralight">
            Hover over numbers to check individual positional frequency scores
          </Label>
        </>
      )}
    </Card>
  );
};
