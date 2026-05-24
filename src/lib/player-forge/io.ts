/**
 * JSON import / export. Output shape exactly matches
 * `custom-players-template.json` (object with a flat `players` array) so the
 * in-game importer accepts it without translation. Input is lenient — accepts
 * either the wrapped shape or a bare array, ignores unknown fields, and
 * coerces numbers when it can.
 */

import { POSITIONS } from "./constants";
import { blankStats, clampStat, computeOverall } from "./rating";
import { generatePotentialStats } from "./randomization";
import type { Player, Position, PotentialTier, StatBlock, StatKey } from "./types";

/** Flatten a Player to the on-disk shape — stats hoisted to top-level keys,
 *  local `id`, `archetypeId`, and per-stat potential block dropped.
 *  The exported `potential` is the position-weighted overall of potentialStats,
 *  which is the single integer the game importer accepts. */
function flattenPlayer(p: Player): Record<string, unknown> {
  return {
    player_name: p.player_name,
    position: p.position,
    age: p.age,
    country: p.country,
    jersey_number: p.jersey_number,
    height: p.height,
    potential: computeOverall(p.potentialStats, p.position),
    contract_years: p.contract_years,
    monthly_wage: p.monthly_wage,
    player_value: p.player_value,
    ...p.stats,
  };
}

export function buildExport(players: Player[]): string {
  const body = {
    $schema: "volleyball-manager/custom-players@1",
    players: players.map(flattenPlayer),
  };
  return JSON.stringify(body, null, 2);
}

/** Quota & coverage check — mirrors the template note: 7 players per team
 *  (2 OH, 2 MB, 1 OPP, 1 S, 1 L). Returns the max number of teams the pool can
 *  fill, plus which position is the bottleneck. */
export function quotaSummary(players: Player[]): {
  byPosition: Record<Position, number>;
  teamsCovered: number;
  bottleneck: Position | null;
} {
  const byPosition: Record<Position, number> = {
    "Outside Hitter": 0,
    "Middle Blocker": 0,
    "Opposite Hitter": 0,
    Setter: 0,
    Libero: 0,
  };
  for (const p of players) byPosition[p.position]++;
  const need: Record<Position, number> = {
    "Outside Hitter": 2,
    "Middle Blocker": 2,
    "Opposite Hitter": 1,
    Setter: 1,
    Libero: 1,
  };
  let teamsCovered = Infinity;
  let bottleneck: Position | null = null;
  for (const pos of POSITIONS) {
    const t = Math.floor(byPosition[pos] / need[pos]);
    if (t < teamsCovered) {
      teamsCovered = t;
      bottleneck = pos;
    }
  }
  return {
    byPosition,
    teamsCovered: Number.isFinite(teamsCovered) ? teamsCovered : 0,
    bottleneck,
  };
}

/** Parse JSON text into Players. Throws a friendly Error on malformed input. */
export function parseImport(text: string): Player[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error(
      `Couldn't read JSON — ${e instanceof Error ? e.message : "unknown parser error"}`
    );
  }

  let arr: unknown[];
  if (Array.isArray(parsed)) {
    arr = parsed;
  } else if (parsed && typeof parsed === "object" && Array.isArray((parsed as { players?: unknown }).players)) {
    arr = (parsed as { players: unknown[] }).players;
  } else {
    throw new Error(
      'Expected an array of players, or an object with a "players" array.'
    );
  }

  const out: Player[] = [];
  arr.forEach((raw, i) => {
    if (!raw || typeof raw !== "object") return;
    const r = raw as Record<string, unknown>;
    if (typeof r.player_name !== "string") return;
    if (typeof r.position !== "string" || !POSITIONS.includes(r.position as Position)) return;

    const stats = blankStats();
    for (const k of Object.keys(stats) as StatKey[]) {
      const v = r[k];
      if (typeof v === "number") stats[k] = clampStat(v);
    }

    const position = r.position as Position;
    const legacyPot = clampRange(r.potential, 1, 99, 80);
    const potentialTier: PotentialTier =
      legacyPot >= 86 ? 1 : legacyPot >= 75 ? 2 : legacyPot >= 65 ? 3 : legacyPot >= 55 ? 4 : 5;

    out.push({
      id: `imp-${i}-${Math.random().toString(36).slice(2, 7)}`,
      player_name: r.player_name as string,
      position,
      age: clampRange(r.age, 14, 60, 22),
      country: typeof r.country === "string" ? r.country : "Italy",
      jersey_number: clampRange(r.jersey_number, 1, 99, 1),
      height: clampRange(r.height, 140, 230, 190),
      potentialTier,
      potentialStats: generatePotentialStats(stats, position, potentialTier),
      contract_years: clampRange(r.contract_years, 1, 10, 2),
      monthly_wage: nonNegInt(r.monthly_wage, 0),
      player_value: nonNegInt(r.player_value, 0),
      stats,
      archetypeId: null,
    } satisfies Player);
  });

  if (out.length === 0) {
    throw new Error("No valid players found — check the schema / required fields.");
  }
  return out;
}

function clampRange(v: unknown, min: number, max: number, fallback: number): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function nonNegInt(v: unknown, fallback: number): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, n);
}

/** Trigger a browser download of the export JSON. */
export function downloadJSON(filename: string, content: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Best-effort clipboard write — returns true on success. */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
