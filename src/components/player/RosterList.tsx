"use client";

import { useMemo, useState } from "react";
import { POSITIONS } from "@/lib/player-forge/constants";
import { computeOverall } from "@/lib/player-forge/rating";
import type { Player, Position } from "@/lib/player-forge/types";
import type { PlayerForgeStore } from "@/lib/player-forge/store";
import { PositionBadge } from "./PositionBadge";
import { OverallPill } from "./OverallPill";

type Props = { store: PlayerForgeStore };

type Filter = Position | "all";

export function RosterList({ store }: Props) {
  const { state, selectPlayer, duplicatePlayer, removePlayer } = store;
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.players.filter((p) => {
      if (filter !== "all" && p.position !== filter) return false;
      if (q && !p.player_name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [state.players, filter, query]);

  const counts = useMemo(() => {
    const c: Record<Position, number> = {
      "Outside Hitter": 0,
      "Middle Blocker": 0,
      "Opposite Hitter": 0,
      Setter: 0,
      Libero: 0,
    };
    for (const p of state.players) c[p.position]++;
    return c;
  }, [state.players]);

  return (
    <aside
      className="card overflow-hidden flex flex-col"
      style={{ borderColor: "var(--color-line)", maxHeight: "calc(100vh - 220px)" }}
    >
      <header
        className="px-3 py-2.5 border-b flex items-center justify-between"
        style={{ borderColor: "var(--color-line)" }}
      >
        <div className="flex items-baseline gap-2">
          <h3 className="font-display text-[13.5px] font-semibold tracking-tight">
            Roster
          </h3>
          <span className="font-mono text-[10.5px] text-fg-faint tab-fig">
            {state.players.length} player{state.players.length === 1 ? "" : "s"}
          </span>
        </div>
      </header>

      <div className="px-3 py-2 border-b" style={{ borderColor: "var(--color-line)" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
          className="field-input !py-1.5 !text-[12px]"
        />
        <div className="mt-2 flex flex-wrap gap-1">
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>
            <span>all</span>
            <span className="font-mono tab-fig text-fg-faint ml-1">
              {state.players.length}
            </span>
          </Chip>
          {POSITIONS.map((p) => (
            <Chip key={p} active={filter === p} onClick={() => setFilter(p)} title={p}>
              <PositionBadge position={p} />
              <span className="font-mono tab-fig text-fg-faint ml-0.5">
                {counts[p]}
              </span>
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <EmptyRoster />
        ) : (
          <ul>
            {filtered.map((p) => (
              <RosterRow
                key={p.id}
                player={p}
                selected={state.selectedPlayerId === p.id}
                onSelect={() => selectPlayer(p.id)}
                onDuplicate={() => duplicatePlayer(p.id)}
                onRemove={() => {
                  if (confirm(`Remove ${p.player_name}?`)) removePlayer(p.id);
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function RosterRow({
  player,
  selected,
  onSelect,
  onDuplicate,
  onRemove,
}: {
  player: Player;
  selected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const overall = computeOverall(player.stats, player.position);
  return (
    <li>
      <div
        onClick={onSelect}
        className="group grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2 cursor-pointer transition-colors"
        style={{
          background: selected ? "rgba(127,168,204,0.10)" : "transparent",
          borderLeft: `2px solid ${selected ? "var(--color-accent)" : "transparent"}`,
        }}
      >
        <OverallPill value={overall} size="sm" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[12.5px] font-medium truncate"
              style={{ color: selected ? "var(--color-fg)" : "var(--color-fg-muted)" }}
              title={player.player_name}
            >
              {player.player_name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <PositionBadge position={player.position} />
            <span className="font-mono text-[10.5px] text-fg-dim tab-fig">
              {player.age}yo · {player.height}cm · #{player.jersey_number}
            </span>
          </div>
        </div>
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            title="Duplicate player"
          >
            <CopyIcon />
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            title="Remove player"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </li>
  );
}

function Chip({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="inline-flex items-center gap-1.5 px-1.5 py-1 text-[11px] rounded transition-colors"
      style={{
        background: active ? "rgba(127,168,204,0.16)" : "var(--color-surface-2)",
        color: active ? "var(--color-accent-strong)" : "var(--color-fg-muted)",
        border: `1px solid ${active ? "rgba(127,168,204,0.30)" : "var(--color-line)"}`,
      }}
    >
      {children}
    </button>
  );
}

function EmptyRoster() {
  return (
    <div className="px-4 py-8 text-center">
      <p className="text-[12.5px] text-fg-muted">No players in the roster yet.</p>
      <p className="mt-1 text-[11.5px] text-fg-dim leading-relaxed max-w-[28ch] mx-auto">
        Add one from the toolbar, or use <span className="text-fg">batch</span>{" "}
        to seed a full draft pool.
      </p>
    </div>
  );
}

function CopyIcon() {
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
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
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
