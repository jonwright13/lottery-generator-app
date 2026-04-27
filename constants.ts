import type { GameConfig } from "@/lib/games";

export interface FieldDef {
  name: string;
  max: number;
  label: string;
}

/**
 * Build the per-position field metadata used by the Check Numbers form,
 * the historical table, the heatmap, and the top-numbers card. Mains
 * become "N1..N{mainCount}" using `main.max`; bonuses become
 * "{label}1..{label}{bonusCount}" using `bonus.max` and the bonus's
 * single-letter label initial.
 */
export const buildFieldsForGame = (game: GameConfig): FieldDef[] => {
  const fields: FieldDef[] = [];
  for (let i = 1; i <= game.main.count; i++) {
    fields.push({ name: `num-${i}`, max: game.main.max, label: `N${i}` });
  }
  const bonusLetter = (game.bonus.label[0] ?? "B").toUpperCase();
  for (let i = 1; i <= game.bonus.count; i++) {
    fields.push({
      name: `num-${game.main.count + i}`,
      max: game.bonus.max,
      label: `${bonusLetter}${i}`,
    });
  }
  return fields;
};
