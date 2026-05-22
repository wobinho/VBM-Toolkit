"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_BADGE_LIBRARY,
  DEFAULT_BADGE_TEMPLATE,
  TEAM_NAME_POOL,
} from "./presets";
import { describeColor, normalizeHex } from "./color";
import type {
  BadgeCategory,
  BadgeLibrary,
  BadgeOption,
  BadgeSelectionMap,
  BadgeState,
  CustomColorMap,
  SavedColor,
  SavedPalette,
} from "./types";

const STORAGE_KEY = "vbm-toolkit:badge-builder:v2";

const uid = (prefix = "bopt") =>
  `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

const pick = <T,>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

/** The three colour categories, in prompt order. */
export const COLOR_CATEGORY_IDS = [
  "bcat-primary",
  "bcat-secondary",
  "bcat-accent",
] as const;

/* -------------------------------------------------------------------------- */
/*  Default state                                                             */
/* -------------------------------------------------------------------------- */

function buildDefaultSelection(library: BadgeLibrary): BadgeSelectionMap {
  const sel: BadgeSelectionMap = {};
  for (const cat of library.categories) sel[cat.id] = cat.defaultOptionId;
  return sel;
}

export const DEFAULT_BADGE_STATE: BadgeState = {
  version: 1,
  library: DEFAULT_BADGE_LIBRARY,
  selection: buildDefaultSelection(DEFAULT_BADGE_LIBRARY),
  locks: {},
  teamName: { enabled: false, value: "" },
  customColors: {},
  savedColors: [],
  savedPalettes: [],
};

/* -------------------------------------------------------------------------- */
/*  Persistence                                                               */
/* -------------------------------------------------------------------------- */

/** Coerce anything loaded from storage back into a known-good shape. */
function normalize(raw: unknown): BadgeState {
  if (!raw || typeof raw !== "object") return DEFAULT_BADGE_STATE;
  const r = raw as Partial<BadgeState>;

  const lib = r.library;
  const validLib =
    lib &&
    typeof lib === "object" &&
    Array.isArray((lib as BadgeLibrary).categories) &&
    (lib as BadgeLibrary).categories.length > 0;

  const library: BadgeLibrary = validLib
    ? {
        version: 1,
        basePromptTemplate:
          typeof (lib as BadgeLibrary).basePromptTemplate === "string"
            ? (lib as BadgeLibrary).basePromptTemplate
            : DEFAULT_BADGE_TEMPLATE,
        categories: (lib as BadgeLibrary).categories,
      }
    : DEFAULT_BADGE_LIBRARY;

  // Selection — keep valid picks, fall back to each category's default.
  const savedSel = (r.selection ?? {}) as BadgeSelectionMap;
  const selection: BadgeSelectionMap = {};
  for (const cat of library.categories) {
    const cur = savedSel[cat.id];
    selection[cat.id] =
      cur && cat.options.some((o) => o.id === cur) ? cur : cat.defaultOptionId;
  }

  // Locks — drop any that point at removed categories.
  const savedLocks = (r.locks ?? {}) as Record<string, boolean>;
  const locks: Record<string, boolean> = {};
  for (const cat of library.categories) {
    if (savedLocks[cat.id]) locks[cat.id] = true;
  }

  const tn = r.teamName;
  const teamName =
    tn && typeof tn === "object"
      ? {
          enabled: !!(tn as BadgeState["teamName"]).enabled,
          value: String((tn as BadgeState["teamName"]).value ?? ""),
        }
      : { enabled: false, value: "" };

  // Custom colours — keep only valid hexes pointing at real categories.
  const customColors: CustomColorMap = {};
  const savedCustom = r.customColors;
  if (savedCustom && typeof savedCustom === "object") {
    for (const cat of library.categories) {
      const v = (savedCustom as Record<string, unknown>)[cat.id];
      if (typeof v === "string") {
        const n = normalizeHex(v);
        if (n) customColors[cat.id] = n;
      }
    }
  }

  // Saved colours — drop anything that isn't a valid hex.
  const savedColors: SavedColor[] = Array.isArray(r.savedColors)
    ? (r.savedColors as unknown[])
        .map((c): SavedColor | null => {
          if (!c || typeof c !== "object") return null;
          const o = c as Partial<SavedColor>;
          const hex = normalizeHex(String(o.hex ?? ""));
          if (!hex) return null;
          return { id: String(o.id ?? uid("col")), hex };
        })
        .filter((c): c is SavedColor => c !== null)
    : [];

  // Saved palettes — require three valid hexes.
  const savedPalettes: SavedPalette[] = Array.isArray(r.savedPalettes)
    ? (r.savedPalettes as unknown[])
        .map((p): SavedPalette | null => {
          if (!p || typeof p !== "object") return null;
          const o = p as Partial<SavedPalette>;
          const primary = normalizeHex(String(o.primary ?? ""));
          const secondary = normalizeHex(String(o.secondary ?? ""));
          const accent = normalizeHex(String(o.accent ?? ""));
          if (!primary || !secondary || !accent) return null;
          return {
            id: String(o.id ?? uid("pal")),
            name: String(o.name ?? "Palette"),
            primary,
            secondary,
            accent,
          };
        })
        .filter((p): p is SavedPalette => p !== null)
    : [];

  return {
    version: 1,
    library,
    selection,
    locks,
    teamName,
    customColors,
    savedColors,
    savedPalettes,
  };
}

function safeLoad(): BadgeState {
  if (typeof window === "undefined") return DEFAULT_BADGE_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BADGE_STATE;
    return normalize(JSON.parse(raw));
  } catch {
    return DEFAULT_BADGE_STATE;
  }
}

function safeSave(state: BadgeState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota or privacy mode — ignore */
  }
}

/* -------------------------------------------------------------------------- */
/*  Hook                                                                      */
/* -------------------------------------------------------------------------- */

export function useBadgeStudio() {
  const [state, setState] = useState<BadgeState>(DEFAULT_BADGE_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(safeLoad());
    setHydrated(true);
  }, []);

  // Persist after hydration only — never overwrite saved data with the SSR
  // default on first render.
  const firstSave = useRef(true);
  useEffect(() => {
    if (!hydrated) return;
    if (firstSave.current) {
      firstSave.current = false;
      return;
    }
    safeSave(state);
  }, [state, hydrated]);

  /* — compose actions — */

  /** Select a library option. For colour categories this also clears any
   *  custom-picked hex, so the chosen preset takes over. */
  const select = useCallback((categoryId: string, optionId: string) => {
    setState((s) => {
      const customColors = { ...s.customColors };
      delete customColors[categoryId];
      return {
        ...s,
        selection: { ...s.selection, [categoryId]: optionId },
        customColors,
      };
    });
  }, []);

  /** Set a custom hex on a colour category — overrides the preset selection. */
  const setCustomColor = useCallback((categoryId: string, hex: string) => {
    const norm = normalizeHex(hex);
    if (!norm) return;
    setState((s) => ({
      ...s,
      customColors: { ...s.customColors, [categoryId]: norm },
    }));
  }, []);

  const toggleLock = useCallback((categoryId: string) => {
    setState((s) => {
      const locks = { ...s.locks };
      if (locks[categoryId]) delete locks[categoryId];
      else locks[categoryId] = true;
      return { ...s, locks };
    });
  }, []);

  const randomizeAll = useCallback(() => {
    setState((s) => {
      const selection: BadgeSelectionMap = { ...s.selection };
      const customColors = { ...s.customColors };
      for (const cat of s.library.categories) {
        if (s.locks[cat.id] || cat.options.length === 0) continue;
        selection[cat.id] = pick(cat.options).id;
        delete customColors[cat.id];
      }
      return { ...s, selection, customColors };
    });
  }, []);

  const randomizeOne = useCallback((categoryId: string) => {
    setState((s) => {
      if (s.locks[categoryId]) return s;
      const cat = s.library.categories.find((c) => c.id === categoryId);
      if (!cat || cat.options.length === 0) return s;
      const current = s.selection[categoryId];
      // Exclude the current pick so a re-roll always changes something.
      const pool =
        cat.options.length > 1
          ? cat.options.filter((o) => o.id !== current)
          : cat.options;
      const customColors = { ...s.customColors };
      delete customColors[categoryId];
      return {
        ...s,
        selection: { ...s.selection, [categoryId]: pick(pool).id },
        customColors,
      };
    });
  }, []);

  /** Re-roll primary, secondary, and accent — locked slots are left unchanged. */
  const randomizeColors = useCallback(() => {
    setState((s) => {
      const selection: BadgeSelectionMap = { ...s.selection };
      const customColors = { ...s.customColors };
      for (const catId of COLOR_CATEGORY_IDS) {
        if (s.locks[catId]) continue;
        const cat = s.library.categories.find((c) => c.id === catId);
        if (!cat || cat.options.length === 0) continue;
        const current = selection[catId];
        const pool =
          cat.options.length > 1
            ? cat.options.filter((o) => o.id !== current)
            : cat.options;
        selection[catId] = pick(pool).id;
        delete customColors[catId];
      }
      return { ...s, selection, customColors };
    });
  }, []);

  /** Restore default selections — locked categories keep their current pick. */
  const resetSelection = useCallback(() => {
    setState((s) => {
      const selection: BadgeSelectionMap = { ...s.selection };
      const customColors = { ...s.customColors };
      for (const cat of s.library.categories) {
        if (s.locks[cat.id]) continue;
        selection[cat.id] = cat.defaultOptionId;
        delete customColors[cat.id];
      }
      return { ...s, selection, customColors };
    });
  }, []);

  /* — saved colours — */

  /** Keep a colour in the personal swatch strip. No-op if already saved. */
  const saveColor = useCallback((hex: string) => {
    const norm = normalizeHex(hex);
    if (!norm) return;
    setState((s) => {
      if (s.savedColors.some((c) => c.hex === norm)) return s;
      return {
        ...s,
        savedColors: [...s.savedColors, { id: uid("col"), hex: norm }],
      };
    });
  }, []);

  const deleteSavedColor = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      savedColors: s.savedColors.filter((c) => c.id !== id),
    }));
  }, []);

  /* — saved palettes — */

  /** Save the current primary / secondary / accent colours as a palette. */
  const savePalette = useCallback((name: string) => {
    setState((s) => {
      const hexOf = (catId: string): string => {
        const cat = s.library.categories.find((c) => c.id === catId);
        const opt = cat ? effectiveOption(s, cat) : null;
        return normalizeHex(opt?.swatch ?? "") ?? "#000000";
      };
      const trimmed = name.trim();
      const palette: SavedPalette = {
        id: uid("pal"),
        name: trimmed || `Palette ${s.savedPalettes.length + 1}`,
        primary: hexOf("bcat-primary"),
        secondary: hexOf("bcat-secondary"),
        accent: hexOf("bcat-accent"),
      };
      return { ...s, savedPalettes: [...s.savedPalettes, palette] };
    });
  }, []);

  const deleteSavedPalette = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      savedPalettes: s.savedPalettes.filter((p) => p.id !== id),
    }));
  }, []);

  /** Apply a saved palette to the three colour categories. */
  const loadPalette = useCallback((id: string) => {
    setState((s) => {
      const p = s.savedPalettes.find((x) => x.id === id);
      if (!p) return s;
      return {
        ...s,
        customColors: {
          ...s.customColors,
          "bcat-primary": p.primary,
          "bcat-secondary": p.secondary,
          "bcat-accent": p.accent,
        },
      };
    });
  }, []);

  /* — team name — */

  const setTeamName = useCallback((value: string) => {
    setState((s) => ({ ...s, teamName: { ...s.teamName, value } }));
  }, []);

  const toggleTeamName = useCallback(() => {
    setState((s) => {
      const enabled = !s.teamName.enabled;
      // Enabling with an empty field rolls a name so the prompt is never blank.
      const value =
        enabled && !s.teamName.value.trim()
          ? pick(TEAM_NAME_POOL)
          : s.teamName.value;
      return { ...s, teamName: { enabled, value } };
    });
  }, []);

  const rollTeamName = useCallback(() => {
    setState((s) => {
      const pool = TEAM_NAME_POOL.filter((n) => n !== s.teamName.value);
      return {
        ...s,
        teamName: { enabled: true, value: pick(pool) },
      };
    });
  }, []);

  /* — library editing — */

  const addOption = useCallback(
    (
      categoryId: string,
      draft: { label: string; value: string; swatch?: string }
    ) => {
      setState((s) => ({
        ...s,
        library: {
          ...s.library,
          categories: s.library.categories.map((c) =>
            c.id === categoryId
              ? {
                  ...c,
                  options: [
                    ...c.options,
                    {
                      id: uid(),
                      label: draft.label,
                      value: draft.value,
                      ...(draft.swatch ? { swatch: draft.swatch } : {}),
                    },
                  ],
                }
              : c
          ),
        },
      }));
    },
    []
  );

  const addOptions = useCallback(
    (
      categoryId: string,
      drafts: Array<{ label: string; value: string; swatch?: string }>
    ) => {
      setState((s) => {
        const category = s.library.categories.find((c) => c.id === categoryId);
        if (!category) return s;

        const existingLabels = new Set(
          category.options.map((o) => o.label.toLowerCase().trim())
        );
        const existingValues = new Set(
          category.options.map((o) => o.value.toLowerCase().trim())
        );

        const newOptions: BadgeOption[] = [];
        for (const draft of drafts) {
          const label = draft.label.trim();
          const value = draft.value.trim();
          if (!label || !value) continue;

          const lLower = label.toLowerCase();
          const vLower = value.toLowerCase();

          if (!existingLabels.has(lLower) && !existingValues.has(vLower)) {
            newOptions.push({
              id: uid(),
              label,
              value,
              ...(draft.swatch ? { swatch: draft.swatch.trim() } : {}),
            });
            existingLabels.add(lLower);
            existingValues.add(vLower);
          }
        }

        if (newOptions.length === 0) return s;

        return {
          ...s,
          library: {
            ...s.library,
            categories: s.library.categories.map((c) =>
              c.id === categoryId
                ? {
                    ...c,
                    options: [...c.options, ...newOptions],
                  }
                : c
            ),
          },
        };
      });
    },
    []
  );

  /** Add colours to primary, secondary, and accent libraries in one step. */
  const addColorOptions = useCallback(
    (drafts: Array<{ label: string; value: string; swatch?: string }>) => {
      setState((s) => {
        const colorCats = s.library.categories.filter(
          (c) => c.kind === "color" && COLOR_CATEGORY_IDS.includes(c.id as (typeof COLOR_CATEGORY_IDS)[number])
        );
        if (colorCats.length === 0) return s;

        const perCatNew = new Map<string, BadgeOption[]>();
        for (const cat of colorCats) {
          const existingLabels = new Set(
            cat.options.map((o) => o.label.toLowerCase().trim())
          );
          const existingValues = new Set(
            cat.options.map((o) => o.value.toLowerCase().trim())
          );
          const batchLabels = new Set<string>();
          const batchValues = new Set<string>();
          const newOptions: BadgeOption[] = [];

          for (const draft of drafts) {
            const label = draft.label.trim();
            const value = (draft.value || label).trim();
            if (!label || !value) continue;

            const lLower = label.toLowerCase();
            const vLower = value.toLowerCase();

            if (
              existingLabels.has(lLower) ||
              existingValues.has(vLower) ||
              batchLabels.has(lLower) ||
              batchValues.has(vLower)
            ) {
              continue;
            }

            newOptions.push({
              id: uid(),
              label,
              value,
              ...(draft.swatch ? { swatch: draft.swatch.trim() } : {}),
            });
            batchLabels.add(lLower);
            batchValues.add(vLower);
          }

          if (newOptions.length > 0) perCatNew.set(cat.id, newOptions);
        }

        if (perCatNew.size === 0) return s;

        return {
          ...s,
          library: {
            ...s.library,
            categories: s.library.categories.map((c) => {
              const added = perCatNew.get(c.id);
              return added ? { ...c, options: [...c.options, ...added] } : c;
            }),
          },
        };
      });
    },
    []
  );

  const updateOption = useCallback(
    (
      categoryId: string,
      optionId: string,
      patch: Partial<Omit<BadgeOption, "id">>
    ) => {
      setState((s) => ({
        ...s,
        library: {
          ...s.library,
          categories: s.library.categories.map((c) =>
            c.id === categoryId
              ? {
                  ...c,
                  options: c.options.map((o) =>
                    o.id === optionId ? { ...o, ...patch } : o
                  ),
                }
              : c
          ),
        },
      }));
    },
    []
  );

  const removeOption = useCallback((categoryId: string, optionId: string) => {
    setState((s) => {
      const categories = s.library.categories.map((c) =>
        c.id === categoryId
          ? { ...c, options: c.options.filter((o) => o.id !== optionId) }
          : c
      );
      // If the removed option was selected, fall back to a still-valid pick.
      const selection = { ...s.selection };
      if (selection[categoryId] === optionId) {
        const cat = categories.find((c) => c.id === categoryId);
        const fallback =
          cat?.options.find((o) => o.id === cat.defaultOptionId)?.id ??
          cat?.options[0]?.id ??
          null;
        selection[categoryId] = fallback;
      }
      return { ...s, library: { ...s.library, categories }, selection };
    });
  }, []);

  const setTemplate = useCallback((basePromptTemplate: string) => {
    setState((s) => ({
      ...s,
      library: { ...s.library, basePromptTemplate },
    }));
  }, []);

  const resetTemplate = useCallback(() => {
    setState((s) => ({
      ...s,
      library: { ...s.library, basePromptTemplate: DEFAULT_BADGE_TEMPLATE },
    }));
  }, []);

  /** Restore the whole library — categories, options and template — and reset
   *  selections/locks/custom colours to factory defaults. Saved colours and
   *  palettes are the user's own data and are kept. */
  const resetLibrary = useCallback(() => {
    setState((s) => ({
      ...s,
      library: DEFAULT_BADGE_LIBRARY,
      selection: buildDefaultSelection(DEFAULT_BADGE_LIBRARY),
      locks: {},
      customColors: {},
    }));
  }, []);

  return {
    state,
    hydrated,
    select,
    setCustomColor,
    toggleLock,
    randomizeAll,
    randomizeOne,
    randomizeColors,
    resetSelection,
    saveColor,
    deleteSavedColor,
    savePalette,
    deleteSavedPalette,
    loadPalette,
    setTeamName,
    toggleTeamName,
    rollTeamName,
    addOption,
    addOptions,
    addColorOptions,
    updateOption,
    removeOption,
    setTemplate,
    resetTemplate,
    resetLibrary,
  };
}

/* -------------------------------------------------------------------------- */
/*  Pure helpers                                                              */
/* -------------------------------------------------------------------------- */

/** The option currently selected in a category, or null. */
export function selectedOption(
  category: BadgeCategory,
  selection: BadgeSelectionMap
): BadgeOption | null {
  const id = selection[category.id];
  return category.options.find((o) => o.id === id) ?? null;
}

/**
 * Resolve a category to its effective option. For a colour category with a
 * custom-picked hex this returns a synthetic option carrying that hex and a
 * descriptive name; otherwise it falls back to the library selection.
 */
export function effectiveOption(
  state: BadgeState,
  category: BadgeCategory
): BadgeOption | null {
  if (category.kind === "color") {
    const custom = state.customColors[category.id];
    if (custom) {
      const name = describeColor(custom);
      return {
        id: `custom:${custom}`,
        label: name,
        // The prompt fragment names the colour and pins the exact hex.
        value: `${name} (${custom})`,
        swatch: custom,
      };
    }
  }
  return selectedOption(category, state.selection);
}

/** Resolve the five core categories to their effective options — used by the
 *  crest preview. Falls back gracefully if a category was renamed/removed. */
export function resolveBadge(state: BadgeState) {
  const get = (id: string): BadgeOption | null => {
    const cat = state.library.categories.find((c) => c.id === id);
    return cat ? effectiveOption(state, cat) : null;
  };
  return {
    shape: get("bcat-shape"),
    motif: get("bcat-motif"),
    primary: get("bcat-primary"),
    secondary: get("bcat-secondary"),
    accent: get("bcat-accent"),
  };
}

/**
 * Swap each [SLOT] in the template for its effective option value, weave in the
 * optional team name, then tidy stray whitespace and commas.
 */
export function assembleBadgePrompt(state: BadgeState): {
  prompt: string;
  missing: string[];
} {
  const { library, teamName } = state;
  let out = library.basePromptTemplate;
  const missing: string[] = [];

  for (const cat of library.categories) {
    const opt = effectiveOption(state, cat);
    const value = opt?.value ?? "";
    if (!value) missing.push(cat.label);
    const safeSlot = cat.slot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(safeSlot, "g"), value);
  }

  // Weave the team name in only when enabled and non-empty.
  const name = teamName.value.trim();
  if (teamName.enabled && name) {
    const phrase = "badge, for a sports team";
    if (out.includes(phrase)) {
      out = out.replace(phrase, `badge for ${name}, a sports team`);
    } else if (/\bbadge\b/.test(out)) {
      out = out.replace(/\bbadge\b/, `badge for ${name}`);
    } else {
      out = `${out}, team name ${name}`;
    }
  }

  out = out
    .replace(/\s+,/g, ",")
    .replace(/,\s*,+/g, ",")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\./g, ".")
    .trim();

  return { prompt: out, missing };
}
