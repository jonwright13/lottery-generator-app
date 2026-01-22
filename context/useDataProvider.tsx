"use client";

import { DEFAULT_OPTIONS } from "@/lib/generator/constants";
import { GenerateValidNumberSetOptions } from "@/lib/generator/types";
import { ThresholdCriteria } from "@/lib/generator/threshold-criteria";
import { LotteryTuple } from "@/lib/generator/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface DataContextValue {
  pastNumbers: LotteryTuple[] | null;
  updatedAt: string | null;
  isLoading: boolean;
  error: string | null;
  analysis: ThresholdCriteria | null;
  dates: string[] | null;
  genOptions: GenerateValidNumberSetOptions;
  updateOptions: (key: keyof GenerateValidNumberSetOptions, value: any) => void;
  refresh: () => Promise<void>;
}

interface DataProviderProps {
  children: React.ReactNode;
}

const dataContext = createContext<DataContextValue | null>(null);

export const DataProvider = ({ children }: DataProviderProps) => {
  const [pastNumbers, setPastNumbers] = useState<LotteryTuple[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [dates, setDates] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [genOptions, setGenOptions] =
    useState<GenerateValidNumberSetOptions>(DEFAULT_OPTIONS);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/data/external-data.json", {
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error(`Failed to load data. ${response.status}`);

      const json = await response.json();

      const pastNumbersData = json.results;
      if (!Array.isArray(pastNumbersData) || pastNumbersData.length === 0) {
        alert("No numbers to check against. Try refreshing the page");
        return;
      }

      setPastNumbers(pastNumbersData);
      setUpdatedAt(json.fetchedAt as string);
      setDates(json.dates as string[]);
    } catch (err) {
      console.error("Error fetching data.", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPastNumbers(null);
      setUpdatedAt(null);
      setDates(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch once on mount
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const analysis = useMemo(
    () => (pastNumbers ? new ThresholdCriteria(pastNumbers, false) : null),
    [pastNumbers],
  );

  useEffect(() => {
    if (!analysis) return;
    setGenOptions({
      ...DEFAULT_OPTIONS,
      sumMin: analysis.sumMin,
      sumMax: analysis.sumMax,
      maxMainGapThreshold: analysis.maxMainGapThreshold,
      maxLuckyGapThreshold: analysis.maxLuckyGapThreshold,
      maxMultiplesAllowed: analysis.maxMultiplesAllowed,
      oddRange: analysis.oddRange,
    });
  }, [analysis]);

  const updateOptions = (
    key: keyof GenerateValidNumberSetOptions,
    value: any,
  ) => {
    setGenOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const value = useMemo(
    () => ({
      pastNumbers,
      updatedAt,
      isLoading,
      error,
      refresh: fetchData,
      analysis,
      genOptions,
      updateOptions,
      dates,
    }),
    [
      pastNumbers,
      updatedAt,
      isLoading,
      error,
      fetchData,
      analysis,
      genOptions,
      updateOptions,
      dates,
    ],
  );

  return <dataContext.Provider value={value}>{children}</dataContext.Provider>;
};

export const useData = () => {
  const ctx = useContext(dataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
};
