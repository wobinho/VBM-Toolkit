"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { POSITIONS, AGE_BUCKETS, HEIGHT_BUCKETS, COUNTRIES } from "./constants";
import {
  blankStats,
  clampStat,
  computeOverall,
  starterStatsForPosition,
} from "./rating";
import {
  freshRollStats,
  generatePotentialStats,
  jitterStat,
  jitterStats,
  randomAge,
  randomCountry,
  randomHeight,
  randomJersey,
  randomPosition,
  suggestEconForOverall,
} from "./randomization";
import { randomNameFor } from "./names";
import type {
  Archetype,
  ArchetypeTier,
  Player,
  PlayerForgeState,
  Position,
  PotentialTier,
  StatBlock,
  StatKey,
} from "./types";

const STORAGE_KEY = "vbm-toolkit:player-forge:v1";

const uid = (prefix = "p") =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

/* -------------------------------------------------------------------------- */
/*  Defaults                                                                  */
/* -------------------------------------------------------------------------- */

export function newPlayer(position: Position = "Outside Hitter"): Player {
  const stats = starterStatsForPosition(position);
  const overall = computeOverall(stats, position);
  const econ = suggestEconForOverall(overall);
  const country = "Italy";
  const potentialTier = econ.potentialTier;
  const potentialStats = generatePotentialStats(stats, position, potentialTier);
  return {
    id: uid(),
    player_name: randomNameFor(country),
    position,
    age: 22,
    country,
    jersey_number: 7,
    height: 195,
    potentialTier,
    potentialStats,
    contract_years: econ.contract_years,
    monthly_wage: econ.monthly_wage,
    player_value: econ.player_value,
    stats,
    archetypeId: null,
  };
}

const DEFAULT_STATE: PlayerForgeState = {
  version: 1,
  players: [],
  archetypes: [],
  selectedPlayerId: null,
  buckets: { age: "21-25", height: "any" },
};

/* -------------------------------------------------------------------------- */
/*  Persistence                                                               */
/* -------------------------------------------------------------------------- */

function normalizeStats(raw: unknown): StatBlock {
  const base = blankStats();
  if (!raw || typeof raw !== "object") return base;
  for (const k of Object.keys(base) as StatKey[]) {
    const v = (raw as Record<string, unknown>)[k];
    if (typeof v === "number") base[k] = clampStat(v);
  }
  return base;
}

function normalizePlayer(raw: unknown): Player | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<Player> & { stats?: unknown; potential?: unknown; potentialStats?: unknown };
  const position = POSITIONS.includes(r.position as Position)
    ? (r.position as Position)
    : "Outside Hitter";
  const stats = normalizeStats(r.stats);

  // Derive potential tier — prefer stored tier, fall back to migrating the
  // legacy single-number "potential" field.
  const rawTier = Number(r.potentialTier);
  let potentialTier: PotentialTier;
  if ([1, 2, 3, 4, 5].includes(rawTier)) {
    potentialTier = rawTier as PotentialTier;
  } else {
    const legacyPot = Math.max(1, Math.min(99, Math.round(Number(r.potential) || 75)));
    potentialTier =
      legacyPot >= 86 ? 1 : legacyPot >= 75 ? 2 : legacyPot >= 65 ? 3 : legacyPot >= 55 ? 4 : 5;
  }

  // Normalize or generate per-stat potentials.
  let potentialStats: StatBlock;
  if (r.potentialStats && typeof r.potentialStats === "object") {
    potentialStats = normalizeStats(r.potentialStats);
    // Enforce invariant: potential >= current stat.
    for (const k of Object.keys(stats) as StatKey[]) {
      if (potentialStats[k] < stats[k]) potentialStats[k] = stats[k];
    }
  } else {
    potentialStats = generatePotentialStats(stats, position, potentialTier);
  }

  return {
    id: typeof r.id === "string" ? r.id : uid(),
    player_name: String(r.player_name ?? "Unnamed Player"),
    position,
    age: Math.max(14, Math.min(60, Math.round(Number(r.age) || 22))),
    country: typeof r.country === "string" ? r.country : "Italy",
    jersey_number: Math.max(1, Math.min(99, Math.round(Number(r.jersey_number) || 1))),
    height: Math.max(140, Math.min(230, Math.round(Number(r.height) || 190))),
    potentialTier,
    potentialStats,
    contract_years: Math.max(1, Math.min(10, Math.round(Number(r.contract_years) || 2))),
    monthly_wage: Math.max(0, Math.round(Number(r.monthly_wage) || 0)),
    player_value: Math.max(0, Math.round(Number(r.player_value) || 0)),
    stats,
    archetypeId: typeof r.archetypeId === "string" ? r.archetypeId : null,
  };
}

