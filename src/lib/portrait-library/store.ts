"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_LIBRARY } from "./default-library";
import type { FeatureCategory, FeatureOption, LockMap, PortraitLibrary, SelectionMap } from "./types";

// Bumped to v2 — v1 stored option IDs generated with Math.random() at module
// load, which broke selection→option mapping across reloads. v2 uses
// deterministic IDs derived from category key + option label.
const STORAGE_KEY = "vbm-toolkit:portrait-library:v2";
const SELECTION_KEY = "vbm-toolkit:portrait-selection:v2";
const LOCKS_KEY = "vbm-toolkit:portrait-locks:v2";

const uid = (prefix = "id") => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

function safeLoad<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSave(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or privacy mode — ignore */
  }
}

export function useLibrary() {
  const [library, setLibrary] = useState<PortraitLibrary>(DEFAULT_LIBRARY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLibrary(safeLoad<PortraitLibrary>(STORAGE_KEY, DEFAULT_LIBRARY));
    setHydrated(true);
  }, []);

  // Persist after hydration only — avoids overwriting saved data with the SSR default.
  const firstSave = useRef(true);
  useEffect(() => {
    if (!hydrated) return;
    if (firstSave.current) {
      firstSave.current = false;
      return;
    }
    safeSave(STORAGE_KEY, library);
  }, [library, hydrated]);

  const setBaseTemplate = useCallback((tpl: string) => {
    setLibrary((l) => ({ ...l, basePromptTemplate: tpl }));
  }, []);

  const addCategory = useCallback((draft: Omit<FeatureCategory, "id" | "options"> & { options?: FeatureOption[] }) => {
    setLibrary((l) => ({
      ...l,
      categories: [
        ...l.categories,
        {
          ...draft,
          id: uid("cat"),
          options: draft.options ?? [],
        },
      ],
    }));
  }, []);

  const updateCategory = useCallback((id: string, patch: Partial<Omit<FeatureCategory, "id" | "options">>) => {
    setLibrary((l) => ({
      ...l,
      categories: l.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const removeCategory = useCallback((id: string) => {
    setLibrary((l) => ({ ...l, categories: l.categories.filter((c) => c.id !== id) }));
  }, []);

  const moveCategory = useCallback((id: string, dir: -1 | 1) => {
    setLibrary((l) => {
      const idx = l.categories.findIndex((c) => c.id === id);
      if (idx < 0) return l;
      const target = idx + dir;
      if (target < 0 || target >= l.categories.length) return l;
      const next = [...l.categories];
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...l, categories: next };
    });
  }, []);

  const addOption = useCallback((categoryId: string, label: string, value: string) => {
    setLibrary((l) => ({
      ...l,
      categories: l.categories.map((c) =>
        c.id === categoryId
          ? { ...c, options: [...c.options, { id: uid("opt"), label, value }] }
          : c
      ),
    }));
  }, []);

  const updateOption = useCallback((categoryId: string, optionId: string, patch: Partial<Omit<FeatureOption, "id">>) => {
    setLibrary((l) => ({
      ...l,
      categories: l.categories.map((c) =>
        c.id === categoryId
          ? { ...c, options: c.options.map((o) => (o.id === optionId ? { ...o, ...patch } : o)) }
          : c
      ),
    }));
  }, []);

  const removeOption = useCallback((categoryId: string, optionId: string) => {
    setLibrary((l) => ({
      ...l,
      categories: l.categories.map((c) =>
        c.id === categoryId ? { ...c, options: c.options.filter((o) => o.id !== optionId) } : c
      ),
    }));
  }, []);

  const resetLibrary = useCallback(() => {
    setLibrary(DEFAULT_LIBRARY);
  }, []);

  const importLibrary = useCallback((next: PortraitLibrary) => {
    setLibrary(next);
  }, []);

  return {
    library,
    hydrated,
    setBaseTemplate,
    addCategory,
    updateCategory,
    removeCategory,
    moveCategory,
    addOption,
    updateOption,
    removeOption,
    resetLibrary,
    importLibrary,
  };
}

export function useSelection(categories: FeatureCategory[]) {
  const [selection, setSelection] = useState<SelectionMap>({});
  const [locks, setLocks] = useState<LockMap>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSelection(safeLoad<SelectionMap>(SELECTION_KEY, {}));
    setLocks(safeLoad<LockMap>(LOCKS_KEY, {}));
    setHydrated(true);
  }, []);

  const firstSave = useRef(true);
  useEffect(() => {
    if (!hydrated) return;
    if (firstSave.current) {
      firstSave.current = false;
      return;
    }
    safeSave(SELECTION_KEY, selection);
  }, [selection, hydrated]);

  const firstLockSave = useRef(true);
  useEffect(() => {
    if (!hydrated) return;
    if (firstLockSave.current) {
      firstLockSave.current = false;
      return;
    }
    safeSave(LOCKS_KEY, locks);
  }, [locks, hydrated]);

  // Prune selections for categories or options that no longer exist.
  useEffect(() => {
    if (!hydrated) return;
    setSelection((prev) => {
      let changed = false;
      const next: SelectionMap = {};
      for (const cat of categories) {
        const cur = prev[cat.id];
        if (cur && cat.options.some((o) => o.id === cur)) {
          next[cat.id] = cur;
        } else if (cur) {
          changed = true;
        }
      }
      // Detect removed keys
      for (const k of Object.keys(prev)) {
        if (!(k in next)) changed = true;
      }
      return changed ? next : prev;
    });
  }, [categories, hydrated]);

  // Prune locks for categories that no longer exist.
  useEffect(() => {
    if (!hydrated) return;
    setLocks((prev) => {
      const next: LockMap = {};
      for (const cat of categories) {
        if (prev[cat.id]) next[cat.id] = true;
      }
      const changed = Object.keys(prev).length !== Object.keys(next).length;
      return changed ? next : prev;
    });
  }, [categories, hydrated]);

  const select = useCallback((categoryId: string, optionId: string | null) => {
    setSelection((s) => ({ ...s, [categoryId]: optionId }));
  }, []);

  const toggleLock = useCallback((categoryId: string) => {
    setLocks((l) => {
      const next = { ...l };
      if (next[categoryId]) delete next[categoryId];
      else next[categoryId] = true;
      return next;
    });
  }, []);

  // Clear unlocked selections; locked categories keep their current value.
  const clear = useCallback(() => {
    setSelection((prev) => {
      const next: SelectionMap = {};
      for (const id of Object.keys(prev)) {
        if (locks[id]) next[id] = prev[id];
      }
      return next;
    });
  }, [locks]);

  const randomize = useCallback(() => {
    setSelection((prev) => {
      const next: SelectionMap = {};
      for (const cat of categories) {
        // Locked categories are frozen — keep whatever is currently selected.
        if (locks[cat.id]) {
          next[cat.id] = prev[cat.id] ?? null;
          continue;
        }
        if (cat.options.length === 0) {
          next[cat.id] = null;
          continue;
        }
        // If "allowNone" and not required, there is a chance of skipping.
        if (cat.allowNone && !cat.required && Math.random() < 0.15) {
          next[cat.id] = null;
          continue;
        }
        const pick = cat.options[Math.floor(Math.random() * cat.options.length)];
        next[cat.id] = pick.id;
      }
      return next;
    });
  }, [categories, locks]);

  const randomizeOne = useCallback(
    (categoryId: string) => {
      if (locks[categoryId]) return;
      const cat = categories.find((c) => c.id === categoryId);
      if (!cat || cat.options.length === 0) return;
      setSelection((prev) => {
        const current = prev[categoryId] ?? null;
        // If more than one option exists, exclude the current pick so re-rolls
        // always produce a fresh value.
        const pool =
          cat.options.length > 1
            ? cat.options.filter((o) => o.id !== current)
            : cat.options;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        return { ...prev, [categoryId]: pick.id };
      });
    },
    [categories, locks]
  );

  return { selection, locks, hydrated, select, toggleLock, clear, randomize, randomizeOne };
}

export function assemblePrompt(
  library: PortraitLibrary,
  selection: SelectionMap
): { prompt: string; missing: string[] } {
  const missing: string[] = [];
  let out = library.basePromptTemplate;

  for (const cat of library.categories) {
    const optId = selection[cat.id];
    const opt = cat.options.find((o) => o.id === optId);
    const value = opt?.value ?? "";
    if (!value && cat.required) missing.push(cat.label);

    const slot = cat.slot;
    // Replace all instances of the slot token in the template.
    const safeSlot = slot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(safeSlot, "g"), value);
  }

  // Tidy up: collapse repeated whitespace, dangling commas, etc.
  out = out
    .replace(/\s+,/g, ",")
    .replace(/,\s*,+/g, ",")
    .replace(/\(\s*,/g, "(")
    .replace(/,\s*\)/g, ")")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\./g, ".")
    .replace(/\.\s*\./g, ".")
    .trim();

  return { prompt: out, missing };
}
