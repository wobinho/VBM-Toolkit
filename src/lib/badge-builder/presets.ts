import type {
  BadgeCategory,
  BadgeCategoryKind,
  BadgeLibrary,
} from "./types";

/* -------------------------------------------------------------------------- */
/*  Base template                                                             */
/* -------------------------------------------------------------------------- */

/**
 * The base prompt. [SLOT] tokens are swapped for the selected option values.
 * Team name is woven in separately (only when enabled) so this stays clean.
 */
export const DEFAULT_BADGE_TEMPLATE =
  "a [BADGE SHAPE] badge, for a sports team. vector style, high quality, [CENTRAL MOTIF] central motif, color palette is [PRIMARY COLOR] primary, [SECONDARY COLOR] secondary, [ACCENT COLOR] accent. solid white background";

/* -------------------------------------------------------------------------- */
/*  Category / option construction                                            */
/* -------------------------------------------------------------------------- */

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

type RawOption = { label: string; value: string; swatch?: string };

type RawCategory = {
  id: string;
  key: string;
  label: string;
  slot: string;
  kind: BadgeCategoryKind;
  /** Label of the option selected by default. */
  defaultLabel: string;
  options: RawOption[];
};

/** Build deterministic option IDs from the category key + option label, so the
 *  same option keeps the same ID across reloads. */
function finalize(raw: RawCategory): BadgeCategory {
  const options = raw.options.map((o) => ({
    id: `bopt-${slug(raw.key)}-${slug(o.label)}`,
    label: o.label,
    value: o.value,
    ...(o.swatch ? { swatch: o.swatch } : {}),
  }));
  const def = options.find((o) => o.label === raw.defaultLabel) ?? options[0];
  return {
    id: raw.id,
    key: raw.key,
    label: raw.label,
    slot: raw.slot,
    kind: raw.kind,
    defaultOptionId: def.id,
    options,
  };
}

/* -------------------------------------------------------------------------- */
/*  Shared colour palette                                                     */
/* -------------------------------------------------------------------------- */

/** Crest-friendly colours. For colour options the prompt value is the colour
 *  name itself; the swatch is used only for the on-screen preview. */
const COLOR_OPTIONS: RawOption[] = [
  { label: "matte black", value: "matte black", swatch: "#1b1b1b" },
  { label: "ivory white", value: "ivory white", swatch: "#f3efe3" },
  { label: "gold", value: "gold", swatch: "#d4af37" },
  { label: "crimson", value: "crimson", swatch: "#c8102e" },
  { label: "navy blue", value: "navy blue", swatch: "#16233f" },
  { label: "royal blue", value: "royal blue", swatch: "#1d4ed8" },
  { label: "sky blue", value: "sky blue", swatch: "#4ea8de" },
  { label: "forest green", value: "forest green", swatch: "#1b4d2e" },
  { label: "emerald green", value: "emerald green", swatch: "#1f8a4c" },
  { label: "teal", value: "teal", swatch: "#0e7c7b" },
  { label: "burnt orange", value: "burnt orange", swatch: "#cc5500" },
  { label: "amber", value: "amber", swatch: "#f0a500" },
  { label: "maroon", value: "maroon", swatch: "#6e1423" },
  { label: "scarlet", value: "scarlet", swatch: "#e63329" },
  { label: "purple", value: "purple", swatch: "#5b2a86" },
  { label: "charcoal grey", value: "charcoal grey", swatch: "#2b2b31" },
  { label: "silver", value: "silver", swatch: "#c9cdd2" },
  { label: "bronze", value: "bronze", swatch: "#8a5a2b" },
  { label: "cream", value: "cream", swatch: "#efe6cf" },
  { label: "slate grey", value: "slate grey", swatch: "#5b6470" },
];

/* -------------------------------------------------------------------------- */
/*  Factory categories                                                        */
/* -------------------------------------------------------------------------- */

