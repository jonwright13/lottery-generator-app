"use client";

import { useCallback, useEffect, useState } from "react";
import type { LotteryTuple } from "@/lib/generator";

export interface SavedSet {
  id: string;
  numbers: LotteryTuple;
  savedAt: string;
}

const STORAGE_KEY = "saved-numbers-v1";

function loadFromStorage(): SavedSet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is SavedSet =>
        !!s &&
        typeof s === "object" &&
        typeof (s as SavedSet).id === "string" &&
        typeof (s as SavedSet).savedAt === "string" &&
        Array.isArray((s as SavedSet).numbers) &&
        (s as SavedSet).numbers.length === 7,
    );
  } catch {
    return [];
  }
}

function writeToStorage(list: SavedSet[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage may be full or disabled. Nothing useful to do here.
  }
}

export function useSavedNumbers() {
  const [list, setList] = useState<SavedSet[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount. Server render and first client
  // render must match (both empty); the real data populates on the next paint.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setList(loadFromStorage());
    setHydrated(true);
  }, []);

  const add = useCallback((numbers: LotteryTuple) => {
    setList((prev) => {
      const next: SavedSet[] = [
        {
          id: crypto.randomUUID(),
          numbers,
          savedAt: new Date().toISOString(),
        },
        ...prev,
      ];
      writeToStorage(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setList((prev) => {
      const next = prev.filter((s) => s.id !== id);
      writeToStorage(next);
      return next;
    });
  }, []);

  return { list, add, remove, hydrated };
}
