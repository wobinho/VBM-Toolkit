"use client";

import { useState } from "react";
import { effectiveOption, useBadgeStudio } from "@/lib/badge-builder/store";
import type { BadgeCategory } from "@/lib/badge-builder/types";
import { normalizeHex } from "@/lib/badge-builder/color";
import { ColorPicker } from "./ColorPicker";

type Props = {
  bb: ReturnType<typeof useBadgeStudio>;
  category: BadgeCategory;
};

/**
 * The colour selector for one colour category — the current swatch, an
 * expandable hex-aware picker, the preset palette and the user's saved-colour
 * strip, each with save / delete.
 */
export function ColorField({ bb, category }: Props) {
  const { state } = bb;
  const [pickerOpen, setPickerOpen] = useState(false);

  const current = effectiveOption(state, category);
  const hex = normalizeHex(current?.swatch ?? "") ?? "#888888";
  const isCustom = !!state.customColors[category.id];
  const selectedId = state.selection[category.id] ?? "";

  const alreadySaved = state.savedColors.some((c) => c.hex === hex);

  return (
    <div className="space-y-3">
      {/* current colour + actions */}
      <div className="flex items-center gap-3">
        <span
          className="w-11 h-11 rounded-md shrink-0"
          style={{ background: hex, border: "1px solid var(--color-line-2)" }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium capitalize truncate">
            {current?.label ?? "—"}
          </div>
          <div className="font-mono text-[11px] text-fg-dim uppercase">
            {hex}
            {isCustom && (
              <span className="ml-1.5 text-accent-strong normal-case">
                custom
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            className="btn-icon"
            onClick={() => bb.saveColor(hex)}
            disabled={alreadySaved}
            title={
              alreadySaved
                ? "Already in your saved colours"
                : "Save this colour"
            }
            aria-label="Save this colour"
          >
            {alreadySaved ? <CheckIcon /> : <BookmarkIcon />}
          </button>
          <button
            type="button"
            className={`btn ${pickerOpen ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setPickerOpen((v) => !v)}
            aria-expanded={pickerOpen}
          >
            <DropperIcon />
            {pickerOpen ? "Done" : "Pick"}
          </button>
        </div>
      </div>

      {/* expandable picker */}
      {pickerOpen && (
        <div
          className="rounded-lg p-3 bg-surface-2"
          style={{ border: "1px solid var(--color-line)" }}
        >
          <ColorPicker
            value={hex}
            onChange={(next) => bb.setCustomColor(category.id, next)}
          />
        </div>
      )}

      {/* preset palette */}
      <div>
        <div className="overline mb-1.5">Preset palette</div>
        <div className="flex flex-wrap gap-1.5">
          {category.options.map((o) => {
            const active = !isCustom && o.id === selectedId;
            return (
              <button
                key={o.id}
                type="button"
                title={o.label}
                aria-label={`Set ${category.label} to ${o.label}`}
                onClick={() => bb.select(category.id, o.id)}
                className="w-[20px] h-[20px] rounded-[4px] transition-transform hover:scale-110"
                style={{
                  background: o.swatch || "var(--color-surface-3)",
                  outline: active
                    ? "2px solid var(--color-accent)"
                    : "1px solid var(--color-line-2)",
                  outlineOffset: active ? "1px" : "0",
                }}
              />
            );
          })}
          {category.options.length === 0 && (
            <span className="text-[11px] text-danger">
              No preset values · add some in the Library tab
            </span>
          )}
        </div>
      </div>

      {/* saved colours */}
      <div>
        <div className="overline mb-1.5">
          Saved colours
          {state.savedColors.length > 0 && (
            <span className="ml-1.5 font-mono text-fg-faint normal-case tracking-normal">
              {state.savedColors.length}
            </span>
          )}
        </div>
        {state.savedColors.length === 0 ? (
          <p className="text-[11px] text-fg-dim leading-relaxed">
            None yet — tap the bookmark to keep a colour here for reuse across
            all three slots.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {state.savedColors.map((c) => {
              const active = isCustom && c.hex === hex;
              return (
                <span key={c.id} className="relative group">
                  <button
                    type="button"
                    title={c.hex}
                    aria-label={`Apply saved colour ${c.hex}`}
                    onClick={() => bb.setCustomColor(category.id, c.hex)}
                    className="block w-[20px] h-[20px] rounded-[4px] transition-transform hover:scale-110"
                    style={{
                      background: c.hex,
                      outline: active
                        ? "2px solid var(--color-accent)"
                        : "1px solid var(--color-line-2)",
                      outlineOffset: active ? "1px" : "0",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => bb.deleteSavedColor(c.id)}
                    aria-label={`Delete saved colour ${c.hex}`}
                    title="Delete saved colour"
                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full
                      flex items-center justify-center opacity-0 group-hover:opacity-100
                      focus-visible:opacity-100 transition-opacity"
                    style={{
                      background: "var(--color-surface-3)",
                      border: "1px solid var(--color-line-3)",
                    }}
                  >
                    <CrossIcon />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* — icons — */

function BookmarkIcon() {
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
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
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

function DropperIcon() {
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
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2a10 10 0 1 0 9.8 8 .65.65 0 0 0-.86-.4 2 2 0 0 1-2.79-1.5 2 2 0 0 0-2.3-1.6A2 2 0 0 1 12 2z" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
