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
