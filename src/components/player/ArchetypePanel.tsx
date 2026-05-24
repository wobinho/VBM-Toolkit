"use client";

import { useMemo, useState } from "react";
import { POSITIONS } from "@/lib/player-forge/constants";
import { computeOverall } from "@/lib/player-forge/rating";
import type {
  Archetype,
  ArchetypeTier,
  Player,
  Position,
} from "@/lib/player-forge/types";
import type { PlayerForgeStore } from "@/lib/player-forge/store";
import { PositionBadge } from "./PositionBadge";
import { OverallPill } from "./OverallPill";

type Props = {
  player: Player;
  store: PlayerForgeStore;
};

const TIER_LABELS: Record<ArchetypeTier, string> = {
  1: "Tier 1 · Elite",
  2: "Tier 2 · Star",
  3: "Tier 3 · Starter",
  4: "Tier 4 · Squad",
  5: "Tier 5 · Filler",
};

export function ArchetypePanel({ player, store }: Props) {
  const { state, saveArchetypeFromPlayer, applyArchetypeToPlayer, removeArchetype } = store;

  // Save-form state
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");
  const [tier, setTier] = useState<ArchetypeTier>(3);
  const [jitter, setJitter] = useState(false);

  // Filter: show all positions by default, with a quick pivot to the current one.
  const [filterPos, setFilterPos] = useState<Position | "all">(player.position);

  const liveOverall = useMemo(
    () => computeOverall(player.stats, player.position),
    [player.stats, player.position]
  );

  const archetypes = state.archetypes
    .filter((a) => filterPos === "all" || a.position === filterPos)
    .sort((a, b) => a.tier - b.tier || b.overall - a.overall);

  const handleSave = () => {
    saveArchetypeFromPlayer(player.id, name, tier);
    setName("");
    setSaveOpen(false);
  };

  return (
    <section
      className="card overflow-hidden"
      style={{ borderColor: "var(--color-line)" }}
    >
      <header
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--color-line)" }}
      >
        <div className="flex items-center gap-2.5">
          <h3 className="font-display text-[14px] font-semibold tracking-tight">
            Archetypes
          </h3>
          <span className="font-mono text-[10.5px] text-fg-faint">
            {state.archetypes.length} saved
          </span>
        </div>

        <button
          type="button"
          onClick={() => setSaveOpen((v) => !v)}
          className="btn btn-secondary !px-2.5 !py-1 text-[11.5px]"
          title="Save current stats as an archetype"
        >
          {saveOpen ? "cancel" : "+ save current"}
        </button>
      </header>

      {saveOpen && (
        <div
          className="px-4 py-3 border-b grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2"
          style={{
            borderColor: "var(--color-line)",
            background: "var(--color-surface-2)",
          }}
        >
          <input
            type="text"
            placeholder={`e.g. Defensive ${player.position}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field-input !py-1.5 text-[12.5px]"
          />
          <select
            value={tier}
            onChange={(e) => setTier(Number(e.target.value) as ArchetypeTier)}
            className="field-input !py-1.5 text-[12.5px]"
            style={{ minWidth: "9rem" }}
          >
            {[1, 2, 3, 4, 5].map((t) => (
              <option key={t} value={t}>
                {TIER_LABELS[t as ArchetypeTier]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary !py-1.5 text-[12.5px]"
          >
            save
          </button>
          <div className="sm:col-span-3 text-[11px] text-fg-dim flex items-center gap-2">
            <PositionBadge position={player.position} />
            <span>
              Position locked to <span className="text-fg-muted">{player.position}</span> · overall snapshot{" "}
              <span className="font-mono tab-fig text-fg">{liveOverall}</span>
            </span>
          </div>
        </div>
      )}

      {/* — filter strip — */}
      <div
        className="px-3 py-2 flex flex-wrap items-center gap-1 border-b"
        style={{ borderColor: "var(--color-line)" }}
      >
        <FilterChip
          active={filterPos === "all"}
          onClick={() => setFilterPos("all")}
          label="all"
        />
        {POSITIONS.map((p) => (
          <FilterChip
            key={p}
            active={filterPos === p}
            onClick={() => setFilterPos(p)}
            label={p}
            highlight={p === player.position}
          />
        ))}
        <label className="ml-auto flex items-center gap-1.5 text-[11px] text-fg-dim cursor-pointer">
          <input
            type="checkbox"
            checked={jitter}
            onChange={(e) => setJitter(e.target.checked)}
          />
          apply with ±5 jitter
        </label>
      </div>

      {/* — list — */}
      <div className="max-h-[26rem] overflow-auto scrollbar-thin">
        {archetypes.length === 0 ? (
          <EmptyArchetypes filterPos={filterPos} />
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--color-line)" }}>
            {archetypes.map((a) => (
              <li
                key={a.id}
                className="px-3 py-2.5 grid grid-cols-[auto_1fr_auto] items-center gap-3"
                style={{
                  background:
                    player.archetypeId === a.id
                      ? "rgba(127,168,204,0.07)"
                      : "transparent",
                }}
              >
                <OverallPill value={a.overall} size="sm" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium truncate" title={a.name}>
                      {a.name}
                    </span>
                    {player.archetypeId === a.id && (
                      <span className="text-[10px] uppercase tracking-[0.12em] text-accent-strong">
                        applied
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <PositionBadge position={a.position} />
                    <span className="font-mono text-[10.5px] text-fg-dim">
                      {TIER_LABELS[a.tier]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="btn btn-secondary !px-2 !py-1 text-[11px]"
                    onClick={() =>
                      applyArchetypeToPlayer(player.id, a.id, {
                        jitter: jitter ? 5 : 0,
                      })
                    }
                    title="Load these stats into the current player"
                  >
                    apply
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => {
                      if (confirm(`Delete archetype "${a.name}"?`)) removeArchetype(a.id);
                    }}
                    title="Delete archetype"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  highlight,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2 py-1 text-[11px] font-mono rounded transition-colors"
      style={{
        background: active ? "rgba(127,168,204,0.18)" : "transparent",
        color: active
          ? "var(--color-accent-strong)"
          : highlight
            ? "var(--color-fg)"
            : "var(--color-fg-dim)",
        border: `1px solid ${active ? "rgba(127,168,204,0.32)" : "var(--color-line)"}`,
      }}
    >
      {label === "all" ? "all" : label.split(" ").map((w) => w[0]).join("")}
    </button>
  );
}

function EmptyArchetypes({ filterPos }: { filterPos: Position | "all" }) {
  return (
    <div className="px-4 py-8 text-center">
      <p className="text-[12.5px] text-fg-muted">
        {filterPos === "all"
          ? "No archetypes saved yet."
          : `No ${filterPos} archetypes saved.`}
      </p>
      <p className="mt-1 text-[11.5px] text-fg-dim leading-relaxed max-w-[36ch] mx-auto">
        Tune a player's stats, then{" "}
        <span className="text-fg">save current</span> to capture them as a tier
        you can reapply to other players.
      </p>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}
