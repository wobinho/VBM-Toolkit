"use client";

import { useState } from "react";
import {
  AGE_BUCKETS,
  COUNTRIES,
  HEIGHT_BUCKETS,
  POSITIONS,
} from "@/lib/player-forge/constants";
import type { Player } from "@/lib/player-forge/types";
import type { PlayerForgeStore } from "@/lib/player-forge/store";

type Props = {
  player: Player;
  store: PlayerForgeStore;
};

export function BioEditor({ player, store }: Props) {
  const { updatePlayer, randomizeBio, setAgeBucket, setHeightBucket, state } =
    store;
  const [bucketsOpen, setBucketsOpen] = useState(false);
  const ageLabel =
    AGE_BUCKETS.find((b) => b.id === state.buckets.age)?.label ?? "";
  const heightLabel =
    HEIGHT_BUCKETS.find((b) => b.id === state.buckets.height)?.label ?? "";

  return (
    <section
      className="card overflow-hidden"
      style={{ borderColor: "var(--color-line)" }}
    >
      <header
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--color-line)" }}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-display text-[14px] font-semibold tracking-tight">
            Player Bio
          </h3>
          <span className="font-mono text-[10.5px] text-fg-faint">
            display & identity
          </span>
        </div>
        <button
          type="button"
          onClick={() =>
            randomizeBio(player.id, ["name", "age", "height", "country", "jersey"])
          }
          className="btn btn-ghost !px-2 !py-1 text-[11px]"
          title="Randomize all bio fields"
        >
          roll bio
        </button>
      </header>

      <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* — name — */}
        <Field label="Name" className="sm:col-span-2 lg:col-span-2">
          <div className="flex gap-1.5">
            <input
              type="text"
              value={player.player_name}
              onChange={(e) => updatePlayer(player.id, { player_name: e.target.value })}
              className="field-input"
              placeholder="Player name"
            />
            <RandBtn
              onClick={() => randomizeBio(player.id, ["name"])}
              title="Random name (matches country)"
            />
          </div>
        </Field>

        {/* — position — */}
        <Field label="Position">
          <div className="flex gap-1.5">
            <select
              value={player.position}
              onChange={(e) =>
                updatePlayer(player.id, { position: e.target.value as Player["position"] })
              }
              className="field-input"
            >
              {POSITIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <RandBtn onClick={() => randomizeBio(player.id, ["position"])} />
          </div>
        </Field>

        {/* — age — */}
        <Field label="Age" hint={`scope: ${ageLabel.split(" ")[0]}`}>
          <div className="flex gap-1.5">
            <input
              type="number"
              min={14}
              max={60}
              value={player.age}
              onChange={(e) =>
                updatePlayer(player.id, {
                  age: clamp(Number(e.target.value), 14, 60),
                })
              }
              className="field-input font-mono tab-fig text-center"
            />
            <RandBtn onClick={() => randomizeBio(player.id, ["age"])} title="Random age (within scope)" />
          </div>
        </Field>

        {/* — height — */}
        <Field label="Height (cm)" hint={`scope: ${heightLabel.split(" ")[0]}`}>
          <div className="flex gap-1.5">
            <input
              type="number"
              min={140}
              max={230}
              value={player.height}
              onChange={(e) =>
                updatePlayer(player.id, {
                  height: clamp(Number(e.target.value), 140, 230),
                })
              }
              className="field-input font-mono tab-fig text-center"
            />
            <RandBtn
              onClick={() => randomizeBio(player.id, ["height"])}
              title="Random height (within scope)"
            />
          </div>
        </Field>

        {/* — country — */}
        <Field label="Country">
          <div className="flex gap-1.5">
            <select
              value={player.country}
              onChange={(e) => updatePlayer(player.id, { country: e.target.value })}
              className="field-input"
            >
              {COUNTRIES.includes(player.country) ? null : (
                <option value={player.country}>{player.country}</option>
              )}
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <RandBtn onClick={() => randomizeBio(player.id, ["country"])} />
          </div>
        </Field>

        {/* — jersey — */}
        <Field label="Jersey #">
          <div className="flex gap-1.5">
            <input
              type="number"
              min={1}
              max={99}
              value={player.jersey_number}
              onChange={(e) =>
                updatePlayer(player.id, {
                  jersey_number: clamp(Number(e.target.value), 1, 99),
                })
              }
              className="field-input font-mono tab-fig text-center"
            />
            <RandBtn onClick={() => randomizeBio(player.id, ["jersey"])} />
          </div>
        </Field>

        {/* — economy row: collapsible-ish — always shown but quieter — */}
        <Field label="Contract Years">
          <input
            type="number"
            min={1}
            max={10}
            value={player.contract_years}
            onChange={(e) =>
              updatePlayer(player.id, {
                contract_years: clamp(Number(e.target.value), 1, 10),
              })
            }
            className="field-input font-mono tab-fig text-center"
          />
        </Field>
        <Field label="Monthly Wage">
          <input
            type="number"
            min={0}
            step={500}
            value={player.monthly_wage}
            onChange={(e) =>
              updatePlayer(player.id, {
                monthly_wage: Math.max(0, Math.round(Number(e.target.value) || 0)),
              })
            }
            className="field-input font-mono tab-fig text-right"
          />
        </Field>
        <Field label="Player Value">
          <input
            type="number"
            min={0}
            step={10000}
            value={player.player_value}
            onChange={(e) =>
              updatePlayer(player.id, {
                player_value: Math.max(0, Math.round(Number(e.target.value) || 0)),
              })
            }
            className="field-input font-mono tab-fig text-right"
          />
        </Field>
      </div>

      {/* — randomization scope picker — folds out from the bottom — */}
      <div
        className="border-t px-4 py-3"
        style={{ borderColor: "var(--color-line)" }}
      >
        <button
          type="button"
          onClick={() => setBucketsOpen((v) => !v)}
          className="w-full flex items-center justify-between text-[11.5px] font-medium text-fg-dim hover:text-fg transition-colors"
        >
          <span className="flex items-center gap-2">
            <ChevronIcon open={bucketsOpen} />
            Random scope — age & height
          </span>
          <span className="font-mono text-[10.5px] text-fg-faint">
            {state.buckets.age} · {state.buckets.height}
          </span>
        </button>

        {bucketsOpen && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <BucketStrip
              label="Age scope"
              value={state.buckets.age}
              options={AGE_BUCKETS}
              onChange={setAgeBucket}
            />
            <BucketStrip
              label="Height scope"
              value={state.buckets.height}
              options={HEIGHT_BUCKETS}
              onChange={setHeightBucket}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? ""}>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="field-label !mb-0">{label}</span>
        {hint && <span className="font-mono text-[10px] text-fg-faint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function RandBtn({ onClick, title }: { onClick: () => void; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn btn-secondary !px-2 !py-2 shrink-0"
      title={title ?? "Randomize"}
      aria-label={title ?? "Randomize"}
    >
      <DiceIcon />
    </button>
  );
}

function BucketStrip<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { id: T; label: string }[];
  onChange: (next: T) => void;
}) {
  return (
    <div>
      <span className="field-label">{label}</span>
      <div
        className="flex flex-wrap gap-1 rounded-md p-1"
        style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-line)" }}
      >
        {options.map((o) => {
          const active = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              className="px-2.5 py-1 text-[11px] font-mono rounded transition-colors"
              style={{
                background: active ? "rgba(127,168,204,0.18)" : "transparent",
                color: active ? "var(--color-accent-strong)" : "var(--color-fg-muted)",
                border: `1px solid ${active ? "rgba(127,168,204,0.32)" : "transparent"}`,
              }}
              title={o.label}
            >
              {o.id}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DiceIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="9" cy="9" r="1" fill="currentColor" />
      <circle cx="15" cy="15" r="1" fill="currentColor" />
      <circle cx="15" cy="9" r="1" fill="currentColor" />
    </svg>
  );
}

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
      style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .12s" }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function clamp(v: number, min: number, max: number) {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, Math.round(v)));
}
