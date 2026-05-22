export type FeatureOption = {
  id: string;
  label: string;
  value: string;
};

export type FeatureCategory = {
  id: string;
  key: string;
  label: string;
  slot: string;
  required: boolean;
  allowNone: boolean;
  options: FeatureOption[];
};

export type PortraitLibrary = {
  version: number;
  basePromptTemplate: string;
  categories: FeatureCategory[];
};

export type SelectionMap = Record<string, string | null>;

// Per-category lock state. A locked category keeps its current selection when
// the user randomizes or clears. Keyed by category id, so every current and
// future feature category supports locking with no extra wiring.
export type LockMap = Record<string, boolean>;