const RAW_CATEGORIES: RawCategory[] = [
  {
    id: "bcat-shape",
    key: "BADGE SHAPE",
    label: "Badge Shape",
    slot: "[BADGE SHAPE]",
    kind: "text",
    defaultLabel: "circular",
    options: [
      { label: "circular", value: "circular" },
      { label: "shield", value: "shield-shaped" },
      { label: "crest", value: "crest-shaped" },
      { label: "rounded square", value: "rounded square" },
      { label: "hexagonal", value: "hexagonal" },
      { label: "diamond", value: "diamond-shaped" },
      { label: "oval", value: "oval" },
      { label: "octagonal", value: "octagonal" },
      { label: "banner", value: "banner-style" },
    ],
  },
  {
    id: "bcat-motif",
    key: "CENTRAL MOTIF",
    label: "Central Motif",
    slot: "[CENTRAL MOTIF]",
    kind: "text",
    defaultLabel: "random",
    options: [
      { label: "random", value: "random" },
      { label: "roaring lion head", value: "roaring lion head" },
      { label: "soaring eagle", value: "soaring eagle" },
      { label: "wolf head", value: "wolf head" },
      { label: "phoenix rising", value: "phoenix rising" },
      { label: "charging bull", value: "charging bull" },
      { label: "rearing stallion", value: "rearing stallion" },
      { label: "coiled serpent", value: "coiled serpent" },
      { label: "kraken", value: "kraken" },
      { label: "thunderbird", value: "thunderbird" },
      { label: "grizzly bear", value: "grizzly bear" },
      { label: "diving falcon", value: "diving falcon" },
      { label: "stag with antlers", value: "stag with antlers" },
      { label: "lightning bolt", value: "lightning bolt" },
      { label: "flaming comet", value: "flaming comet" },
      { label: "mountain peak", value: "mountain peak" },
      { label: "cresting ocean wave", value: "cresting ocean wave" },
      { label: "anchor", value: "anchor" },
      { label: "trident", value: "trident" },
      { label: "crossed swords", value: "crossed swords" },
      { label: "knight's helmet", value: "knight's helmet" },
      { label: "fortress tower", value: "fortress tower" },
      { label: "royal crown", value: "royal crown" },
      { label: "ancient oak tree", value: "ancient oak tree" },
      { label: "compass rose", value: "compass rose" },
    ],
  },
  {
    id: "bcat-primary",
    key: "PRIMARY COLOR",
    label: "Primary Colour",
    slot: "[PRIMARY COLOR]",
    kind: "color",
    defaultLabel: "matte black",
    options: COLOR_OPTIONS,
  },
  {
    id: "bcat-secondary",
    key: "SECONDARY COLOR",
    label: "Secondary Colour",
    slot: "[SECONDARY COLOR]",
    kind: "color",
    defaultLabel: "ivory white",
    options: COLOR_OPTIONS,
  },
  {
    id: "bcat-accent",
    key: "ACCENT COLOR",
    label: "Accent Colour",
    slot: "[ACCENT COLOR]",
    kind: "color",
    defaultLabel: "gold",
    options: COLOR_OPTIONS,
  },
];

export const DEFAULT_BADGE_LIBRARY: BadgeLibrary = {
  version: 1,
  basePromptTemplate: DEFAULT_BADGE_TEMPLATE,
  categories: RAW_CATEGORIES.map(finalize),
};

/* -------------------------------------------------------------------------- */
/*  Team name                                                                 */
/* -------------------------------------------------------------------------- */

/** Sport-neutral club names for the team-name dice. */
export const TEAM_NAME_POOL: string[] = [
  "Coastal Surge",
  "Iron Valley",
  "Northwind",
  "Granite City",
  "Solaris United",
  "Tidal Athletic",
  "Crimson Peak",
  "Vortex",
  "Highland Rangers",
  "Echo Bay",
  "Phoenix Rise",
  "Storm Harbor",
  "Vanguard",
  "Summit",
  "Riverside Royals",
  "Apex Dynamo",
];
