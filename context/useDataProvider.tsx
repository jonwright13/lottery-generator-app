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
  GAMES,
  DEFAULT_GAME_ID,
  getGameById,
} from "@/lib/games";
import { buildFieldsForGame, type FieldDef } from "@/constants";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import euromillionsData from "@/public/data/euromillions.json";
import lottoData from "@/public/data/lotto.json";
import setForLifeData from "@/public/data/set-for-life.json";
import thunderballData from "@/public/data/thunderball.json";

type RawGameData = {
  fetchedAt: string;
  source?: string;
  dates: string[];
  results: string[][];
};

// Statically-imported per-game data. Adding a new game means importing its
// JSON here and registering it in `lib/games/index.ts`. The size cost is
// ~120 KB per game; if the registry grows past 4-5 games we should switch
// to dynamic imports.
const RAW_DATA: Record<string, RawGameData> = {
  euromillions: euromillionsData as RawGameData,
  lotto: lottoData as RawGameData,
  "set-for-life": setForLifeData as RawGameData,
  thunderball: thunderballData as RawGameData,
};

const buildSeededOptions = (
  analysis: ThresholdCriteria,
  game: GameConfig,
): GenerateValidNumberSetOptions => ({
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
});

interface DataContextValue {
  game: GameConfig;
  fields: FieldDef[];
  pastNumbers: LotteryTuple[];
  updatedAt: string;
  analysis: ThresholdCriteria;
  dates: string[];
  genOptions: GenerateValidNumberSetOptions;
  updateOptions: UpdateOptions;
  resetOptions: () => void;
  isAtDefaults: boolean;
}

interface DataProviderProps {
  children: React.ReactNode;
}

const dataContext = createContext<DataContextValue | null>(null);

export const DataProvider = ({ children }: DataProviderProps) => {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("game") ?? DEFAULT_GAME_ID;
  // Fall back to the first registered game if the URL points at an unknown id.
  const game = getGameById(requestedId) ?? GAMES[0];

  const { pastNumbers, dates, updatedAt, analysis, fields, seededOptions } =
    useMemo(() => {
      const raw = RAW_DATA[game.id];
      if (!raw) {
        throw new Error(
          `No data registered for game "${game.id}"; add it to RAW_DATA.`,
        );
      }
      if (!Array.isArray(raw.results) || raw.results.length === 0) {
        throw new Error(
          `${game.dataPath} is missing or empty — run \`npm run fetch:data\``,
        );
      }
      const past = raw.results as LotteryTuple[];
      const a = new ThresholdCriteria(past, game, false);
      const f = buildFieldsForGame(game);
      const s = buildSeededOptions(a, game);
      return {
        pastNumbers: past,
        dates: raw.dates,
        updatedAt: raw.fetchedAt,
        analysis: a,
        fields: f,
        seededOptions: s,
      };
    }, [game]);

  // When the URL game changes, reseed genOptions so threshold values from
  // (e.g.) EuroMillions don't bleed into Lotto's analysis. Tracking the
  // previous game id with another piece of state and setting state during
  // render is the React-blessed way to derive state from props without
  // an extra effect — React discards the in-flight render and retries
  // with the new state. See:
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [genOptions, setGenOptions] = useState(seededOptions);
  const [prevGameId, setPrevGameId] = useState(game.id);
  if (prevGameId !== game.id) {
    setPrevGameId(game.id);
    setGenOptions(seededOptions);
  }

  const updateOptions = useCallback<UpdateOptions>((key, value) => {
    setGenOptions((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetOptions = useCallback(() => {
    setGenOptions(seededOptions);
  }, [seededOptions]);

  // Both objects come from the same code paths (DEFAULT_OPTIONS spread + the
  // same ordered seed keys), so JSON.stringify gives stable key order and a
  // correct deep equality without pulling in a comparator.
  const isAtDefaults = useMemo(
    () => JSON.stringify(genOptions) === JSON.stringify(seededOptions),
    [genOptions, seededOptions],
  );

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
      resetOptions,
      isAtDefaults,
    }),
    [
      game,
      fields,
      pastNumbers,
      updatedAt,
      dates,
      analysis,
      genOptions,
      updateOptions,
      resetOptions,
      isAtDefaults,
    ],
  );

  return <dataContext.Provider value={value}>{children}</dataContext.Provider>;
};

export const useData = () => {
  const ctx = useContext(dataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
};
