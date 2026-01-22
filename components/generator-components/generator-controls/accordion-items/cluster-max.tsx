import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputItemProps } from "../types";

export const ClusterMaxItem = ({
  genOptions,
  handleInputChange,
}: InputItemProps) => {
  return (
    <>
      <p>
        Clusters of numbers can occur within each group of 10. Adjust to modify
        the generation parameters.
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 items-center">
        <Label>Max Numbers in Cluster</Label>
        <Input
          name="clusterMax"
          type="number"
          min={0}
          max={5}
          value={genOptions.clusterMax}
          onChange={handleInputChange}
        />
      </div>
    </>
  );
};
