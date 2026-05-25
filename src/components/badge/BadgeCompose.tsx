"use client";

import { useMemo, useState } from "react";
import {
  assembleBadgePrompt,
  BATCH_EXTRA_COUNT,
  COLOR_CATEGORY_IDS,
  effectiveOption,
  resolveBadge,
  useBadgeStudio,
} from "@/lib/badge-builder/store";
import { normalizeHex, type PaletteColorRole } from "@/lib/badge-builder/color";
import type { BadgeCategory, BadgeOption } from "@/lib/badge-builder/types";
import { CrestPreview } from "./CrestPreview";
import { ColorField } from "./ColorField";
import { PaletteChecker } from "./PaletteChecker";
import { SavedPalettes } from "./SavedPalettes";

type Props = { bb: ReturnType<typeof useBadgeStudio> };

const FALLBACK_HEX = "#888888";
const hexOf = (opt: BadgeOption | null): string =>
  normalizeHex(opt?.swatch ?? "") ?? FALLBACK_HEX;

const COLOR_ROLE_TO_CAT: Record<PaletteColorRole, string> = {
  primary: "bcat-primary",
  secondary: "bcat-secondary",
  accent: "bcat-accent",
};

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

  const unlockedColorCount = COLOR_CATEGORY_IDS.filter((id) => !locks[id]).length;
  const colorLocks: Partial<Record<PaletteColorRole, boolean>> = {
    primary: !!locks["bcat-primary"],
    secondary: !!locks["bcat-secondary"],
    accent: !!locks["bcat-accent"],
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* — fields — */}
      <div className="col-span-12 lg:col-span-7">
        <div
          className="flex flex-wrap items-end justify-between gap-y-3 pb-3 mb-5 border-b"
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
          <div
            className="flex items-center justify-between gap-2 px-1"
          >
            <span className="text-[12px] text-fg-muted">Colour palette</span>
            <button
              type="button"
              className="btn btn-secondary text-[11.5px] px-2.5 py-1"
              onClick={bb.randomizeColors}
              disabled={unlockedColorCount === 0}
              title={
                unlockedColorCount === 0
                  ? "All three colours are locked"
                  : unlockedColorCount < 3
                  ? `Randomize ${unlockedColorCount} unlocked colour${
                      unlockedColorCount > 1 ? "s" : ""
                    }`
                  : "Randomize primary, secondary, and accent"
              }
            >
              <DiceIcon />
              Randomize colours
            </button>
          </div>
          <PaletteChecker
            primary={palette.primary}
            secondary={palette.secondary}
            accent={palette.accent}
            locks={colorLocks}
            onApplyFix={(role, hex) =>
              bb.setCustomColor(COLOR_ROLE_TO_CAT[role], hex)
            }
          />
          <SavedPalettes bb={bb} current={palette} />
        </div>
      </div>

      {/* — preview + prompt — */}
      <aside className="col-span-12 lg:col-span-5">
        <div className="lg:sticky lg:top-[150px] space-y-3">
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
            Randomize re-rolls every unlocked field; Randomize colours only
            re-rolls primary, secondary, and accent (locked slots stay put).
            Toggle batch on a field to feed it several values at once — they
            land in the prompt as {"{a, b, c}"}. Pick any colour with the hex
            picker, save the ones you like, and use the palette checker&apos;s
            suggested fixes before you generate.
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
  const noOptions = category.options.length === 0;
  const batchEnabled = !!bb.state.batch[category.id]?.enabled;

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
          {batchEnabled && (
            <span className="tag tag-accent text-[9px]">batch</span>
          )}
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
            className={`btn-icon ${batchEnabled ? "btn-icon-active" : ""}`}
            onClick={() => bb.toggleBatch(category.id)}
            disabled={noOptions}
            title={
              batchEnabled
                ? `Turn off batch generation for ${category.label}`
                : `Batch generation — fill ${category.label} with multiple values`
            }
            aria-label={`Toggle batch generation for ${category.label}`}
            aria-pressed={batchEnabled}
          >
            <BatchIcon />
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={onRandomize}
            disabled={locked || noOptions}
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
            {noOptions && (
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
          {noOptions && (
            <div className="mt-2 text-[11px] text-danger">
              No values · add some in the Library tab
            </div>
          )}
        </>
      )}

      {batchEnabled && !noOptions && <BatchPanel bb={bb} category={category} />}
    </div>
  );
}

/**
 * The extra value boxes shown when batch generation is on for a category. Box 1
 * is the category's normal control above; this renders boxes 2…N and a live
 * preview of the `{a, b, c}` fragment that lands in the prompt.
 */
function BatchPanel({
  bb,
  category,
}: {
  bb: ReturnType<typeof useBadgeStudio>;
  category: BadgeCategory;
}) {
  const ids = bb.state.batch[category.id]?.optionIds ?? [];
  const valueOf = (id: string) =>
    category.options.find((o) => o.id === id)?.value ?? "";

  const first = effectiveOption(bb.state, category)?.value ?? "";
  const previewValues = [
    first,
    ...Array.from({ length: BATCH_EXTRA_COUNT }, (_, i) => valueOf(ids[i] ?? "")),
  ].filter(Boolean);

  return (
    <div
      className="mt-2.5 rounded-md p-2.5 bg-surface-2 space-y-2"
      style={{ border: "1px solid var(--color-line)" }}
    >
      <div className="flex items-center justify-between">
        <span className="overline">Batch values</span>
        <span className="font-mono text-[10px] text-fg-dim">
          {BATCH_EXTRA_COUNT} extra picks
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Array.from({ length: BATCH_EXTRA_COUNT }, (_, i) => (
          <label key={i} className="block">
            <span className="font-mono text-[10px] text-fg-faint block mb-1">
              Value {i + 2}
            </span>
            <select
              className="field-input py-1.5"
              value={ids[i] ?? ""}
              onChange={(e) => bb.setBatchOption(category.id, i, e.target.value)}
            >
              {!ids[i] && <option value="">— pick —</option>}
              {category.options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="font-mono text-[10.5px] leading-relaxed break-words">
        <span className="text-fg-faint">prompt → </span>
        <span className="text-fg-muted">
          {previewValues.length > 0 ? `{${previewValues.join(", ")}}` : "—"}
        </span>
      </div>
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

function BatchIcon() {
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
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}
