import { GenerateValidNumberSetOptions } from "@/lib/generator/types";
import { ThresholdCriteria } from "@/lib/generator/threshold-criteria";

export interface InputItemProps {
  genOptions: GenerateValidNumberSetOptions;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface TableItemProps {
  analysis: ThresholdCriteria | null;
  genOptions: GenerateValidNumberSetOptions;
  updateOptions: (key: keyof GenerateValidNumberSetOptions, value: any) => void;
}
