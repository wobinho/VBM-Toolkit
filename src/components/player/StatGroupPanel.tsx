"use client";

import { STAT_GROUP_META } from "@/lib/player-forge/constants";
import { groupAverage } from "@/lib/player-forge/rating";
import { STAT_KEYS } from "@/lib/player-forge/types";
import type { Player, StatGroup, StatKey } from "@/lib/player-forge/types";
import { POSITION_SKILL_WEIGHTS } from "@/lib/player-forge/constants";
import { StatRow } from "./StatRow";

type Props = {
  group: StatGroup;
  player: Player;
  onSetStat: (key: StatKey, value: number) => void;
  onRandomStat: (key: StatKey) => void;
  onRandomGroup: () => void;
};

export function StatGroupPanel({
  group,
  player,
  onSetStat,
  onRandomStat,
  onRandomGroup,
}: Props) {
  const meta = STAT_GROUP_META[group];
  const keys = STAT_KEYS[group] as readonly StatKey[];
  const avg = Math.round(groupAverage(player.stats, group));

  // Position-relevant skills get emphasized — only meaningful for the "skill" group.
  const positionRelevant =
    group === "skill"
      ? new Set(
          Object.entries(POSITION_SKILL_WEIGHTS[player.position])
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([k]) => k as StatKey)
        )
      : null;

  return (
    <section
      className="card overflow-hidden"
      style={{ borderColor: "var(--color-line)" }}
    >
      <header
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--color-line)" }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: meta.accent }}
            aria-hidden
          />
          <h3 className="font-display text-[14px] font-semibold tracking-tight">
            {meta.label}
          </h3>
          <span className="font-mono text-[10.5px] text-fg-faint tab-fig">
            {keys.length} stats
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-fg-dim tab-fig">
            avg <span className="text-fg">{avg}</span>
          </span>
          <button
            type="button"
            className="btn btn-ghost !px-2 !py-1 text-[11px]"
            onClick={onRandomGroup}
            title="Randomize all stats in this group (±5)"
          >
            roll group
          </button>
        </div>
      </header>

      <div className="px-3 py-2">
        {keys.map((k) => (
          <StatRow
            key={k}
            statKey={k}
            value={player.stats[k]}
            accent={meta.accent}
            emphasized={positionRelevant?.has(k) ?? false}
            onChange={(v) => onSetStat(k, v)}
            onRandomize={() => onRandomStat(k)}
          />
        ))}
      </div>
    </section>
  );
}
