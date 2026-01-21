"use client";

import { CopyToClipboardButton } from "@/components/copy-to-clipboard-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useData } from "@/context/useDataProvider";
import {
  generateValidNumberSet,
  GenerateValidNumberSetResult,
} from "@/lib/generate-number-set";
import { DistributionAnalysis } from "@/lib/threshold-criteria";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const { pastNumbers, analysis, genOptions, updateOptions } = useData();

  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerateValidNumberSetResult | null>(
    null,
  );

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

    workerRef.current.onmessage = (e) => {
      const msg = e.data as { ok: true; res: unknown };
      setResults(msg.res as ReturnType<typeof generateValidNumberSet>);
      setIsGenerating(false);
    };

    workerRef.current.onerror = (err) => {
      console.error(err);
      setIsGenerating(false);
      alert("Generation failed");
    };

    workerRef.current.postMessage({ pastNumbers, genOptions });
  };

  const handleOddRangeChange = (r: DistributionAnalysis) => {
    if (!analysis) return;
    if (
      r.oddCount === genOptions.oddRange[0] ||
      r.oddCount === genOptions.oddRange[1]
    )
      return;

    const index = analysis.distribution.findIndex(
      (row) => row.label === r.label,
    );
    const middleIndex = analysis.distribution.length / 2;

    let prevRange = genOptions.oddRange;
    if (index < middleIndex) {
      prevRange[0] = r.oddCount;
    } else {
      prevRange[1] = r.oddCount;
    }

    updateOptions("oddRange", prevRange);
  };

  const handleGapChange = (
    key: "maxMainGapThreshold" | "maxLuckyGapThreshold",
    gap: number,
  ) => {
    if (!analysis) return;
    if (gap === genOptions.maxMainGapThreshold) return;
    updateOptions(key, gap);
  };

  const counters = analysis?.gapDistributionData.main.gapCounters ?? [];

  // Collect all gap keys that exist across all counters
  const allGaps = Array.from(
    new Set(counters.flatMap((obj) => Object.keys(obj))),
  )
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-y-4 w-full">
      <h1 className="text-2xl font-bold">Generate Numbers</h1>
      <div className="grid grid-cols-2 gap-x-4">
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
          <div className="flex gap-x-4 items-center justify-between w-full">
            <ul className="flex gap-x-2 items-center">
              {results?.bestCombination?.map((n, index) => (
                <li key={index}>{n}</li>
              ))}
            </ul>
            <CopyToClipboardButton
              txtToCopy={
                results?.bestCombination
                  ? results.bestCombination.join(", ")
                  : undefined
              }
            />
          </div>
        </Card>
        <Card className="flex flex-col gap-y-4 border rounded-md p-4 w-full">
          <h3 className="text-lg font-semibold">Analysis</h3>
          <Accordion type="single" collapsible>
            <AccordionItem value="odd-even-dist">
              <AccordionTrigger>Odd/Even Distribution</AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-medium">Label</TableHead>
                      <TableHead className="font-medium text-center">
                        Count
                      </TableHead>
                      <TableHead className="font-medium text-center">
                        Percentage
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis?.distribution.map((r, index) => (
                      <TableRow
                        key={index}
                        className={cn(
                          "cursor-pointer hover:bg-slate-300",
                          r.oddCount === genOptions.oddRange[0] &&
                            "bg-slate-300",
                          r.oddCount === genOptions.oddRange[1] &&
                            "bg-slate-300",
                        )}
                        onClick={() => handleOddRangeChange(r)}
                      >
                        <TableCell>{r.label}</TableCell>
                        <TableCell className="text-center">{r.count}</TableCell>
                        <TableCell className="text-center">
                          {r.pct.toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="gap-dist">
              <AccordionTrigger>Gap Distribution</AccordionTrigger>
              <AccordionContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="main-gap-dist">
                    <AccordionTrigger>Main Numbers</AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Gap</TableHead>
                            {analysis?.gapDistributionData.main.gapCounters.map(
                              (_, index) => (
                                <TableHead key={index} className="font-medium">
                                  N{index + 1} to N{index + 2}
                                </TableHead>
                              ),
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allGaps.map((gap) => (
                            <TableRow
                              key={gap}
                              className={cn(
                                "cursor-pointer hover:bg-slate-200",
                                gap === genOptions.maxMainGapThreshold &&
                                  "bg-slate-300",
                              )}
                              onClick={() =>
                                handleGapChange("maxMainGapThreshold", gap)
                              }
                            >
                              <TableCell className="font-medium text-center">
                                {gap}
                              </TableCell>

                              {counters.map((counterObj, idx) => (
                                <TableCell
                                  key={idx}
                                  className={cn("text-center")}
                                >
                                  {counterObj[gap] ?? 0}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="lucky-gap-dist">
                    <AccordionTrigger>Lucky Numbers</AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-center">Gap</TableHead>
                            <TableHead className="text-center">
                              N1 to N2
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(
                            analysis?.gapDistributionData.lucky
                              .gapCounters[0] ?? {},
                          ).map(([gap, count]) => (
                            <TableRow
                              key={gap}
                              className={cn(
                                "cursor-pointer hover:bg-slate-200",
                                Number(gap) ===
                                  genOptions.maxLuckyGapThreshold &&
                                  "bg-slate-300",
                              )}
                              onClick={() =>
                                handleGapChange(
                                  "maxLuckyGapThreshold",
                                  Number(gap),
                                )
                              }
                            >
                              <TableCell className="font-medium text-center">
                                {gap}
                              </TableCell>
                              <TableCell className="text-center">
                                {count ?? 0}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </div>
    </div>
  );
}
