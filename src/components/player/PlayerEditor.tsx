"use client";

import { useMemo } from "react";
import { computeOverall } from "@/lib/player-forge/rating";
import { STAT_KEYS } from "@/lib/player-forge/types";
import type { Player, StatGroup, StatKey } from "@/lib/player-forge/types";
import type { PlayerForgeStore } from "@/lib/player-forge/store";
import { BioEditor } from "./BioEditor";
import { StatGroupPanel } from "./StatGroupPanel";
import { PotentialPanel } from "./PotentialPanel";
import { ArchetypePanel } from "./ArchetypePanel";
import { OverallPill } from "./OverallPill";
import { PositionBadge } from "./PositionBadge";

type Props = {
  player: Player;
  store: PlayerForgeStore;
};

const GROUPS: StatGroup[] = ["skill", "technical", "physical", "mental"];

export function PlayerEditor({ player, store }: Props) {
  const overall = useMemo(
    () => computeOverall(player.stats, player.position),
    [player.stats, player.position]
  );
  const potential = useMemo(
    () => computeOverall(player.potentialStats, player.position),
    [player.potentialStats, player.position]
  );

  const onSetStat = (key: StatKey, value: number) => store.setStat(player.id, key, value);
  const onRandomStat = (key: StatKey) => store.randomizeStat(player.id, key);
  const onRandomGroup = (group: StatGroup) => {
    for (const k of STAT_KEYS[group] as readonly StatKey[]) {
      store.randomizeStat(player.id, k);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* — player header — quick summary, big OVR, action row — */}
      <header
        className="card px-4 py-3 flex flex-wrap items-center gap-4"
        style={{ borderColor: "var(--color-line)" }}
      >
        <OverallPill value={overall} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-[20px] font-semibold tracking-tight truncate max-w-[24ch]">
              {player.player_name || "Unnamed Player"}
            </h2>
            <PositionBadge position={player.position} size="md" />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
            <span className="font-mono text-[11.5px] text-fg-dim tab-fig">
              {player.age}yo · {player.height}cm · #{player.jersey_number}
            </span>
            <span className="text-[11.5px] text-fg-dim">{player.country}</span>
            <span
              className="font-mono text-[10.5px] text-fg-faint tab-fig"
              title="Potential overall (computed from per-stat potentials)"
            >
              pot {potential}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto sm:ml-auto">
          <button
            type="button"
            onClick={() => store.randomizeAllStats(player.id)}
            className="btn btn-secondary !py-1.5 text-[12px]"
            title="±5 jitter on every stat"
          >
            ±5 all stats
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm("Replace stats with a fresh position-based roll? This loses your current numbers.")) {
                store.freshRoll(player.id);
              }
            }}
            className="btn btn-ghost !py-1.5 text-[12px]"
            title="Wipe stats and roll a new baseline for the current position"
          >
            fresh roll
          </button>
          <button
            type="button"
            onClick={() => store.duplicatePlayer(player.id)}
            className="btn btn-ghost !py-1.5 text-[12px]"
          >
            duplicate
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Remove ${player.player_name}?`)) store.removePlayer(player.id);
            }}
            className="btn btn-ghost !py-1.5 text-[12px] text-fg-dim hover:text-fg"
          >
            remove
          </button>
        </div>
      </header>

      {/* — bio — */}
      <BioEditor player={player} store={store} />

      {/* — stats grid — */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {GROUPS.map((g) => (
          <StatGroupPanel
            key={g}
            group={g}
            player={player}
            onSetStat={onSetStat}
            onRandomStat={onRandomStat}
            onRandomGroup={() => onRandomGroup(g)}
          />
        ))}
      </div>

      {/* — potential — */}
      <PotentialPanel player={player} store={store} />

      {/* — archetypes — */}
      <ArchetypePanel player={player} store={store} />
    </div>
  );
}
