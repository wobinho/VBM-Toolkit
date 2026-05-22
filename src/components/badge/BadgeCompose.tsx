"use client";

import { useMemo, useState } from "react";
import {
  assembleBadgePrompt,
  resolveBadge,
  useBadgeStudio,
} from "@/lib/badge-builder/store";
import { normalizeHex } from "@/lib/badge-builder/color";
import type { BadgeCategory, BadgeOption } from "@/lib/badge-builder/types";
import { CrestPreview } from "./CrestPreview";
import { ColorField } from "./ColorField";
import { PaletteChecker } from "./PaletteChecker";
import { SavedPalettes } from "./SavedPalettes";

type Props = { bb: ReturnType<typeof useBadgeStudio> };

const FALLBACK_HEX = "#888888";
const hexOf = (opt: BadgeOption | null): string =>
  normalizeHex(opt?.swatch ?? "") ?? FALLBACK_HEX;

export function BadgeCompose({ bb }: Props) {
  const { state } = bb;
  const { library, locks, teamName } = state;

  const { prompt, missing } = useMemo(
    () => assembleBadgePrompt(state),
    [state]
  );
  const resolved = useMemo(() => resolveBadge(state), [state]);

  const palette = useMemo(
    () => ({
      primary: hexOf(resolved.primary),
      secondary: hexOf(resolved.secondary),
      accent: hexOf(resolved.accent),
    }),
    [resolved]
  );

  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  const lockedCount = library.categories.filter((c) => locks[c.id]).length;

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* — fields — */}
      <div className="col-span-12 lg:col-span-7">
        <div
          className="flex items-end justify-between pb-3 mb-5 border-b"
          style={{ borderColor: "var(--color-line-2)" }}
        >
          <div>
            <div className="overline mb-1.5">Step 01 — Compose</div>
            <h2 className="font-display text-[20px] font-semibold tracking-tight">
              Badge fields
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {lockedCount > 0 && (
              <span
                className="tag tag-accent"
                title={`${lockedCount} field${
                  lockedCount > 1 ? "s" : ""
                } locked — kept unchanged on Randomize and Reset`}
              >
                <LockClosedIcon />
                {lockedCount}
              </span>
            )}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={bb.resetSelection}
            >
              Reset
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={bb.randomizeAll}
            >
              <DiceIcon />
              Randomize
            </button>
          </div>
        </div>

        {/* team name — optional */}
        <TeamNameField
          enabled={teamName.enabled}
          value={teamName.value}
          onToggle={bb.toggleTeamName}
          onChange={bb.setTeamName}
          onRoll={bb.rollTeamName}
        />

        {/* the five core fields */}
        <div className="space-y-2.5 mt-2.5">
          {library.categories.map((cat, idx) => (
            <CategoryCard
              key={cat.id}
              bb={bb}
              index={idx + 1}
              category={cat}
              selectedId={state.selection[cat.id] ?? ""}
              locked={!!locks[cat.id]}
              onSelect={(optId) => bb.select(cat.id, optId)}
              onToggleLock={() => bb.toggleLock(cat.id)}
              onRandomize={() => bb.randomizeOne(cat.id)}
            />
          ))}
        </div>

        {/* colour palette tools */}
        <div className="mt-3 space-y-3">
          <PaletteChecker
            primary={palette.primary}
            secondary={palette.secondary}
            accent={palette.accent}
          />
          <SavedPalettes bb={bb} current={palette} />
        </div>
      </div>

      {/* — preview + prompt — */}
      <aside className="col-span-12 lg:col-span-5">
        <div className="sticky top-[150px] space-y-3">
          {/* crest sketch */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[13px] font-medium">Crest preview</span>
              <span className="font-mono text-[11px] text-fg-dim">sketch</span>
            </div>
            <div className="mx-auto max-w-[230px]">
              <CrestPreview
                resolved={resolved}
                teamName={teamName.enabled ? teamName.value : ""}
              />
            </div>
            <p className="text-[11px] text-fg-dim text-center mt-4 leading-relaxed">
              A schematic from your selections — the AI model renders the
              finished artwork.
            </p>
          </div>

          {/* assembled prompt */}
          <div className="card overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: "var(--color-line)" }}
            >
              <span className="text-[13px] font-medium">Assembled prompt</span>
              <span className="font-mono text-[11px] text-fg-dim tab-fig">
                {prompt.length} chars
              </span>
            </div>

            <div className="px-4 py-4 max-h-[300px] overflow-auto scrollbar-thin">
              <pre className="font-mono text-[12px] leading-[1.7] whitespace-pre-wrap break-words text-fg">
                {prompt}
              </pre>
            </div>

            <div
              className="flex items-center justify-end px-4 py-3 border-t"
              style={{ borderColor: "var(--color-line)" }}
            >
              <button
                type="button"
                onClick={handleCopy}
                className={`btn ${
                  copyState === "copied" ? "btn-secondary" : "btn-primary"
                }`}
              >
                {copyState === "copied" ? (
                  <>
                    <CheckIcon /> Copied
                  </>
                ) : (
                  <>
                    <CopyIcon />
                    Copy prompt
                  </>
                )}
              </button>
            </div>
          </div>

          {missing.length > 0 && (
            <div
              className="card p-3 text-[12px] flex gap-2"
              style={{ borderColor: "rgba(217, 138, 130, 0.3)" }}
            >
              <span className="text-danger shrink-0">!</span>
              <div>
                <div className="font-medium text-danger mb-0.5">
                  Empty slots
                </div>
                <div className="text-fg-muted">{missing.join(" · ")}</div>
              </div>
            </div>
          )}

          <p className="text-[11.5px] text-fg-dim leading-relaxed">
            Randomize re-rolls every unlocked field. Lock a field to keep it
            fixed while the rest re-roll. Pick any colour with the hex picker,
            save the ones you like, and check the palette before you generate.
          </p>
        </div>
      </aside>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function TeamNameField({
  enabled,
  value,
  onToggle,
  onChange,
  onRoll,
}: {
  enabled: boolean;
  value: string;
  onToggle: () => void;
  onChange: (v: string) => void;
  onRoll: () => void;
}) {
  return (
    <div className="card p-3.5">
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={enabled}
            onChange={onToggle}
            className="w-3.5 h-3.5"
          />
          <span className="text-[13px] font-medium">Team name</span>
          <span className="text-[11px] text-fg-dim">optional</span>
        </label>
        {!enabled && (
          <span className="font-mono text-[10px] text-fg-faint">
            woven into the prompt when on
          </span>
        )}
      </div>
      {enabled && (
        <div className="flex gap-2 mt-2.5">
          <input
            className="field-input"
            placeholder="e.g. Coastal Surge"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-secondary shrink-0"
            onClick={onRoll}
            title="Pick a random team name"
            aria-label="Pick a random team name"
          >
            <DiceIcon />
          </button>
        </div>
      )}
    </div>
  );
}

function CategoryCard({
  bb,
  index,
  category,
  selectedId,
  locked,
  onSelect,
  onToggleLock,
  onRandomize,
}: {
  bb: ReturnType<typeof useBadgeStudio>;
  index: number;
  category: BadgeCategory;
  selectedId: string;
  locked: boolean;
  onSelect: (optionId: string) => void;
  onToggleLock: () => void;
  onRandomize: () => void;
}) {
  const isColor = category.kind === "color";

  return (
    <div
      className="card p-3.5"
      style={locked ? { borderColor: "rgba(127, 168, 204, 0.32)" } : undefined}
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[10px] tab-fig text-fg-faint shrink-0">
            {String(index).padStart(2, "0")}
          </span>
          <span className="text-[13px] font-medium">{category.label}</span>
          <span className="font-mono text-[10px] text-fg-faint hidden sm:inline">
            {category.slot}
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            className={`btn-icon ${locked ? "btn-icon-active" : ""}`}
            onClick={onToggleLock}
            title={
              locked
                ? `Unlock ${category.label}`
                : `Lock ${category.label} — keep it unchanged on Randomize`
            }
            aria-label={
              locked ? `Unlock ${category.label}` : `Lock ${category.label}`
            }
            aria-pressed={locked}
          >
            {locked ? <LockClosedIcon /> : <LockOpenIcon />}
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={onRandomize}
            disabled={locked || category.options.length === 0}
            title={
              locked
                ? `${category.label} is locked`
                : `Randomize ${category.label}`
            }
            aria-label={`Randomize ${category.label}`}
          >
            <DiceIcon />
          </button>
        </div>
      </div>

      {isColor ? (
        <ColorField bb={bb} category={category} />
      ) : (
        <>
          <select
            className="field-input"
            value={selectedId}
            onChange={(e) => onSelect(e.target.value)}
          >
            {category.options.length === 0 && (
              <option value="" disabled>
                — no options —
              </option>
            )}
            {category.options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          {category.options.length === 0 && (
            <div className="mt-2 text-[11px] text-danger">
              No values · add some in the Library tab
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* — icons — */

function CopyIcon() {
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
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function LockClosedIcon() {
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
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function LockOpenIcon() {
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
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

function DiceIcon() {
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
      <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
      <circle cx="8.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="15.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
