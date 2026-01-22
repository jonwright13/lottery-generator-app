import {
  ThresholdCriteria,
  type GenerateValidNumberSetOptions,
} from "@/lib/generator";

export interface InputItemProps {
  genOptions: GenerateValidNumberSetOptions;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface TableItemProps {
  analysis: ThresholdCriteria | null;
  genOptions: GenerateValidNumberSetOptions;
  updateOptions: (key: keyof GenerateValidNumberSetOptions, value: any) => void;
}
