"use client";

import { useState } from "react";
import { useBadgeStudio } from "@/lib/badge-builder/store";

type Props = {
  bb: ReturnType<typeof useBadgeStudio>;
  /** The current primary / secondary / accent hexes — previewed on the save row. */
  current: { primary: string; secondary: string; accent: string };
};

/**
 * Save the current three-colour palette, then load or delete saved ones.
 * Loading applies the palette's colours to the primary / secondary / accent
 * slots as custom picks.
 */
export function SavedPalettes({ bb, current }: Props) {
  const { savedPalettes } = bb.state;
  const [name, setName] = useState("");

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    bb.savePalette(name);
    setName("");
  };

  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "var(--color-line)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium">Saved palettes</span>
          <span className="font-mono text-[10px] text-fg-faint">
            primary · secondary · accent
          </span>
        </div>
        <span className="tag text-[10px] tab-fig">{savedPalettes.length}</span>
      </div>

      <div className="p-4 space-y-4">
        {/* save current */}
        <form
          onSubmit={save}
          className="flex items-center gap-2 rounded-lg p-2.5 bg-surface-2"
          style={{ border: "1px solid var(--color-line)" }}
        >
          <PaletteSwatch
            primary={current.primary}
            secondary={current.secondary}
            accent={current.accent}
          />
          <input
            className="field-input flex-1 py-1.5"
            placeholder="Name this palette (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
          />
          <button type="submit" className="btn btn-primary shrink-0">
            <PlusIcon />
            Save
          </button>
        </form>

        {/* saved list */}
        {savedPalettes.length === 0 ? (
          <p className="text-[12px] text-fg-dim leading-relaxed">
            No saved palettes yet. Save the current three colours above, then
            load them back into any badge with one tap.
          </p>
        ) : (
          <ul className="space-y-1">
            {savedPalettes.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-2.5 p-1.5 rounded-md hover:bg-surface-2 transition-colors group"
              >
                <PaletteSwatch
                  primary={p.primary}
                  secondary={p.secondary}
                  accent={p.accent}
                />
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-medium truncate">
                    {p.name}
                  </span>
                  <span className="block font-mono text-[10px] text-fg-dim uppercase truncate">
                    {p.primary} {p.secondary} {p.accent}
                  </span>
                </span>
                <button
                  type="button"
                  className="btn btn-secondary shrink-0 py-1.5"
                  onClick={() => bb.loadPalette(p.id)}
                >
                  Load
                </button>
                <button
                  type="button"
                  className="btn-icon hover:!text-danger shrink-0"
                  onClick={() => {
                    if (confirm(`Delete palette "${p.name}"?`))
                      bb.deleteSavedPalette(p.id);
                  }}
                  aria-label={`Delete palette ${p.name}`}
                >
                  <TrashIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Three colours shown as one rounded chip. */
function PaletteSwatch({
  primary,
  secondary,
  accent,
}: {
  primary: string;
  secondary: string;
  accent: string;
}) {
  return (
    <span
      className="flex shrink-0 rounded-md overflow-hidden"
      style={{ border: "1px solid var(--color-line-2)" }}
      aria-hidden
    >
      <span className="w-4 h-8" style={{ background: primary }} />
      <span className="w-4 h-8" style={{ background: secondary }} />
      <span className="w-4 h-8" style={{ background: accent }} />
    </span>
  );
}

/* — icons — */

function PlusIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