function normalizeArchetype(raw: unknown): Archetype | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<Archetype>;
  const tier = (Math.max(1, Math.min(5, Math.round(Number(r.tier) || 3))) as ArchetypeTier);
  const position = POSITIONS.includes(r.position as Position)
    ? (r.position as Position)
    : "Outside Hitter";
  const stats = normalizeStats(r.stats);
  return {
    id: typeof r.id === "string" ? r.id : uid("arc"),
    name: String(r.name ?? "Archetype"),
    position,
    tier,
    stats,
    overall:
      typeof r.overall === "number"
        ? clampStat(r.overall)
        : computeOverall(stats, position),
    createdAt: typeof r.createdAt === "number" ? r.createdAt : Date.now(),
  };
}

function normalize(raw: unknown): PlayerForgeState {
  if (!raw || typeof raw !== "object") return DEFAULT_STATE;
  const r = raw as Partial<PlayerForgeState>;
  const players = Array.isArray(r.players)
    ? (r.players.map(normalizePlayer).filter(Boolean) as Player[])
    : [];
  const archetypes = Array.isArray(r.archetypes)
    ? (r.archetypes.map(normalizeArchetype).filter(Boolean) as Archetype[])
    : [];

  const selectedPlayerId =
    typeof r.selectedPlayerId === "string" &&
    players.some((p) => p.id === r.selectedPlayerId)
      ? r.selectedPlayerId
      : players[0]?.id ?? null;

  const ageBucket = AGE_BUCKETS.find((b) => b.id === r.buckets?.age)?.id ?? "21-25";
  const heightBucket =
    HEIGHT_BUCKETS.find((b) => b.id === r.buckets?.height)?.id ?? "any";

  return {
    version: 1,
    players,
    archetypes,
    selectedPlayerId,
    buckets: { age: ageBucket, height: heightBucket },
  };
}

function safeLoad(): PlayerForgeState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return normalize(JSON.parse(raw));
  } catch {
    return DEFAULT_STATE;
  }
}

function safeSave(state: PlayerForgeState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / privacy mode */
  }
}

/* -------------------------------------------------------------------------- */
/*  Hook                                                                      */
/* -------------------------------------------------------------------------- */

