"use client";

import { useState } from "react";
import { usePlayerForge } from "@/lib/player-forge/store";
import { RosterList } from "./RosterList";
import { PlayerEditor } from "./PlayerEditor";
import { BatchAddBar } from "./BatchAddBar";
import { ExportPanel } from "./ExportPanel";

type Tab = "build" | "export";

export function PlayerForge() {
  const store = usePlayerForge();
  const [tab, setTab] = useState<Tab>("build");

  const { state, addPlayer } = store;
  const selected =
    state.players.find((p) => p.id === state.selectedPlayerId) ?? null;

  return (
    <>
      {/* — header — */}
      <section className="mx-auto max-w-[1180px] px-4 sm:px-6 pt-10 sm:pt-14 pb-7 sm:pb-9">
        <div className="overline mb-4">Tool 03 — Database</div>
        <h1 className="font-display text-[2.1rem] sm:text-[2.7rem] font-semibold tracking-[-0.03em] leading-[1.08] max-w-[26ch]">
          Forge a draft pool of custom players, then export it as game-ready JSON.
        </h1>
        <p className="mt-4 text-[14px] text-fg-muted leading-relaxed max-w-[62ch]">
          Tune bio fields with scoped randomization, edit stats by group with a
          ±5 jitter knob, and capture clean stat blocks as five-tier archetypes
          you can reapply to every new player.
        </p>

        <div
          className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-2 pt-5 border-t"
          style={{ borderColor: "var(--color-line)" }}
        >
          <Stat label="Players" value={state.players.length} />
          <Stat label="Archetypes" value={state.archetypes.length} />
          <Stat label="Format" value="JSON" />
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
            <TabButton active={tab === "build"} onClick={() => setTab("build")}>
              Build
            </TabButton>
            <TabButton active={tab === "export"} onClick={() => setTab("export")}>
              Export
            </TabButton>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-fg-dim">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: store.hydrated
                  ? "var(--color-success)"
                  : "var(--color-fg-faint)",
              }}
            />
            {store.hydrated ? "Synced to local storage" : "Loading…"}
          </div>
        </div>
      </div>

      <section key={tab} className="mx-auto max-w-[1180px] px-4 sm:px-6 py-6 sm:py-8 rise-in">
        {tab === "build" ? (
          <BuildView store={store} selected={selected} addPlayer={() => addPlayer()} />
        ) : (
          <div className="grid gap-4">
            <ExportPanel store={store} />
          </div>
        )}
      </section>
    </>
  );
}

function BuildView({
  store,
  selected,
  addPlayer,
}: {
  store: ReturnType<typeof usePlayerForge>;
  selected: ReturnType<typeof usePlayerForge>["state"]["players"][number] | null;
  addPlayer: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <BatchAddBar store={store} />

      <div className="grid grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)] gap-4">
        <RosterList store={store} />
        {selected ? (
          <PlayerEditor player={selected} store={store} />
        ) : (
          <EmptyEditor onAdd={addPlayer} />
        )}
      </div>
    </div>
  );
}

function EmptyEditor({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className="card grid place-items-center text-center p-10"
      style={{ borderColor: "var(--color-line)", minHeight: "20rem" }}
    >
      <div className="max-w-[36ch]">
        <div className="overline mb-3">Empty workspace</div>
        <h3 className="font-display text-[20px] font-semibold tracking-tight">
          No player selected
        </h3>
        <p className="mt-2 text-[13px] text-fg-muted leading-relaxed">
          Add a player from the toolbar above, or pick one from the roster on
          the left to edit their bio, stats and archetype assignment.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="btn btn-primary mt-5 text-[12.5px]"
        >
          + new player
        </button>
      </div>
    </div>
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
