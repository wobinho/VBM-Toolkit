"use client";

import { useMemo, useState } from "react";
import { assemblePrompt } from "@/lib/portrait-library/store";
import type { PortraitLibrary, SelectionMap } from "@/lib/portrait-library/types";

type Props = {
  library: PortraitLibrary;
  selection: SelectionMap;
  onSelect: (categoryId: string, optionId: string | null) => void;
  onRandomize: () => void;
  onRandomizeOne: (categoryId: string) => void;
  onClear: () => void;
};

export function PromptBuilder({
  library,
  selection,
  onSelect,
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
  const progress = totalCount === 0 ? 0 : Math.round((filledCount / totalCount) * 100);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* LEFT — selectors */}
      <div className="col-span-12 lg:col-span-8">
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-fg-dim mb-1">
              Step 02 · Compose
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Feature selection
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-ghost text-xs" onClick={onClear}>
              Clear
            </button>
            <button type="button" className="btn btn-secondary text-xs" onClick={onRandomize}>
              <span className="text-sm leading-none">⤬</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {library.categories.map((cat, idx) => {
              const current = selection[cat.id] ?? "";
              const filled = !!current;
              return (
                <div
                  key={cat.id}
                  className={`card p-4 transition-colors ${
                    filled ? "" : "opacity-95"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] tab-fig text-fg-dim shrink-0">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm font-medium truncate">
                        {cat.label}
                      </span>
                      {cat.required && (
                        <span className="text-accent text-xs">*</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono text-[10px] text-fg-faint">
                        {cat.slot}
                      </span>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => onRandomizeOne(cat.id)}
                        disabled={cat.options.length === 0}
                        title={`Randomize ${cat.label}`}
                        aria-label={`Randomize ${cat.label}`}
                      >
                        <DiceIcon />
                      </button>
                    </div>
                  </div>
                  <select
                    className="field-input text-sm"
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
                    <div className="mt-2 text-[11px] text-warn">
                      No options · add some in Library
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT — assembled prompt */}
      <aside className="col-span-12 lg:col-span-4">
        <div className="sticky top-[170px] space-y-3">
          <div className="card overflow-hidden">
            {/* header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: "var(--color-line)" }}
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
                <span className="text-sm font-medium">Prompt</span>
              </div>
              <div className="text-[11px] font-mono text-fg-dim tab-fig">
                {filledCount}/{totalCount}
              </div>
            </div>

            {/* progress bar */}
            <div className="h-[3px] w-full surface-3">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* body */}
            <div className="px-4 py-4 max-h-[420px] overflow-auto scrollbar-thin">
              <pre className="font-mono text-[12.5px] leading-[1.65] whitespace-pre-wrap break-words text-fg">
                {prompt}
              </pre>
            </div>

            {/* footer */}
            <div
              className="flex items-center justify-between gap-2 px-4 py-3 border-t"
              style={{ borderColor: "var(--color-line)" }}
            >
              <span className="text-[11px] font-mono text-fg-dim tab-fig">
                {prompt.length} chars
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className={`btn text-xs ${
                  copyState === "copied" ? "btn-secondary" : "btn-primary"
                }`}
              >
                {copyState === "copied" ? (
                  <>
                    <span className="text-success">✓</span> Copied
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
              className="card p-3 text-xs flex gap-2"
              style={{
                borderColor: "rgba(248, 113, 113, 0.3)",
                background: "rgba(248, 113, 113, 0.05)",
              }}
            >
              <span className="text-danger shrink-0">⚠</span>
              <div>
                <div className="font-medium text-danger mb-0.5">
                  Required slots empty
                </div>
                <div className="text-fg-muted">{missing.join(" · ")}</div>
              </div>
            </div>
          )}

          <p className="text-[11px] text-fg-dim leading-relaxed px-1">
            Tip · use Randomize for rapid variants. Slots left unset are quietly
            dropped from the final prompt.
          </p>
        </div>
      </aside>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-10 text-center">
      <div className="font-display text-xl font-semibold mb-1">{title}</div>
      <div className="text-sm text-fg-muted">{body}</div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
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