export function usePlayerForge() {
  const [state, setState] = useState<PlayerForgeState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(safeLoad());
    setHydrated(true);
  }, []);

  const firstSave = useRef(true);
  useEffect(() => {
    if (!hydrated) return;
    if (firstSave.current) {
      firstSave.current = false;
      return;
    }
    safeSave(state);
  }, [state, hydrated]);

  /* — player CRUD — */

  const addPlayer = useCallback((draft?: Partial<Player>): string => {
    const id = uid();
    setState((s) => {
      const base = newPlayer(draft?.position);
      const p: Player = { ...base, ...draft, id };
      return {
        ...s,
        players: [...s.players, p],
        selectedPlayerId: id,
      };
    });
    return id;
  }, []);

  const addManyPlayers = useCallback(
    (count: number, opts?: { position?: Position; randomize?: boolean }): string[] => {
      const ids: string[] = [];
      setState((s) => {
        const created: Player[] = [];
        for (let i = 0; i < count; i++) {
          const id = uid();
          ids.push(id);
          const position = opts?.position ?? randomPosition();
          const country = randomCountry();
          const stats = opts?.randomize
            ? freshRollStats(position)
            : starterStatsForPosition(position);
          const overall = computeOverall(stats, position);
          const econ = suggestEconForOverall(overall);
          const potentialTier = econ.potentialTier;
          created.push({
            id,
            player_name: randomNameFor(country),
            position,
            age: randomAge(s.buckets.age),
            country,
            jersey_number: randomJersey(),
            height: randomHeight(s.buckets.height, position),
            potentialTier,
            potentialStats: generatePotentialStats(stats, position, potentialTier),
            contract_years: econ.contract_years,
            monthly_wage: econ.monthly_wage,
            player_value: econ.player_value,
            stats,
            archetypeId: null,
          });
        }
        return {
          ...s,
          players: [...s.players, ...created],
          selectedPlayerId: created[0]?.id ?? s.selectedPlayerId,
        };
      });
      return ids;
    },
    []
  );

  const duplicatePlayer = useCallback((id: string): string | null => {
    let newId: string | null = null;
    setState((s) => {
      const idx = s.players.findIndex((p) => p.id === id);
      if (idx === -1) return s;
      newId = uid();
      const orig = s.players[idx];
      const copy: Player = {
        ...orig,
        id: newId,
        player_name: `${orig.player_name} (copy)`,
        archetypeId: orig.archetypeId,
      };
      const players = [...s.players];
      players.splice(idx + 1, 0, copy);
      return { ...s, players, selectedPlayerId: newId };
    });
    return newId;
  }, []);

  const removePlayer = useCallback((id: string) => {
    setState((s) => {
      const players = s.players.filter((p) => p.id !== id);
      let selectedPlayerId = s.selectedPlayerId;
      if (selectedPlayerId === id) {
        const idx = s.players.findIndex((p) => p.id === id);
        selectedPlayerId = players[idx]?.id ?? players[idx - 1]?.id ?? players[0]?.id ?? null;
      }
      return { ...s, players, selectedPlayerId };
    });
  }, []);

  const clearPlayers = useCallback(() => {
    setState((s) => ({ ...s, players: [], selectedPlayerId: null }));
  }, []);

  const selectPlayer = useCallback((id: string | null) => {
    setState((s) => ({ ...s, selectedPlayerId: id }));
  }, []);

  const updatePlayer = useCallback(
    (id: string, patch: Partial<Player>) => {
      setState((s) => ({
        ...s,
        players: s.players.map((p) =>
          p.id === id
            ? {
                ...p,
                ...patch,
                stats: patch.stats ? { ...p.stats, ...patch.stats } : p.stats,
              }
            : p
        ),
      }));
    },
    []
  );

  /** Update one stat key on a player. Also bumps the matching potential stat if
   *  it would fall below the new current value (potential can never be < current). */
  const setStat = useCallback((id: string, key: StatKey, value: number) => {
    setState((s) => ({
      ...s,
      players: s.players.map((p) => {
        if (p.id !== id) return p;
        const clamped = clampStat(value);
        const potVal = p.potentialStats[key];
        return {
          ...p,
          stats: { ...p.stats, [key]: clamped },
          potentialStats: potVal < clamped
            ? { ...p.potentialStats, [key]: clamped }
            : p.potentialStats,
        };
      }),
    }));
  }, []);

  /* — per-player randomization — */

  const randomizeBio = useCallback(
    (id: string, fields: Array<"name" | "age" | "height" | "country" | "jersey" | "position">) => {
      setState((s) => ({
        ...s,
        players: s.players.map((p) => {
          if (p.id !== id) return p;
          const next: Player = { ...p };
          if (fields.includes("position")) next.position = randomPosition();
          if (fields.includes("country")) next.country = randomCountry();
          if (fields.includes("name")) next.player_name = randomNameFor(next.country);
          if (fields.includes("age")) next.age = randomAge(s.buckets.age);
          if (fields.includes("height"))
            next.height = randomHeight(s.buckets.height, next.position);
          if (fields.includes("jersey")) next.jersey_number = randomJersey();
          return next;
        }),
      }));
    },
    []
  );

  /** Randomize a single stat by ±delta. Default delta of 5 is the user's
   *  "modified randomization" — surprising but never destabilising. */
  const randomizeStat = useCallback(
    (id: string, key: StatKey, delta = 5) => {
      setState((s) => ({
        ...s,
        players: s.players.map((p) =>
          p.id === id
            ? { ...p, stats: { ...p.stats, [key]: jitterStat(p.stats[key], delta) } }
            : p
        ),
      }));
    },
    []
  );

  /** Randomize every stat with the same ±delta. */
  const randomizeAllStats = useCallback((id: string, delta = 5) => {
    setState((s) => ({
      ...s,
      players: s.players.map((p) =>
        p.id === id ? { ...p, stats: jitterStats(p.stats, delta) } : p
      ),
    }));
  }, []);

  /** Replace stats with a fresh roll for the player's position (no baseline). */
  const freshRoll = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      players: s.players.map((p) =>
        p.id === id ? { ...p, stats: freshRollStats(p.position), archetypeId: null } : p
      ),
    }));
  }, []);

  /* — potential — */

  /** Update one potential stat. Clamped to [currentStat, 100]. */
  const setPotentialStat = useCallback((id: string, key: StatKey, value: number) => {
    setState((s) => ({
      ...s,
      players: s.players.map((p) => {
        if (p.id !== id) return p;
        const minVal = p.stats[key];
        return {
          ...p,
          potentialStats: { ...p.potentialStats, [key]: clampStat(Math.max(minVal, value)) },
        };
      }),
    }));
  }, []);

  /** Change the potential tier and regenerate all per-stat potentials from it. */
  const setPotentialTier = useCallback((id: string, tier: PotentialTier) => {
    setState((s) => ({
      ...s,
      players: s.players.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          potentialTier: tier,
          potentialStats: generatePotentialStats(p.stats, p.position, tier),
        };
      }),
    }));
  }, []);

  /** Regenerate all per-stat potentials from the player's current tier. */
  const randomizePotential = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      players: s.players.map((p) =>
        p.id !== id
          ? p
          : { ...p, potentialStats: generatePotentialStats(p.stats, p.position, p.potentialTier) }
      ),
    }));
  }, []);

  /* — global randomization buckets — */

  const setAgeBucket = useCallback((age: PlayerForgeState["buckets"]["age"]) => {
    setState((s) => ({ ...s, buckets: { ...s.buckets, age } }));
  }, []);

  const setHeightBucket = useCallback(
    (height: PlayerForgeState["buckets"]["height"]) => {
      setState((s) => ({ ...s, buckets: { ...s.buckets, height } }));
    },
    []
  );

  /* — archetype CRUD — */

  /** Snapshot the current player's stats as a reusable archetype. */
  const saveArchetypeFromPlayer = useCallback(
    (playerId: string, name: string, tier: ArchetypeTier): string | null => {
      let id: string | null = null;
      setState((s) => {
        const p = s.players.find((x) => x.id === playerId);
        if (!p) return s;
        id = uid("arc");
        const arc: Archetype = {
          id,
          name: name.trim() || `${p.position} Archetype`,
          position: p.position,
          tier,
          stats: { ...p.stats },
          overall: computeOverall(p.stats, p.position),
          createdAt: Date.now(),
        };
        return {
          ...s,
          archetypes: [...s.archetypes, arc],
          players: s.players.map((x) => (x.id === playerId ? { ...x, archetypeId: id } : x)),
        };
      });
      return id;
    },
    []
  );

  const removeArchetype = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      archetypes: s.archetypes.filter((a) => a.id !== id),
      players: s.players.map((p) =>
        p.archetypeId === id ? { ...p, archetypeId: null } : p
      ),
    }));
  }, []);

  const renameArchetype = useCallback((id: string, name: string) => {
    setState((s) => ({
      ...s,
      archetypes: s.archetypes.map((a) =>
        a.id === id ? { ...a, name: name.trim() || a.name } : a
      ),
    }));
  }, []);

  /** Apply an archetype's stats to a player. Optional `keepPosition` lets you
   *  cross-apply between positions, but by default the player's position is
   *  set to the archetype's so the weights line up. */
  const applyArchetypeToPlayer = useCallback(
    (
      playerId: string,
      archetypeId: string,
      opts?: { keepPosition?: boolean; jitter?: number }
    ) => {
      setState((s) => {
        const arc = s.archetypes.find((a) => a.id === archetypeId);
        if (!arc) return s;
        return {
          ...s,
          players: s.players.map((p) => {
            if (p.id !== playerId) return p;
            const stats = opts?.jitter
              ? jitterStats(arc.stats, opts.jitter)
              : { ...arc.stats };
            return {
              ...p,
              position: opts?.keepPosition ? p.position : arc.position,
              stats,
              archetypeId: arc.id,
            };
          }),
        };
      });
    },
    []
  );

  /* — import / replace — */

  /** Wholesale replace the roster — used by JSON import. */
  const replacePlayers = useCallback((players: Player[]) => {
    setState((s) => ({
      ...s,
      players,
      selectedPlayerId: players[0]?.id ?? null,
    }));
  }, []);

  /** Append players to the existing roster — used by additive JSON import. */
  const appendPlayers = useCallback((players: Player[]) => {
    setState((s) => ({
      ...s,
      players: [...s.players, ...players],
      selectedPlayerId: s.selectedPlayerId ?? players[0]?.id ?? null,
    }));
  }, []);

  return {
    state,
    hydrated,
    // player CRUD
    addPlayer,
    addManyPlayers,
    duplicatePlayer,
    removePlayer,
    clearPlayers,
    selectPlayer,
    updatePlayer,
    setStat,
    // randomization
    randomizeBio,
    randomizeStat,
    randomizeAllStats,
    freshRoll,
    setAgeBucket,
    setHeightBucket,
    // potential
    setPotentialStat,
    setPotentialTier,
    randomizePotential,
    // archetypes
    saveArchetypeFromPlayer,
    removeArchetype,
    renameArchetype,
    applyArchetypeToPlayer,
    // import
    replacePlayers,
    appendPlayers,
  };
}

export type PlayerForgeStore = ReturnType<typeof usePlayerForge>;

/** Helpers re-exported for component-level use. */
export { COUNTRIES, POSITIONS };
