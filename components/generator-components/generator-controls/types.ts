import {
  ThresholdCriteria,
  type GenerateValidNumberSetOptions,
  type UpdateOptions,
} from "@/lib/generator";

export interface InputItemProps {
  genOptions: GenerateValidNumberSetOptions;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface TableItemProps {
  analysis: ThresholdCriteria | null;
  genOptions: GenerateValidNumberSetOptions;
  updateOptions: UpdateOptions;
}
