"use client";

import { useState } from "react";
import { useLibrary, useSelection } from "@/lib/portrait-library/store";
import { PromptBuilder } from "./PromptBuilder";
import { LibraryBuilder } from "./LibraryBuilder";

type Tab = "compose" | "library";

export function PortraitStudio() {
  const lib = useLibrary();
  const sel = useSelection(lib.library.categories);
  const [tab, setTab] = useState<Tab>("compose");

  const totalOptions = lib.library.categories.reduce(
    (s, c) => s + c.options.length,
    0
  );

  return (
    <>
      {/* — header — */}
      <section className="mx-auto max-w-[1180px] px-6 pt-14 pb-9">
        <div className="overline mb-4">Tool 01 — Generative</div>
        <h1 className="font-display text-[2.1rem] sm:text-[2.7rem] font-semibold tracking-[-0.03em] leading-[1.08] max-w-[24ch]">
          Compose thousands of distinct portraits from one base prompt.
        </h1>
        <p className="mt-4 text-[14px] text-fg-muted leading-relaxed max-w-[60ch]">
          Curate a library of modular facial features, then dial in a look or
          roll the dice for a one-off. Every selection swaps a slot in the base
          template — ready to paste into Midjourney.
        </p>

        <div
          className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-2 pt-5 border-t"
          style={{ borderColor: "var(--color-line)" }}
        >
          <Stat label="Categories" value={lib.library.categories.length} />
          <Stat label="Options" value={totalOptions} />
          <Stat
            label="Combinations"
            value={formatCombos(lib.library.categories)}
          />
          <Stat label="Storage" value="Local" />
        </div>
      </section>

      {/* — tab bar — */}
      <div
        className="sticky top-[92px] z-20 border-y"
        style={{
          borderColor: "var(--color-line)",
          background: "rgba(12,12,13,0.86)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="mx-auto max-w-[1180px] px-6 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <TabButton active={tab === "compose"} onClick={() => setTab("compose")}>
              Compose
            </TabButton>
            <TabButton active={tab === "library"} onClick={() => setTab("library")}>
              Library
            </TabButton>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-fg-dim">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: lib.hydrated
                  ? "var(--color-success)"
                  : "var(--color-fg-faint)",
              }}
            />
            {lib.hydrated ? "Synced to local storage" : "Loading…"}
          </div>
        </div>
      </div>

      <section
        key={tab}
        className="mx-auto max-w-[1180px] px-6 py-8 rise-in"
      >
        {tab === "compose" ? (
          <PromptBuilder
            library={lib.library}
            selection={sel.selection}
            locks={sel.locks}
            onSelect={sel.select}
            onToggleLock={sel.toggleLock}
            onRandomize={sel.randomize}
            onRandomizeOne={sel.randomizeOne}
            onClear={sel.clear}
          />
        ) : (
          <LibraryBuilder
            library={lib.library}
            onSetBaseTemplate={lib.setBaseTemplate}
            onAddCategory={lib.addCategory}
            onUpdateCategory={lib.updateCategory}
            onRemoveCategory={lib.removeCategory}
            onMoveCategory={lib.moveCategory}
            onAddOption={lib.addOption}
            onUpdateOption={lib.updateOption}
            onRemoveOption={lib.removeOption}
            onRemoveAllOptions={lib.removeAllOptions}
            onReset={() => {
              if (
                confirm(
                  "Reset the library to factory defaults? Your edits will be lost."
                )
              ) {
                lib.resetLibrary();
                sel.clear();
              }
            }}
          />
        )}
      </section>
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-3 py-3 text-[13px] font-medium transition-colors ${
        active ? "text-fg" : "text-fg-dim hover:text-fg-muted"
      }`}
    >
      {children}
      {active && (
        <span
          className="absolute bottom-0 left-3 right-3 h-[2px]"
          style={{ background: "var(--color-accent)" }}
          aria-hidden
        />
      )}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-display text-[19px] font-semibold tab-fig leading-none">
        {value}
      </span>
      <span className="text-[11px] uppercase tracking-[0.13em] text-fg-dim">
        {label}
      </span>
    </div>
  );
}

function formatCombos(categories: { options: unknown[] }[]): string {
  const total = categories.reduce(
    (acc, c) => acc * Math.max(1, c.options.length),
    1
  );
  if (total >= 1e9) return `${(total / 1e9).toFixed(1)}B+`;
  if (total >= 1e6) return `${(total / 1e6).toFixed(1)}M+`;
  if (total >= 1e3) return `${(total / 1e3).toFixed(1)}K+`;
  return String(total);
}
