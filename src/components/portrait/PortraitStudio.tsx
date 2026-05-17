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
      {/* HEADER */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />
        <div
          className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(197,247,79,0.08), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-[1400px] px-6 pt-12 pb-10">
          <div className="flex items-start justify-between gap-8 flex-wrap">
            <div className="max-w-[64ch]">
              <div className="flex items-center gap-2 mb-4">
                <span className="chip chip-accent">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
                  Tool 01
                </span>
                <span className="chip chip-muted">Midjourney · niji 7 · 3:4</span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
                Compose <span className="text-accent">thousands</span> of distinct
                portraits from one base prompt.
              </h1>
              <p className="mt-4 text-fg-muted leading-relaxed">
                Curate a library of modular facial features, then dial in a look
                or roll the dice for a one-off. Every selection swaps a slot in
                the base template — ready to paste into Midjourney.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 w-full lg:w-auto lg:max-w-sm">
              <Stat label="Categories" value={lib.library.categories.length} />
              <Stat label="Options" value={totalOptions} />
              <Stat
                label="Combinations"
                value={formatCombos(lib.library.categories)}
                compact
              />
              <Stat label="Storage" value="Local" compact />
            </div>
          </div>
        </div>
      </section>

      {/* TAB BAR */}
      <div
        className="border-y sticky top-[97px] z-20 glass"
        style={{ borderColor: "var(--color-line)" }}
      >
        <div className="mx-auto max-w-[1400px] px-6 flex items-center justify-between">
          <div className="flex items-center gap-1 py-2">
            <TabButton active={tab === "compose"} onClick={() => setTab("compose")}>
              Compose
            </TabButton>
            <TabButton active={tab === "library"} onClick={() => setTab("library")}>
              Library
            </TabButton>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-fg-dim">
            {lib.hydrated ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                Synced to local storage
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-fg-dim" />
                Loading…
              </>
            )}
          </div>
        </div>
      </div>

      <section
        key={tab}
        className="mx-auto max-w-[1400px] px-6 py-8 animate-fade-up"
      >
        {tab === "compose" ? (
          <PromptBuilder
            library={lib.library}
            selection={sel.selection}
            onSelect={sel.select}
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
            onReset={() => {
              if (
                confirm("Reset the library to factory defaults? Your edits will be lost.")
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
      className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? "text-fg bg-surface-3"
          : "text-fg-muted hover:text-fg hover:bg-surface-2"
      }`}
    >
      {children}
      {active && (
        <span
          className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-8 h-[2px] bg-accent rounded-full"
          aria-hidden
        />
      )}
    </button>
  );
}

function Stat({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string | number;
  compact?: boolean;
}) {
  return (
    <div className="card p-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-fg-dim mb-1">
        {label}
      </div>
      <div
        className={`font-display tab-fig font-semibold leading-none ${
          compact ? "text-xl" : "text-2xl"
        }`}
      >
        {value}
      </div>
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
