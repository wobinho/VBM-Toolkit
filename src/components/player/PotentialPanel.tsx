"use client";

import { useEffect, useMemo, useState } from "react";
import { computeOverall } from "@/lib/player-forge/rating";
import { STAT_GROUP_META, POTENTIAL_TIER_META, statLabel } from "@/lib/player-forge/constants";
import { STAT_KEYS } from "@/lib/player-forge/types";
import type { Player, PotentialTier, StatGroup, StatKey } from "@/lib/player-forge/types";
import type { PlayerForgeStore } from "@/lib/player-forge/store";

type Props = {
  player: Player;
  store: PlayerForgeStore;
};

const GROUPS: StatGroup[] = ["skill", "technical", "physical", "mental"];

export function PotentialPanel({ player, store }: Props) {
  const [open, setOpen] = useState(true);

  const potOverall = useMemo(
    () => computeOverall(player.potentialStats, player.position),
    [player.potentialStats, player.position]
  );

  const tierMeta = POTENTIAL_TIER_META[player.potentialTier];

  return (
    <section
      className="card overflow-hidden"
      style={{ borderColor: "var(--color-line)" }}
    >
      {/* — header — */}
      <header
        className="flex flex-wrap items-center gap-3 px-4 py-3 border-b"
        style={{ borderColor: "var(--color-line)" }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-left flex-1 min-w-0"
          aria-expanded={open}
        >
          <ChevronIcon open={open} />
          <span className="font-display text-[14px] font-semibold tracking-tight">
            Potential
          </span>
          <span className="font-mono text-[10.5px] text-fg-faint">
            per-stat ceilings · exports as single OVR
          </span>
        </button>

        {/* POT overall badge */}
        <PotBadge value={potOverall} />

        {/* Tier picker */}
        <div className="flex items-center gap-1">
          {([1, 2, 3, 4, 5] as PotentialTier[]).map((t) => {
            const m = POTENTIAL_TIER_META[t];
            const active = player.potentialTier === t;
            return (
              <button
                key={t}
                type="button"
                title={`Tier ${t} · ${m.label} (${m.targetMin}–${m.targetMax} POT)`}
                onClick={() => store.setPotentialTier(player.id, t)}
                className="px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors"
                style={{
                  background: active ? `${m.accent}22` : "transparent",
                  color: active ? m.accent : "var(--color-fg-muted)",
                  border: `1px solid ${active ? `${m.accent}55` : "transparent"}`,
                }}
              >
                T{t}
              </button>
            );
          })}
          <span
            className="ml-1 text-[11px] font-medium"
            style={{ color: tierMeta.accent }}
          >
            {tierMeta.label}
          </span>
        </div>

        {/* Regenerate button */}
        <button
          type="button"
          onClick={() => store.randomizePotential(player.id)}
          className="btn btn-secondary !py-1.5 text-[12px]"
          title={`Regenerate all per-stat potentials from Tier ${player.potentialTier} (${tierMeta.label})`}
        >
          regenerate
        </button>
      </header>

      {open && (
        <div className="px-4 py-4">
          {/* Tier description */}
          <p className="text-[11.5px] text-fg-dim mb-4">
            <span style={{ color: tierMeta.accent }} className="font-semibold">
              Tier {player.potentialTier} · {tierMeta.label}
            </span>
            {" "}— target potential overall {tierMeta.targetMin}–{tierMeta.targetMax}.
            Each stat's ceiling is adjusted for position. Sliders are clamped so
            potential never falls below the player's current stat.
          </p>

          {/* 4 stat groups in 2-col grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {GROUPS.map((g) => (
              <PotentialGroupPanel
                key={g}
                group={g}
                player={player}
                store={store}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  PotentialGroupPanel                                                        */
/* -------------------------------------------------------------------------- */

function PotentialGroupPanel({
  group,
  player,
  store,
}: {
  group: StatGroup;
  player: Player;
  store: PlayerForgeStore;
}) {
  const meta = STAT_GROUP_META[group];
  const keys = STAT_KEYS[group] as readonly StatKey[];

  const groupAvg = Math.round(
    keys.reduce((sum, k) => sum + player.potentialStats[k], 0) / keys.length
  );

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{ border: "1px solid var(--color-line)" }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: "var(--color-line)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: meta.accent }}
            aria-hidden
          />
          <span className="font-display text-[13px] font-semibold tracking-tight">
            {meta.label}
          </span>
        </div>
        <span className="font-mono text-[11px] text-fg-dim tab-fig">
          avg <span className="text-fg">{groupAvg}</span>
        </span>
      </div>

      <div className="px-3 py-1">
        {keys.map((k) => (
          <PotentialStatRow
            key={k}
            statKey={k}
            potValue={player.potentialStats[k]}
            currentValue={player.stats[k]}
            accent={meta.accent}
            onChange={(v) => store.setPotentialStat(player.id, k, v)}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  PotentialStatRow                                                           */
/* -------------------------------------------------------------------------- */

function PotentialStatRow({
  statKey,
  potValue,
  currentValue,
  accent,
  onChange,
}: {
  statKey: StatKey;
  potValue: number;
  currentValue: number;
  accent: string;
  onChange: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(potValue));
  useEffect(() => setDraft(String(potValue)), [potValue]);

  const commit = (raw: string) => {
    const n = Math.round(Number(raw));
    if (!Number.isFinite(n)) { setDraft(String(potValue)); return; }
    const clamped = Math.max(currentValue, Math.min(100, n));
    setDraft(String(clamped));
    if (clamped !== potValue) onChange(clamped);
  };

  const gap = potValue - currentValue;

  return (
    <div className="grid grid-cols-[minmax(0,7rem)_1fr_auto_auto] items-center gap-2.5 py-1.5">
      <label
        className="text-[12px] font-medium text-fg-muted truncate"
        title={statLabel(statKey)}
      >
        {statLabel(statKey)}
      </label>

      <input
        type="range"
        min={currentValue}
        max={100}
        step={1}
        value={potValue}
        onChange={(e) => onChange(Number(e.target.value))}
        className="stat-slider"
        style={
          {
            ["--track-fill" as string]: currentValue >= 100
              ? "100%"
              : `${((potValue - currentValue) / (100 - currentValue)) * 100}%`,
            ["--track-color" as string]: accent,
          } as React.CSSProperties
        }
        aria-label={`${statLabel(statKey)} potential`}
      />

      <input
        type="number"
        min={currentValue}
        max={100}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
        }}
        className="field-input !py-1 !px-2 w-[3.4rem] text-center font-mono tab-fig text-[12.5px]"
      />

      {/* Gap annotation — how far above current the potential ceiling is */}
      <span
        className="font-mono text-[10.5px] w-[2.8rem] text-right tab-fig"
        style={{ color: gap > 0 ? accent : "var(--color-fg-faint)" }}
        title={`${gap > 0 ? "+" : ""}${gap} above current (${currentValue})`}
      >
        {gap > 0 ? `+${gap}` : "—"}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  POT badge                                                                  */
/* -------------------------------------------------------------------------- */

function PotBadge({ value }: { value: number }) {
  const color =
    value >= 86
      ? "#e5c96a"
      : value >= 75
        ? "#7fa8cc"
        : value >= 65
          ? "#a3c69a"
          : value >= 55
            ? "#9c9c98"
            : "#6b7a8a";

  return (
    <div
      className="flex flex-col items-center justify-center rounded-md font-display font-semibold tab-fig leading-none w-12 h-9"
      style={{
        color,
        background: `${color}15`,
        border: `1px solid ${color}55`,
      }}
      title={`Potential overall: ${value}`}
    >
      <span className="text-[8px] font-mono leading-none opacity-60 tracking-wide">POT</span>
      <span className="text-[15px] leading-tight">{value}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ChevronIcon                                                                */
/* -------------------------------------------------------------------------- */

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .12s", flexShrink: 0 }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
