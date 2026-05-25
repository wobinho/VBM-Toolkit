"use client";

import { useState } from "react";
import { useBadgeStudio } from "@/lib/badge-builder/store";
import { BadgeCompose } from "./BadgeCompose";
import { BadgeLibrary } from "./BadgeLibrary";

type Tab = "compose" | "library";

export function BadgeStudio() {
  const bb = useBadgeStudio();
  const [tab, setTab] = useState<Tab>("compose");

  const cats = bb.state.library.categories;
  const count = (id: string) =>
    cats.find((c) => c.id === id)?.options.length ?? 0;

  return (
    <>
      {/* — header — */}
      <section className="mx-auto max-w-[1180px] px-4 sm:px-6 pt-10 sm:pt-14 pb-7 sm:pb-9">
        <div className="overline mb-4">Tool 02 — Visual</div>
        <h1 className="font-display text-[2.1rem] sm:text-[2.7rem] font-semibold tracking-[-0.03em] leading-[1.08] max-w-[24ch]">
          Build a club badge prompt from a shape, a motif and three colours.
        </h1>
        <p className="mt-4 text-[14px] text-fg-muted leading-relaxed max-w-[60ch]">
          Every field draws from its own library of values — lock the ones you
          like, randomize the rest, and copy the finished prompt straight into
          your image model.
        </p>

        <div
          className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-2 pt-5 border-t"
          style={{ borderColor: "var(--color-line)" }}
        >
          <Stat label="Shapes" value={count("bcat-shape")} />
          <Stat label="Motifs" value={count("bcat-motif")} />
          <Stat label="Colours" value={count("bcat-primary")} />
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
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6 flex items-center justify-between">
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
                background: bb.hydrated
                  ? "var(--color-success)"
                  : "var(--color-fg-faint)",
              }}
            />
            {bb.hydrated ? "Synced to local storage" : "Loading…"}
          </div>
        </div>
      </div>

      <section key={tab} className="mx-auto max-w-[1180px] px-4 sm:px-6 py-6 sm:py-8 rise-in">
        {tab === "compose" ? (
          <BadgeCompose bb={bb} />
        ) : (
          <BadgeLibrary bb={bb} />
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
