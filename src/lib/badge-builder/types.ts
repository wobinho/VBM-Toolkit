/**
 * Badge Builder data model — a slot-based prompt builder. Mirrors the Portrait
 * Studio's category/option architecture so both tools behave the same way:
 * every field is a category, every category carries a library of options, and
 * each is independently selectable, lockable and randomizable.
 */

/** A "color" category renders swatches in the Library and Compose views;
 *  a "text" category is a plain dropdown. */
export type BadgeCategoryKind = "text" | "color";

export type BadgeOption = {
  id: string;
  /** Display label — shown in the dropdown and library editor. */
  label: string;
  /** Prompt fragment swapped into the slot. */
  value: string;
  /** Hex colour — present only on color-kind options, drives the UI swatch. */
  swatch?: string;
};

export type BadgeCategory = {
  id: string;
  key: string;
  /** Human label, e.g. "Badge Shape". */
  label: string;
  /** Token replaced in the template, e.g. "[BADGE SHAPE]". */
  slot: string;
  kind: BadgeCategoryKind;
  /** Option selected when the tool first opens / on Reset. */
  defaultOptionId: string;
  options: BadgeOption[];
};

export type BadgeLibrary = {
  version: number;
  /** Base prompt — [SLOT] tokens are swapped for the selected option values. */
  basePromptTemplate: string;
  categories: BadgeCategory[];
};

/** Selected option id, keyed by category id. */
export type BadgeSelectionMap = Record<string, string | null>;

/** Locked categories are frozen during Randomize and Reset. */
export type BadgeLockMap = Record<string, boolean>;

/** Team name is optional — woven into the prompt only when enabled. */
export type TeamNameState = {
  enabled: boolean;
  value: string;
};

/** A colour the user picked and kept — their personal swatch strip. */
export type SavedColor = {
  id: string;
  /** Canonical #rrggbb. */
  hex: string;
};

/** A saved primary / secondary / accent combination. */
export type SavedPalette = {
  id: string;
  name: string;
  /** Canonical #rrggbb for each role. */
  primary: string;
  secondary: string;
  accent: string;
};

/** Per-category custom hex, keyed by category id. When set for a colour
 *  category it overrides the option selection — this is how a colour picked
 *  from the picker (rather than a preset) is held. */
export type CustomColorMap = Record<string, string>;

export type BadgeState = {
  version: number;
  library: BadgeLibrary;
  selection: BadgeSelectionMap;
  locks: BadgeLockMap;
  teamName: TeamNameState;
  /** Custom hexes overriding the selection for colour categories. */
  customColors: CustomColorMap;
  /** The user's saved custom colours. */
  savedColors: SavedColor[];
  /** The user's saved three-colour palettes. */
  savedPalettes: SavedPalette[];
};
