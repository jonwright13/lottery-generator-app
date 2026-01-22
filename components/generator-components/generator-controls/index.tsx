"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { GenerateValidNumberSetOptions } from "@/lib/generator/types";
import { ThresholdCriteria } from "@/lib/generator/threshold-criteria";
import { GeneratorProps } from "../types";
import {
  ClusterMaxItem,
  GapDistributionItem,
  MaxIterationsItem,
  MinMaxSumItem,
  OddEvenDistItem,
  PositionalFrequencyScoreItem,
} from "./accordion-items";

interface Props extends GeneratorProps {
  analysis: ThresholdCriteria | null;
  updateOptions: (key: keyof GenerateValidNumberSetOptions, value: any) => void;
}

export const GeneratorControls = ({
  analysis,
  genOptions,
  updateOptions,
}: Props) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!analysis) return;
    const name = e.target.name as keyof GenerateValidNumberSetOptions;
    const value = e.target.value;
    updateOptions(name, Number(value));
  };

  return (
    <Card className="flex flex-col gap-y-4 border rounded-md p-4 w-full">
      <h3 className="text-lg font-semibold">Controls</h3>
      <Accordion type="single" collapsible>
        <AccordionItem value="max-iterations">
          <AccordionTrigger>Maximum Iterations</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-y-2">
            <MaxIterationsItem
              genOptions={genOptions}
              handleInputChange={handleInputChange}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="score">
          <AccordionTrigger>
            Minimum Positional Frequency Score
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-y-2">
            <PositionalFrequencyScoreItem
              genOptions={genOptions}
              handleInputChange={handleInputChange}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="min-max-sum">
          <AccordionTrigger>Min/Max Sum</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-y-2">
            <MinMaxSumItem
              genOptions={genOptions}
              handleInputChange={handleInputChange}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="cluster-max">
          <AccordionTrigger>Cluster Max</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-y-2">
            <ClusterMaxItem
              genOptions={genOptions}
              handleInputChange={handleInputChange}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="odd-even-dist">
          <AccordionTrigger>Odd/Even Distribution</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-y-2">
            <OddEvenDistItem
              analysis={analysis}
              genOptions={genOptions}
              updateOptions={updateOptions}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="gap-dist">
          <AccordionTrigger>Gap Distribution</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-y-2">
            <GapDistributionItem
              analysis={analysis}
              genOptions={genOptions}
              updateOptions={updateOptions}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};
