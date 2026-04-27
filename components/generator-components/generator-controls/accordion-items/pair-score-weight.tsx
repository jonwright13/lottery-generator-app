import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UpdateOptions } from "@/lib/generator";
import { TableItemProps } from "../types";

type Props = Pick<TableItemProps, "genOptions"> & {
  updateOptions: UpdateOptions;
};

export const PairScoreWeightItem = ({ genOptions, updateOptions }: Props) => {
  const percent = Math.round(genOptions.pairScoreWeight * 100);

  const handleChange = (raw: string) => {
    const value = Number(raw);
    if (Number.isNaN(value)) return;
    const clamped = Math.min(100, Math.max(0, value));
    updateOptions("pairScoreWeight", clamped / 100);
  };

  return (
    <>
      <p>
        Blend pair-cohesion (how often the chosen pairs of main numbers have
        co-occurred historically) into the score the generator optimises. 0
        leaves behaviour unchanged; 100 picks the set with the highest pair
        cohesion. Affects which set the generator returns first, not which
        sets are valid.
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 items-center">
        <Label htmlFor="pairScoreWeight">Pair-Score Weight (%)</Label>
        <Input
          id="pairScoreWeight"
          name="pairScoreWeight"
          type="number"
          min={0}
          max={100}
          step={5}
          value={percent}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={(e) => e.target.select()}
        />
      </div>
    </>
  );
};
