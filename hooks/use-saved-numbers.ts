"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { LotteryTuple } from "@/lib/generator";

export interface SavedSet {
  id: string;
  game: string;
  numbers: LotteryTuple;
  savedAt: string;
}

const STORAGE_KEY_V1 = "saved-numbers-v1";
const STORAGE_KEY = "saved-numbers-v2";

// All v1 saved sets predate the multi-game roll-out, so they were necessarily
// EuroMillions. Tag them as such on the one-shot v1 → v2 migration.
const V1_GAME_ID = "euromillions";

const isValidV2 = (s: unknown): s is SavedSet =>
  !!s &&
  typeof s === "object" &&
  typeof (s as SavedSet).id === "string" &&
  typeof (s as SavedSet).game === "string" &&
  typeof (s as SavedSet).savedAt === "string" &&
  Array.isArray((s as SavedSet).numbers) &&
  (s as SavedSet).numbers.length > 0;

const isValidV1 = (s: unknown): s is Omit<SavedSet, "game"> =>
  !!s &&
  typeof s === "object" &&
  typeof (s as { id: unknown }).id === "string" &&
  typeof (s as { savedAt: unknown }).savedAt === "string" &&
  Array.isArray((s as { numbers: unknown }).numbers) &&
  ((s as { numbers: unknown[] }).numbers as unknown[]).length > 0;

function loadFromStorage(): SavedSet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isValidV2);
    }

    const legacyRaw = window.localStorage.getItem(STORAGE_KEY_V1);
    if (!legacyRaw) return [];

    const legacy: unknown = JSON.parse(legacyRaw);
    if (!Array.isArray(legacy)) return [];

    const migrated: SavedSet[] = legacy
      .filter(isValidV1)
      .map((s) => ({ ...s, game: V1_GAME_ID }));

    // Persist the v2 form and retire the v1 key so we only do this once.
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    window.localStorage.removeItem(STORAGE_KEY_V1);
    return migrated;
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

/**
 * Returns the saved sets scoped to a single game id, plus add/remove helpers.
 *
 * `add(numbers)` automatically tags the new set with `gameId` so callers don't
 * need to thread the game through. `remove(id)` operates on the global store
 * (saved-set ids are unique across games), so removing a set from inside the
 * Lotto view that was saved under EuroMillions still works — though the UI
 * filter means you would only see Lotto sets there in practice.
 */
export function useSavedNumbers(gameId: string) {
  const fullList = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const list = useMemo(
    () => fullList.filter((s) => s.game === gameId),
    [fullList, gameId],
  );

  const add = useCallback(
    (numbers: LotteryTuple) => {
      commit([
        {
          id: crypto.randomUUID(),
          game: gameId,
          numbers,
          savedAt: new Date().toISOString(),
        },
        ...state,
      ]);
    },
    [gameId],
  );

  const remove = useCallback((id: string) => {
    commit(state.filter((s) => s.id !== id));
  }, []);

  return { list, add, remove, hydrated };
}
