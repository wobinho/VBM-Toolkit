"use client";

import { useMemo, useState } from "react";
import { assemblePrompt } from "@/lib/portrait-library/store";
import type {
  LockMap,
  PortraitLibrary,
  SelectionMap,
} from "@/lib/portrait-library/types";

type Props = {
  library: PortraitLibrary;
  selection: SelectionMap;
  locks: LockMap;
  onSelect: (categoryId: string, optionId: string | null) => void;
  onToggleLock: (categoryId: string) => void;
  onRandomize: () => void;
  onRandomizeOne: (categoryId: string) => void;
  onClear: () => void;
};

export function PromptBuilder({
  library,
  selection,
  locks,
  onSelect,
  onToggleLock,
  onRandomize,
  onRandomizeOne,
  onClear,
}: Props) {
  const { prompt, missing } = useMemo(
    () => assemblePrompt(library, selection),
    [library, selection]
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

  const filledCount = library.categories.filter((c) => selection[c.id]).length;
  const totalCount = library.categories.length;
  const lockedCount = library.categories.filter((c) => locks[c.id]).length;
  const progress =
    totalCount === 0 ? 0 : Math.round((filledCount / totalCount) * 100);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* — selectors — */}
      <div className="col-span-12 lg:col-span-8">
        <div
          className="flex flex-wrap items-end justify-between gap-y-3 pb-3 mb-5 border-b"
          style={{ borderColor: "var(--color-line-2)" }}
        >
          <div>
            <div className="overline mb-1.5">Step 02 — Compose</div>
            <h2 className="font-display text-[20px] font-semibold tracking-tight">
              Feature selection
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {lockedCount > 0 && (
              <span
                className="tag tag-accent"
                title={`${lockedCount} feature${
                  lockedCount > 1 ? "s" : ""
                } locked — kept unchanged on Randomize and Clear`}
              >
                <LockClosedIcon />
                {lockedCount}
              </span>
            )}
            <button type="button" className="btn btn-ghost" onClick={onClear}>
              Clear
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onRandomize}
            >
              <DiceIcon />
              Randomize
            </button>
          </div>
        </div>

        {library.categories.length === 0 ? (
          <EmptyState
            title="No categories yet"
            body="Switch to the Library tab and add a category to start composing prompts."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {library.categories.map((cat, idx) => {
              const current = selection[cat.id] ?? "";
              const locked = !!locks[cat.id];
              return (
                <div
                  key={cat.id}
                  className="card p-3.5"
                  style={
                    locked
                      ? { borderColor: "rgba(127, 168, 204, 0.32)" }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] tab-fig text-fg-faint shrink-0">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[13px] font-medium truncate">
                        {cat.label}
                      </span>
                      {cat.required && (
                        <span className="text-accent text-[13px] leading-none">
                          *
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        className={`btn-icon ${locked ? "btn-icon-active" : ""}`}
                        onClick={() => onToggleLock(cat.id)}
                        title={
                          locked
                            ? `Unlock ${cat.label} — allow Randomize to change it`
                            : `Lock ${cat.label} — keep it unchanged on Randomize`
                        }
                        aria-label={
                          locked ? `Unlock ${cat.label}` : `Lock ${cat.label}`
                        }
                        aria-pressed={locked}
                      >
                        {locked ? <LockClosedIcon /> : <LockOpenIcon />}
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => onRandomizeOne(cat.id)}
                        disabled={cat.options.length === 0 || locked}
                        title={
                          locked
                            ? `${cat.label} is locked`
                            : `Randomize ${cat.label}`
                        }
                        aria-label={`Randomize ${cat.label}`}
                      >
                        <DiceIcon />
                      </button>
                    </div>
                  </div>
                  <select
                    className="field-input"
                    value={current}
                    onChange={(e) => onSelect(cat.id, e.target.value || null)}
                  >
                    {cat.allowNone && <option value="">— skip —</option>}
                    {!cat.allowNone && !current && (
                      <option value="" disabled>
                        — choose —
                      </option>
                    )}
                    {cat.options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {cat.options.length === 0 && (
                    <div className="mt-2 text-[11px] text-danger">
                      No options · add some in Library
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* — assembled prompt — */}
      <aside className="col-span-12 lg:col-span-4">
        <div className="lg:sticky lg:top-[150px] space-y-3">
          <div className="card overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: "var(--color-line)" }}
            >
              <span className="text-[13px] font-medium">Assembled prompt</span>
              <span className="font-mono text-[11px] text-fg-dim tab-fig">
                {filledCount}/{totalCount}
              </span>
            </div>

            <div
              className="h-px w-full"
              style={{ background: "var(--color-line)" }}
            >
              <div
                className="h-px transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: "var(--color-accent)",
                }}
              />
            </div>

            <div className="px-4 py-4 max-h-[420px] overflow-auto scrollbar-thin">
              <pre className="font-mono text-[12px] leading-[1.7] whitespace-pre-wrap break-words text-fg">
                {prompt}
              </pre>
            </div>

            <div
              className="flex items-center justify-between gap-2 px-4 py-3 border-t"
              style={{ borderColor: "var(--color-line)" }}
            >
              <span className="font-mono text-[11px] text-fg-dim tab-fig">
                {prompt.length} chars
              </span>
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
                  Required slots empty
                </div>
                <div className="text-fg-muted">{missing.join(" · ")}</div>
              </div>
            </div>
          )}

          <p className="text-[11.5px] text-fg-dim leading-relaxed">
            Use Randomize for rapid variants. Lock a feature to keep it fixed
            while everything else re-rolls. Unset slots are quietly dropped from
            the final prompt.
          </p>
        </div>
      </aside>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-10 text-center">
      <div className="font-display text-[17px] font-semibold mb-1">{title}</div>
      <div className="text-[13px] text-fg-muted">{body}</div>
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
