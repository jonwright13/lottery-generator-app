"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSavedNumbers, type SavedSet } from "@/hooks/use-saved-numbers";
import { useData } from "@/context/useDataProvider";
import { type LotteryTuple } from "@/lib/generator";
import { TrashIcon } from "lucide-react";
import { useMemo } from "react";

interface RowProps {
  set: SavedSet;
  matched: boolean;
  onRemove: (id: string) => void;
  onSelect?: (numbers: LotteryTuple) => void;
}

const Row = ({ set, matched, onRemove, onSelect }: RowProps) => {
  const numbersList = (
    <ul className="flex gap-x-2 font-mono text-sm md:text-base">
      {set.numbers.map((n, i) => (
        <li key={i}>{n}</li>
      ))}
    </ul>
  );

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b last:border-b-0 py-2">
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(set.numbers)}
          className="cursor-pointer rounded-md px-2 py-1 -mx-2 hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="Load into form"
        >
          {numbersList}
        </button>
      ) : (
        numbersList
      )}
      <span
        className={
          matched
            ? "text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            : "text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
        }
      >
        {matched ? "Drawn before" : "Not drawn"}
      </span>
      <span className="text-xs text-muted-foreground ml-auto">
        {new Date(set.savedAt).toLocaleString()}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(set.id)}
        title="Remove"
      >
        <TrashIcon />
      </Button>
    </div>
  );
};

interface Props {
  onSelect?: (numbers: LotteryTuple) => void;
}

export const SavedSetsList = ({ onSelect }: Props) => {
  const { game, pastNumbers } = useData();
  const { list, remove, hydrated } = useSavedNumbers(game.id);

  const pastSet = useMemo(
    () => new Set(pastNumbers.map((row) => row.join(","))),
    [pastNumbers],
  );

  return (
    <Card className="flex flex-col gap-y-2 p-4 w-full">
      <h3 className="text-lg font-semibold">Saved {game.name} sets</h3>
      {onSelect && (
        <p className="text-sm text-muted-foreground">
          Click any set to load it into the form.
        </p>
      )}
      {!hydrated ? null : list.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No saved {game.name} sets yet. Generate some on the home page and
          tap the bookmark to save them here.
        </p>
      ) : (
        <div className="flex flex-col">
          {list.map((s) => (
            <Row
              key={s.id}
              set={s}
              matched={pastSet.has(s.numbers.join(","))}
              onRemove={remove}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </Card>
  );
};
