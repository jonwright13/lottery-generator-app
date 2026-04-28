"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { GenerateValidNumberSetOptions } from "@/lib/generator";

const STORAGE_KEY = "saved-controls-v1";

type Store = Record<string, GenerateValidNumberSetOptions>;

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

function loadFromStorage(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainObject(parsed)) return {};
    // Trust shape per game — generator parses defensively against missing keys
    // via DEFAULT_OPTIONS spreads, so a partially-shaped saved entry won't
    // break the runtime.
    const out: Store = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (isPlainObject(v)) {
        out[k] = v as unknown as GenerateValidNumberSetOptions;
      }
    }
    return out;
  } catch {
    return {};
  }
}

function writeToStorage(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage may be full or disabled. Nothing useful to do here.
  }
}

let state: Store = {};
let hydrated = false;
const SERVER_SNAPSHOT: Store = {};
const listeners = new Set<() => void>();

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  state = loadFromStorage();
}

function commit(next: Store) {
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

export interface UseSavedControls {
  /** The saved preset for this game, or null if none has been saved. */
  savedOptions: GenerateValidNumberSetOptions | null;
  /** Persist the given options as this game's preset, replacing any prior. */
  save: (options: GenerateValidNumberSetOptions) => void;
  /** Drop this game's saved preset entirely. */
  clear: () => void;
  /** True once we've read localStorage; lets callers distinguish "no saved
   * preset yet" from "haven't checked yet". */
  hydrated: boolean;
}

export function useSavedControls(gameId: string): UseSavedControls {
  const all = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const savedOptions = all[gameId] ?? null;

  const save = useCallback(
    (options: GenerateValidNumberSetOptions) => {
      commit({ ...state, [gameId]: options });
    },
    [gameId],
  );

  const clear = useCallback(() => {
    if (!(gameId in state)) return;
    const { [gameId]: _removed, ...rest } = state;
    void _removed;
    commit(rest);
  }, [gameId]);

  return { savedOptions, save, clear, hydrated };
}
