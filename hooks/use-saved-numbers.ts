"use client";

import { useCallback, useSyncExternalStore } from "react";
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
        (s as SavedSet).numbers.length > 0,
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

// Module-level state so every component reading the hook sees the same list
// and updates land everywhere immediately without prop drilling or context.
let state: SavedSet[] = [];
let hydrated = false;
const SERVER_SNAPSHOT: SavedSet[] = [];
const listeners = new Set<() => void>();

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  state = loadFromStorage();
}

function commit(next: SavedSet[]) {
  state = next;
  writeToStorage(next);
  for (const cb of listeners) cb();
}

function subscribe(cb: () => void) {
  ensureHydrated();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

export function useSavedNumbers() {
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback((numbers: LotteryTuple) => {
    commit([
      {
        id: crypto.randomUUID(),
        numbers,
        savedAt: new Date().toISOString(),
      },
      ...state,
    ]);
  }, []);

  const remove = useCallback((id: string) => {
    commit(state.filter((s) => s.id !== id));
  }, []);

  return { list, add, remove, hydrated };
}
