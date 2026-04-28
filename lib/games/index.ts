import type { GameConfig } from "./types";
import { EUROMILLIONS } from "./euromillions";
import { LOTTO } from "./lotto";
import { SET_FOR_LIFE } from "./set-for-life";

export type { GameConfig, BallSet } from "./types";

/**
 * Registry of every game the app knows about. Order is the order the game
 * switcher renders in. The first entry is the default game until
 * DEFAULT_GAME_ID below is changed.
 */
export const GAMES: readonly GameConfig[] = [
  EUROMILLIONS,
  LOTTO,
  SET_FOR_LIFE,
] as const;

export const DEFAULT_GAME_ID: string = EUROMILLIONS.id;

export const getGameById = (id: string): GameConfig | undefined =>
  GAMES.find((g) => g.id === id);

export const getDefaultGame = (): GameConfig => {
  const g = getGameById(DEFAULT_GAME_ID);
  if (!g) throw new Error(`Default game "${DEFAULT_GAME_ID}" not registered`);
  return g;
};

/** Total slot count = main.count + bonus.count. */
export const drawSize = (game: GameConfig): number =>
  game.main.count + game.bonus.count;
