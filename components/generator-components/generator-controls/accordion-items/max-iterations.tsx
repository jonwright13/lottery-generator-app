import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputItemProps } from "../types";

export const MaxIterationsItem = ({
  genOptions,
  handleInputChange,
}: InputItemProps) => {
  return (
    <>
      <p>
        Controls how many attempts the generator can make before stopping.
        Higher values allow more time to satisfy strict constraints but may
        increase processing time.
      </p>
      <div className="grid grid-cols-3 gap-x-4 gap-y-2 items-center">
        <Label>Max Iterations</Label>
        <Input
          name="maxIterations"
          type="number"
          min={0}
          value={genOptions.maxIterations}
          onChange={handleInputChange}
          onFocus={(e) => e.target.select()}
        />
      </div>
    </>
  );
};
