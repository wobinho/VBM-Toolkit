import type {
  AgeBucket,
  HeightBucket,
  Position,
  PotentialTier,
  StatGroup,
  StatKey,
} from "./types";

export const POSITIONS: readonly Position[] = [
  "Outside Hitter",
  "Middle Blocker",
  "Opposite Hitter",
  "Setter",
  "Libero",
] as const;

/** Short label used in compact roster cards and chips. */
export const POSITION_SHORT: Record<Position, string> = {
  "Outside Hitter": "OH",
  "Middle Blocker": "MB",
  "Opposite Hitter": "OPP",
  Setter: "S",
  Libero: "L",
};

/** A volleyball-leaning country pool — covers FIVB top-30 plus a few extras.
 *  Stored as an array because order = picker order. */
export const COUNTRIES: readonly string[] = [
  "Argentina",
  "Australia",
  "Belgium",
  "Brazil",
  "Bulgaria",
  "Canada",
  "China",
  "Croatia",
  "Cuba",
  "Czechia",
  "Denmark",
  "Egypt",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Iran",
  "Italy",
  "Japan",
  "Kazakhstan",
  "Mexico",
  "Netherlands",
  "Norway",
  "Poland",
  "Portugal",
  "Puerto Rico",
  "Romania",
  "Russia",
  "Serbia",
  "Slovenia",
  "South Korea",
  "Spain",
  "Sweden",
  "Tunisia",
  "Türkiye",
  "Ukraine",
  "United States",
  "Venezuela",
];

export const AGE_BUCKETS: readonly { id: AgeBucket; label: string; min: number; max: number }[] =
  [
    { id: "any", label: "Any (14–60)", min: 14, max: 60 },
    { id: "16-20", label: "16–20 · Prospect", min: 16, max: 20 },
    { id: "21-25", label: "21–25 · Rising", min: 21, max: 25 },
    { id: "26-30", label: "26–30 · Prime", min: 26, max: 30 },
    { id: "31-36", label: "31–36 · Veteran", min: 31, max: 36 },
    { id: "37-40", label: "37–40 · Twilight", min: 37, max: 40 },
  ];

export const HEIGHT_BUCKETS: readonly {
  id: HeightBucket;
  label: string;
  min: number;
  max: number;
}[] = [
  { id: "any", label: "Any (140–230)", min: 140, max: 230 },
  { id: "166-175", label: "166–175 · Short", min: 166, max: 175 },
  { id: "176-185", label: "176–185 · Compact", min: 176, max: 185 },
  { id: "186-195", label: "186–195 · Standard", min: 186, max: 195 },
  { id: "196-205", label: "196–205 · Tall", min: 196, max: 205 },
  { id: "206-215", label: "206–215 · Towering", min: 206, max: 215 },
];

/** Stat-group display metadata — labels, hint copy, and the per-stat display
 *  label. The order here drives the order in the stat editor. */
export const STAT_GROUP_META: Record<
  StatGroup,
  { label: string; accent: string; hint: string }
> = {
  skill: {
    label: "Core Skills",
    accent: "#7fa8cc",
    hint: "Position-defining outputs — the six things a player actually does on the court.",
  },
  technical: {
    label: "Technical",
    accent: "#c69ac7",
    hint: "Refinement layer — how cleanly the core skills execute under load.",
  },
  physical: {
    label: "Physical",
    accent: "#a3c69a",
    hint: "Athletic envelope — speed, reach, and how long the engine lasts.",
  },
  mental: {
    label: "Mental",
    accent: "#cfb98a",
    hint: "The intangibles — composure, reading the game, and locker-room weight.",
  },
};

/** Friendly display label for each stat. Falls back to a Title Case of the key. */
export const STAT_LABEL: Partial<Record<StatKey, string>> = {
  ball_control: "Ball Control",
  game_iq: "Game IQ",
};

export function statLabel(key: StatKey): string {
  return (
    STAT_LABEL[key] ??
    key
      .split("_")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ")
  );
}

/** Position-aware overall weighting. Sums to 1.0 within `skill`; the other
 *  three groups contribute a flat slice each, so the result lands roughly in
 *  the same range as the in-game overall. */
type SkillKey = "attack" | "defense" | "serve" | "block" | "receive" | "setting";
export const POSITION_SKILL_WEIGHTS: Record<Position, Record<SkillKey, number>> = {
  "Outside Hitter": {
    attack: 0.30,
    receive: 0.22,
    defense: 0.16,
    serve: 0.14,
    block: 0.10,
    setting: 0.08,
  },
  "Middle Blocker": {
    block: 0.34,
    attack: 0.22,
    defense: 0.14,
    serve: 0.12,
    receive: 0.10,
    setting: 0.08,
  },
  "Opposite Hitter": {
    attack: 0.34,
    serve: 0.18,
    block: 0.18,
    defense: 0.12,
    receive: 0.10,
    setting: 0.08,
  },
  Setter: {
    setting: 0.42,
    serve: 0.14,
    defense: 0.12,
    receive: 0.12,
    block: 0.10,
    attack: 0.10,
  },
  Libero: {
    receive: 0.36,
    defense: 0.28,
    setting: 0.14,
    serve: 0.10,
    attack: 0.06,
    block: 0.06,
  },
};

/** Blended overall weights — Core/Technical/Physical/Mental as fractions of 1. */
export const OVERALL_GROUP_WEIGHTS: Record<StatGroup, number> = {
  skill: 0.55,
  technical: 0.18,
  physical: 0.15,
  mental: 0.12,
};

/** Per-tier metadata for potential. Tier 1 = elite ceiling, 5 = fringe ceiling.
 *  targetMin/Max define the range that generatePotentialStats aims for when
 *  producing a fresh potential block for this tier. */
export const POTENTIAL_TIER_META: Record<
  PotentialTier,
  { label: string; accent: string; targetMin: number; targetMax: number }
> = {
  1: { label: "Superstar", accent: "#e5c96a", targetMin: 86, targetMax: 99 },
  2: { label: "Star",      accent: "#7fa8cc", targetMin: 75, targetMax: 85 },
  3: { label: "Starter",   accent: "#a3c69a", targetMin: 65, targetMax: 74 },
  4: { label: "Rotation",  accent: "#9c9c98", targetMin: 55, targetMax: 64 },
  5: { label: "Prospect",  accent: "#6b7a8a", targetMin: 40, targetMax: 54 },
};
