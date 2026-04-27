/**
 * Per-game configuration. Drives every count, range, and prize-tier shape that
 * was previously hard-coded to the Merseyworld 5/50 + 2/11 game.
 *
 * Adding a new lottery = adding a new GameConfig and pointing dataPath at a
 * matching JSON file under `public/data/`.
 */
export interface GameConfig {
  id: string;
  name: string;
  /** Optional display string e.g. "Tue & Fri". Not used in any logic. */
  drawDays?: string;
  main: BallSet;
  bonus: BallSet;
  /** Path under `public/` to the historical-data JSON for this game. */
  dataPath: string;
  /**
   * Match tiers in descending prize significance, e.g. for 5+2:
   *   [[5,2],[5,1],[5,0],[4,2],[4,1],[3,2],[4,0],[2,2],[3,1]]
   * Used by the Historical-Matches card to label and order rows.
   */
  prizeTiers: ReadonlyArray<readonly [number, number]>;
}

export interface BallSet {
  count: number;
  min: number;
  max: number;
  /** Singular display label, e.g. "Main", "Lucky", "Star", "Life Ball". */
  label: string;
  /**
   * Plural display label, used in headings and aria-labels.
   * Defaults to label + "s" when consumers compute it themselves.
   */
  pluralLabel?: string;
}
