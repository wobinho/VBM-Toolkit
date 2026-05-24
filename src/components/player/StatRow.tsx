"use client";

import { useEffect, useState } from "react";
import { statLabel } from "@/lib/player-forge/constants";
import type { StatKey } from "@/lib/player-forge/types";

type Props = {
  statKey: StatKey;
  value: number;
  /** Accent colour for the bar, derived from the parent stat group. */
  accent: string;
  /** Highlight this row — e.g. when it's a position-relevant skill. */
  emphasized?: boolean;
  onChange: (next: number) => void;
  onRandomize: () => void;
};

export function StatRow({
  statKey,
  value,
  accent,
  emphasized,
  onChange,
  onRandomize,
}: Props) {
  // Local string state so typing "" / "8" doesn't snap-clamp mid-edit.
  const [draft, setDraft] = useState<string>(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const commit = (raw: string) => {
    const n = Math.round(Number(raw));
    if (!Number.isFinite(n)) {
      setDraft(String(value));
      return;
    }
    const clamped = Math.max(1, Math.min(100, n));
    setDraft(String(clamped));
    if (clamped !== value) onChange(clamped);
  };

  return (
    <div
      className="grid grid-cols-[minmax(0,7rem)_1fr_auto_auto] items-center gap-2.5 py-1.5"
      style={{
        opacity: emphasized ? 1 : 0.95,
      }}
    >
      <label
        className="text-[12px] font-medium truncate"
        style={{
          color: emphasized ? "var(--color-fg)" : "var(--color-fg-muted)",
        }}
        title={statLabel(statKey)}
      >
        {emphasized && (
          <span
            className="inline-block w-1 h-1 rounded-full mr-1.5 align-middle"
            style={{ background: accent }}
            aria-hidden
          />
        )}
        {statLabel(statKey)}
      </label>

      {/* slider — custom track painted via gradient */}
      <input
        type="range"
        min={1}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="stat-slider"
        style={
          {
            // CSS custom props consumed by the .stat-slider rules
            ["--track-fill" as string]: `${(value / 100) * 100}%`,
            ["--track-color" as string]: accent,
          } as React.CSSProperties
        }
        aria-label={`${statLabel(statKey)} value`}
      />

      <input
        type="number"
        min={1}
        max={100}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
        }}
        className="field-input !py-1 !px-2 w-[3.4rem] text-center font-mono tab-fig text-[12.5px]"
      />

      <button
        type="button"
        onClick={onRandomize}
        className="btn-icon"
        title={`Randomize ${statLabel(statKey)} (±5)`}
      >
        <DiceIcon />
      </button>
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
