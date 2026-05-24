"use client";

import { useState } from "react";
import { POSITIONS } from "@/lib/player-forge/constants";
import type { Position } from "@/lib/player-forge/types";
import type { PlayerForgeStore } from "@/lib/player-forge/store";

type Props = { store: PlayerForgeStore };

const QUOTA_PER_TEAM: Record<Position, number> = {
  "Outside Hitter": 2,
  "Middle Blocker": 2,
  "Opposite Hitter": 1,
  Setter: 1,
  Libero: 1,
};

export function BatchAddBar({ store }: Props) {
  const [position, setPosition] = useState<Position | "any">("any");
  const [count, setCount] = useState(1);
  const [randomize, setRandomize] = useState(true);
  const [teams, setTeams] = useState(8);

  return (
    <section
      className="card p-3"
      style={{ borderColor: "var(--color-line)" }}
    >
      <div className="flex flex-wrap items-end gap-2.5">
        {/* — single add — */}
        <div className="flex items-end gap-1.5">
          <button
            type="button"
            onClick={() => store.addPlayer({ position: position === "any" ? undefined : position })}
            className="btn btn-primary !py-1.5 text-[12.5px]"
            title="Add a new player at default stats"
          >
            + new player
          </button>
        </div>

        <div className="hidden md:block w-px h-7 self-center" style={{ background: "var(--color-line)" }} />

        {/* — batch add — */}
        <Field label="Position">
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as Position | "any")}
            className="field-input !py-1.5 text-[12px]"
            style={{ minWidth: "8.5rem" }}
          >
            <option value="any">any (random)</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Count">
          <input
            type="number"
            min={1}
            max={200}
            value={count}
            onChange={(e) =>
              setCount(Math.max(1, Math.min(200, Math.round(Number(e.target.value) || 1))))
            }
            className="field-input !py-1.5 text-[12px] w-[4.5rem] text-center font-mono tab-fig"
          />
        </Field>

        <label
          className="flex items-center gap-1.5 text-[11.5px] text-fg-muted cursor-pointer pb-2"
          title="Roll fresh stats for each player instead of position starter values"
        >
          <input
            type="checkbox"
            checked={randomize}
            onChange={(e) => setRandomize(e.target.checked)}
          />
          fresh-roll stats
        </label>

        <button
          type="button"
          onClick={() =>
            store.addManyPlayers(count, {
              position: position === "any" ? undefined : position,
              randomize,
            })
          }
          className="btn btn-secondary !py-1.5 text-[12.5px]"
        >
          + batch add
        </button>

        <div className="hidden md:block w-px h-7 self-center" style={{ background: "var(--color-line)" }} />

        {/* — pool generator — */}
        <Field label="Teams">
          <input
            type="number"
            min={1}
            max={32}
            value={teams}
            onChange={(e) =>
              setTeams(Math.max(1, Math.min(32, Math.round(Number(e.target.value) || 1))))
            }
            className="field-input !py-1.5 text-[12px] w-[4rem] text-center font-mono tab-fig"
          />
        </Field>
        <button
          type="button"
          onClick={() => {
            for (const pos of POSITIONS) {
              store.addManyPlayers(QUOTA_PER_TEAM[pos] * teams, {
                position: pos,
                randomize: true,
              });
            }
          }}
          className="btn btn-secondary !py-1.5 text-[12.5px]"
          title="Seed enough players to cover N teams (2 OH / 2 MB / 1 OPP / 1 S / 1 L per team)"
        >
          + draft pool (×{teams})
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              if (
                store.state.players.length > 0 &&
                !confirm(`Clear all ${store.state.players.length} players?`)
              ) {
                return;
              }
              store.clearPlayers();
            }}
            className="btn btn-ghost !py-1.5 text-[11.5px] text-fg-dim hover:text-fg"
            title="Clear roster"
          >
            clear
          </button>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="field-label !text-[10px] !mb-1">{label}</span>
      {children}
    </div>
  );
}
