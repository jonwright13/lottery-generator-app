"use client";

import {
  ThresholdCriteria,
  type GenerateValidNumberSetOptions,
  type LotteryTuple,
  type UpdateOptions,
  DEFAULT_OPTIONS,
} from "@/lib/generator";
import {
  type GameConfig,
  getDefaultGame,
} from "@/lib/games";
import { buildFieldsForGame, type FieldDef } from "@/constants";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import externalData from "@/public/data/external-data.json";

// Single-game shim: the data-migration branch will swap this for a
// per-game loader keyed off `GameConfig.dataPath`.
const game: GameConfig = getDefaultGame();

const rawResults = externalData.results;
if (!Array.isArray(rawResults) || rawResults.length === 0) {
  throw new Error(
    "external-data.json is missing or empty — run `npm run fetch:data`",
  );
}

const pastNumbers = rawResults as LotteryTuple[];
const dates = externalData.dates as string[];
const updatedAt = externalData.fetchedAt as string;
const analysis = new ThresholdCriteria(pastNumbers, game, false);
const fields = buildFieldsForGame(game);

const seededOptions: GenerateValidNumberSetOptions = {
  ...DEFAULT_OPTIONS,
  minMain: game.main.min,
  maxMain: game.main.max,
  countMain: game.main.count,
  minLucky: game.bonus.min,
  maxLucky: game.bonus.max,
  countLucky: game.bonus.count,
  sumMin: analysis.sumMin,
  sumMax: analysis.sumMax,
  maxMainGapThreshold: analysis.maxMainGapThreshold,
  maxLuckyGapThreshold: analysis.maxLuckyGapThreshold,
  maxMultiplesAllowed: analysis.maxMultiplesAllowed,
  oddRange: analysis.oddRange,
  maxSameLastDigit: analysis.maxSameLastDigit,
  maxPreviousDrawOverlap: analysis.maxPreviousDrawOverlap,
};

interface DataContextValue {
  game: GameConfig;
  fields: FieldDef[];
  pastNumbers: LotteryTuple[];
  updatedAt: string;
  analysis: ThresholdCriteria;
  dates: string[];
  genOptions: GenerateValidNumberSetOptions;
  updateOptions: UpdateOptions;
}

interface DataProviderProps {
  children: React.ReactNode;
}

const dataContext = createContext<DataContextValue | null>(null);

export const DataProvider = ({ children }: DataProviderProps) => {
  const [genOptions, setGenOptions] = useState(seededOptions);

  const updateOptions = useCallback<UpdateOptions>((key, value) => {
    setGenOptions((prev) => ({ ...prev, [key]: value }));
  }, []);

  const value = useMemo(
    () => ({
      game,
      fields,
      pastNumbers,
      updatedAt,
      dates,
      analysis,
      genOptions,
      updateOptions,
    }),
    [genOptions, updateOptions],
  );

  return <dataContext.Provider value={value}>{children}</dataContext.Provider>;
};

export const useData = () => {
  const ctx = useContext(dataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
};
