/**
 * Player Forge data model — mass-create custom players for the Volleyball
 * Manager "Custom Save" wizard. The JSON export shape mirrors
 * `custom-players-template.json` exactly so the in-game importer accepts it
 * without translation.
 */

export type Position =
  | "Outside Hitter"
  | "Middle Blocker"
  | "Opposite Hitter"
  | "Setter"
  | "Libero";

/** The four stat groups, in display order. */
export type StatGroup = "skill" | "technical" | "physical" | "mental";

/** Stat keys grouped by category — every stat is an integer 1–100. */
export const STAT_KEYS = {
  skill: ["attack", "defense", "serve", "block", "receive", "setting"] as const,
  technical: [
    "precision",
    "flair",
    "digging",
    "positioning",
    "ball_control",
    "technique",
    "playmaking",
    "spin",
  ] as const,
  physical: [
    "speed",
    "agility",
    "strength",
    "endurance",
    "vertical",
    "flexibility",
    "torque",
    "balance",
  ] as const,
  mental: [
    "leadership",
    "teamwork",
    "concentration",
    "pressure",
    "consistency",
    "vision",
    "game_iq",
    "intimidation",
  ] as const,
} satisfies Record<StatGroup, readonly string[]>;

export type SkillKey = (typeof STAT_KEYS.skill)[number];
export type TechnicalKey = (typeof STAT_KEYS.technical)[number];
export type PhysicalKey = (typeof STAT_KEYS.physical)[number];
export type MentalKey = (typeof STAT_KEYS.mental)[number];
export type StatKey = SkillKey | TechnicalKey | PhysicalKey | MentalKey;

/** Flat map of every stat → 1–100. */
export type StatBlock = Record<StatKey, number>;

/** Five tiers of potential ceiling. 1 = elite ceiling, 5 = fringe ceiling. */
export type PotentialTier = 1 | 2 | 3 | 4 | 5;

/** A single editable player. `id` is local only — stripped on export. */
export type Player = {
  id: string;
  player_name: string;
  position: Position;
  age: number;
  country: string;
  jersey_number: number;
  height: number;
  /** Tier 1–5 that the user picks — drives the target range for potentialStats generation. */
  potentialTier: PotentialTier;
  /** Per-stat potential ceiling. computeOverall(potentialStats, position) = the exported "potential" value. */
  potentialStats: StatBlock;
  contract_years: number;
  monthly_wage: number;
  player_value: number;
  stats: StatBlock;
  /** Optional pointer to the archetype currently applied — purely informational. */
  archetypeId?: string | null;
};

/** Five tiers of "how good is this archetype". 1 = elite, 5 = bench filler. */
export type ArchetypeTier = 1 | 2 | 3 | 4 | 5;


/** A reusable stat preset — every stat is required so loading is deterministic. */
export type Archetype = {
  id: string;
  name: string;
  /** Position this archetype is designed for — gates the archetype picker. */
  position: Position;
  tier: ArchetypeTier;
  stats: StatBlock;
  /** Computed overall at save time — used as a quick badge in the manager. */
  overall: number;
  createdAt: number;
};

/** A 5-year age bucket the user can scope randomization to. */
export type AgeBucket = "any" | "16-20" | "21-25" | "26-30" | "31-36" | "37-40";

/** A 10-cm height bucket — same idea. */
export type HeightBucket =
  | "any"
  | "166-175"
  | "176-185"
  | "186-195"
  | "196-205"
  | "206-215";

export type RandomizationBuckets = {
  age: AgeBucket;
  height: HeightBucket;
};

export type PlayerForgeState = {
  version: number;
  players: Player[];
  archetypes: Archetype[];
  /** Currently selected player in the roster — null when the roster is empty. */
  selectedPlayerId: string | null;
  /** Global randomization scope — applies to all "randomize age/height" actions. */
  buckets: RandomizationBuckets;
};
