"use client";

import { GeneratorContainer } from "@/components/generator-components/generator-container";
import { GeneratorControls } from "@/components/generator-components/generator-controls";
import { Heatmap } from "@/components/position-heat-map";
import { useData } from "@/context/useDataProvider";

export default function Home() {
  const { pastNumbers, analysis, genOptions, updateOptions } = useData();

  return (
    <div className="flex flex-col gap-y-4 w-full justify-center">
      <h1 className="text-2xl font-bold">Generate Numbers</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
        <GeneratorContainer pastNumbers={pastNumbers} genOptions={genOptions} />
        <GeneratorControls
          updateOptions={updateOptions}
          analysis={analysis}
          genOptions={genOptions}
        />
      </div>
      <div className="flex flex-col gap-y-4">
        <Heatmap analysis={analysis} />
      </div>
    </div>
  );
}
