import {
  AGE_BUCKETS,
  COUNTRIES,
  HEIGHT_BUCKETS,
  POSITIONS,
  POSITION_SKILL_WEIGHTS,
  POTENTIAL_TIER_META,
} from "./constants";
import type {
  AgeBucket,
  HeightBucket,
  Position,
  PotentialTier,
  StatBlock,
  StatGroup,
  StatKey,
} from "./types";
import { STAT_KEYS } from "./types";
import { clampStat } from "./rating";

/** Inclusive integer between min and max. */
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomAge(bucket: AgeBucket): number {
  const b = AGE_BUCKETS.find((x) => x.id === bucket) ?? AGE_BUCKETS[0];
  return randInt(b.min, b.max);
}

/** Random height — but biased by position when the bucket is "any", so libero
 *  randomization doesn't land you at 213cm. */
export function randomHeight(bucket: HeightBucket, position?: Position): number {
  if (bucket !== "any") {
    const b = HEIGHT_BUCKETS.find((x) => x.id === bucket)!;
    return randInt(b.min, b.max);
  }
  if (!position) return randInt(176, 205);
  switch (position) {
    case "Libero":
      return randInt(170, 188);
    case "Setter":
      return randInt(184, 198);
    case "Outside Hitter":
      return randInt(188, 202);
    case "Opposite Hitter":
      return randInt(192, 208);
    case "Middle Blocker":
      return randInt(198, 214);
  }
}

export function randomPosition(): Position {
  return pick(POSITIONS);
}

export function randomCountry(): string {
  return pick(COUNTRIES);
}

export function randomJersey(): number {
  return randInt(1, 99);
}

/** ±delta around an existing value, clamped to 1–100. delta defaults to 5. */
export function jitterStat(value: number, delta = 5): number {
  return clampStat(value + randInt(-delta, delta));
}

/** Apply ±delta jitter to every stat in the block (used by "randomize all"). */
export function jitterStats(stats: StatBlock, delta = 5): StatBlock {
  const out = { ...stats } as StatBlock;
  for (const k of Object.keys(stats) as StatKey[]) {
    out[k] = jitterStat(stats[k], delta);
  }
  return out;
}

/** A "fresh roll" stat block — used when you want stats with no prior baseline.
 *  Values cluster around 50–75 with a small position bump on headline skills. */
export function freshRollStats(position: Position): StatBlock {
  const out: Partial<Record<StatKey, number>> = {};
  const groups: StatKey[][] = [];
  // Build per-group arrays
  for (const [, keys] of Object.entries({
    skill: ["attack", "defense", "serve", "block", "receive", "setting"],
    technical: [
      "precision",
      "flair",
      "digging",
      "positioning",
      "ball_control",
      "technique",
      "playmaking",
      "spin",
    ],
    physical: [
      "speed",
      "agility",
      "strength",
      "endurance",
      "vertical",
      "flexibility",
      "torque",
      "balance",
    ],
    mental: [
      "leadership",
      "teamwork",
      "concentration",
      "pressure",
      "consistency",
      "vision",
      "game_iq",
      "intimidation",
    ],
  })) {
    groups.push(keys as StatKey[]);
  }
  for (const g of groups) {
    for (const k of g) out[k] = randInt(45, 72);
  }
  const top = Object.entries(POSITION_SKILL_WEIGHTS[position])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k]) => k as StatKey);
  for (const k of top) out[k] = randInt(70, 85);
  return out as StatBlock;
}

/** Default contract / wage / value derived from a target overall, plus a
 *  suggested potential tier so the caller doesn't have to pick one manually. */
export function suggestEconForOverall(overall: number): {
  monthly_wage: number;
  player_value: number;
  contract_years: number;
  potentialTier: PotentialTier;
} {
  const o = Math.max(40, Math.min(95, overall));
  const monthly_wage = Math.round(((o - 40) ** 2 * 18 + 800) / 100) * 100;
  const player_value = Math.round((monthly_wage * (40 + (o - 40) * 1.3)) / 1000) * 1000;
  const contract_years = o >= 80 ? 3 : o >= 65 ? 2 : 1;
  // Suggest a tier one step above the current overall tier so new players
  // have room to grow rather than being capped right at their current level.
  const potentialTier: PotentialTier =
    o >= 80 ? 1 : o >= 70 ? 1 : o >= 60 ? 2 : o >= 50 ? 3 : 4;
  return { monthly_wage, player_value, contract_years, potentialTier };
}

/**
 * Generate a per-stat potential block for a player.
 *
 * The tier sets the target overall range. Position-key stats receive a boost
 * so the ceiling reflects the player's role. Every potential stat is clamped
 * to [currentStats[key], 100] — potential can never fall below current.
 */
export function generatePotentialStats(
  currentStats: StatBlock,
  position: Position,
  tier: PotentialTier
): StatBlock {
  const { targetMin, targetMax } = POTENTIAL_TIER_META[tier];
  const target = randInt(targetMin, targetMax);

  // Rank position skills by weight so we know which ones to boost.
  const skillRanks = Object.entries(POSITION_SKILL_WEIGHTS[position])
    .sort((a, b) => b[1] - a[1])
    .reduce<Map<string, number>>((m, [k], i) => { m.set(k, i); return m; }, new Map());

  const out: Partial<Record<StatKey, number>> = {};

  for (const group of Object.keys(STAT_KEYS) as StatGroup[]) {
    for (const key of STAT_KEYS[group] as readonly StatKey[]) {
      let base = target;
      const rank = skillRanks.get(key);
      if (rank !== undefined) {
        // Top 2 position skills get a meaningful ceiling boost.
        if (rank === 0) base += randInt(8, 15);
        else if (rank === 1) base += randInt(4, 10);
        else if (rank === 2) base += randInt(0, 5);
        else base += randInt(-8, 2);
      }
      base += randInt(-5, 5); // per-stat jitter

      // Potential can never be below the player's current stat value.
      out[key] = clampStat(Math.max(currentStats[key], base));
    }
  }

  return out as StatBlock;
}
