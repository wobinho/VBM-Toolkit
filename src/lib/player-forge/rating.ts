import {
  OVERALL_GROUP_WEIGHTS,
  POSITION_SKILL_WEIGHTS,
} from "./constants";
import { STAT_KEYS } from "./types";
import type { Position, StatBlock, StatGroup, StatKey } from "./types";

/** Clamp v to [1, 100] and round — every stat in the model is an integer. */
export function clampStat(v: number): number {
  if (!Number.isFinite(v)) return 50;
  return Math.max(1, Math.min(100, Math.round(v)));
}

/** Mean of one group's stats (1–100). */
export function groupAverage(stats: StatBlock, group: StatGroup): number {
  const keys = STAT_KEYS[group] as readonly StatKey[];
  if (keys.length === 0) return 0;
  let sum = 0;
  for (const k of keys) sum += stats[k] ?? 0;
  return sum / keys.length;
}

/**
 * Position-weighted overall (1–99). The Core Skills slice is weighted by the
 * position's per-skill table; the other three groups are unweighted means.
 * The four slices are then mixed by OVERALL_GROUP_WEIGHTS.
 */
export function computeOverall(stats: StatBlock, position: Position): number {
  const skillW = POSITION_SKILL_WEIGHTS[position];
  let skill = 0;
  for (const [k, w] of Object.entries(skillW)) {
    skill += (stats[k as StatKey] ?? 0) * w;
  }
  const blended =
    skill * OVERALL_GROUP_WEIGHTS.skill +
    groupAverage(stats, "technical") * OVERALL_GROUP_WEIGHTS.technical +
    groupAverage(stats, "physical") * OVERALL_GROUP_WEIGHTS.physical +
    groupAverage(stats, "mental") * OVERALL_GROUP_WEIGHTS.mental;
  return Math.max(1, Math.min(99, Math.round(blended)));
}

/** Build a starting stat block — all 50s. */
export function blankStats(): StatBlock {
  const out: Partial<Record<StatKey, number>> = {};
  for (const group of Object.keys(STAT_KEYS) as StatGroup[]) {
    for (const k of STAT_KEYS[group]) out[k as StatKey] = 50;
  }
  return out as StatBlock;
}

/** Position-appropriate "neutral" starter — a flat 55 with a small bump on the
 *  position's headline skills, so a new player isn't pure mush. */
export function starterStatsForPosition(position: Position): StatBlock {
  const base = blankStats();
  const top = Object.entries(POSITION_SKILL_WEIGHTS[position])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k]) => k as StatKey);
  for (const k of top) base[k] = 65;
  base.teamwork = 58;
  base.concentration = 58;
  base.consistency = 58;
  return base;
}
