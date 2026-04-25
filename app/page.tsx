"use client";

import { GeneratorContainer } from "@/components/generator-components/generator-container";
import { GeneratorControls } from "@/components/generator-components/generator-controls";
import { Heatmap } from "@/components/position-heat-map";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useData } from "@/context/useDataProvider";

export default function Home() {
  const {
    pastNumbers,
    analysis,
    genOptions,
    updateOptions,
    isLoading,
    error,
    refresh,
  } = useData();

  return (
    <div className="flex flex-col gap-y-4 w-full justify-center">
      <h1 className="text-2xl font-bold">Generate Numbers</h1>

      {isLoading && !pastNumbers && (
        <div className="flex items-center gap-x-2 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          Loading historical draws…
        </div>
      )}

      {error && !pastNumbers && (
        <div className="flex flex-col gap-y-2 border border-destructive/50 rounded-md p-4">
          <p className="text-sm">
            Could not load historical draws: <code>{error}</code>
          </p>
          <Button
            type="button"
            variant="outline"
            className="self-start"
            onClick={() => void refresh()}
          >
            Retry
          </Button>
        </div>
      )}

      {pastNumbers && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
            <GeneratorContainer
              pastNumbers={pastNumbers}
              genOptions={genOptions}
              positionCounters={analysis?.positionCounters}
            />
            <GeneratorControls
              updateOptions={updateOptions}
              analysis={analysis}
              genOptions={genOptions}
            />
          </div>
          <div className="flex flex-col gap-y-4">
            <Heatmap analysis={analysis} />
          </div>
        </>
      )}
    </div>
  );
}
