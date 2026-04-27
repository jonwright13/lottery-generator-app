import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UpdateOptions } from "@/lib/generator";
import { TableItemProps } from "../types";

type Props = Pick<TableItemProps, "genOptions"> & {
  updateOptions: UpdateOptions;
};

export const RecentBiasItem = ({ genOptions, updateOptions }: Props) => {
  const biasPct = Math.round(genOptions.recentBias * 100);

  const handleWindow = (raw: string) => {
    const value = Number(raw);
    if (Number.isNaN(value)) return;
    updateOptions("recentWindowSize", Math.max(0, Math.floor(value)));
  };

  const handleBias = (raw: string) => {
    const value = Number(raw);
    if (Number.isNaN(value)) return;
    const clamped = Math.min(100, Math.max(0, value));
    updateOptions("recentBias", clamped / 100);
  };

  return (
    <>
      <p>
        Bias the generator toward numbers that have appeared frequently in the
        most recent N draws. Window sets N; Bias blends recent-only frequency
        into the positional score (0 leaves behaviour unchanged, 100 uses only
        the recent window).
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 items-center">
        <Label htmlFor="recentWindowSize">Window (draws)</Label>
        <Input
          id="recentWindowSize"
          name="recentWindowSize"
          type="number"
          min={0}
          step={5}
          value={genOptions.recentWindowSize}
          onChange={(e) => handleWindow(e.target.value)}
          onFocus={(e) => e.target.select()}
        />
        <Label htmlFor="recentBias">Bias (%)</Label>
        <Input
          id="recentBias"
          name="recentBias"
          type="number"
          min={0}
          max={100}
          step={5}
          value={biasPct}
          onChange={(e) => handleBias(e.target.value)}
          onFocus={(e) => e.target.select()}
        />
      </div>
    </>
  );
};
