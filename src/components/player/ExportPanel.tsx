"use client";

import { useMemo, useRef, useState } from "react";
import {
  buildExport,
  copyToClipboard,
  downloadJSON,
  parseImport,
  quotaSummary,
} from "@/lib/player-forge/io";
import { POSITIONS } from "@/lib/player-forge/constants";
import type { PlayerForgeStore } from "@/lib/player-forge/store";
import { PositionBadge } from "./PositionBadge";

type Props = { store: PlayerForgeStore };
type Toast = { kind: "ok" | "err"; text: string } | null;

export function ExportPanel({ store }: Props) {
  const { state, appendPlayers, replacePlayers } = store;
  const fileRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [copied, setCopied] = useState(false);

  const exported = useMemo(() => buildExport(state.players), [state.players]);
  const quota = useMemo(() => quotaSummary(state.players), [state.players]);

  const flash = (t: Toast) => {
    setToast(t);
    if (t) setTimeout(() => setToast(null), 3200);
  };

  const onCopy = async () => {
    const ok = await copyToClipboard(exported);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } else {
      flash({ kind: "err", text: "Clipboard unavailable — use download instead." });
    }
  };

  const onDownload = () => {
    if (state.players.length === 0) {
      flash({ kind: "err", text: "Roster is empty — add players first." });
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJSON(`vbm-custom-players-${stamp}.json`, exported);
  };

  const onImportClick = () => fileRef.current?.click();

  const handleFile = async (file: File, mode: "append" | "replace") => {
    try {
      const text = await file.text();
      const players = parseImport(text);
      if (mode === "replace") replacePlayers(players);
      else appendPlayers(players);
      flash({
        kind: "ok",
        text: `${mode === "replace" ? "Replaced" : "Added"} ${players.length} player${players.length === 1 ? "" : "s"}.`,
      });
    } catch (e) {
      flash({
        kind: "err",
        text: e instanceof Error ? e.message : "Import failed.",
      });
    }
  };

  return (
    <section
      className="card overflow-hidden"
      style={{ borderColor: "var(--color-line)" }}
    >
      <header
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ borderColor: "var(--color-line)" }}
      >
        <div className="flex items-baseline gap-2">
          <h3 className="font-display text-[14px] font-semibold tracking-tight">
            Export & Import
          </h3>
          <span className="font-mono text-[10.5px] text-fg-faint">
            schema · volleyball-manager/custom-players@1
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCopy}
            className="btn btn-secondary !py-1.5 text-[12px]"
            disabled={state.players.length === 0}
          >
            {copied ? "copied ✓" : "copy JSON"}
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="btn btn-primary !py-1.5 text-[12px]"
            disabled={state.players.length === 0}
          >
            download .json
          </button>
        </div>
      </header>

      {/* — quota — */}
      <div
        className="px-4 py-3 border-b flex flex-wrap items-center gap-x-5 gap-y-2"
        style={{ borderColor: "var(--color-line)", background: "var(--color-surface-2)" }}
      >
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[20px] font-semibold tab-fig leading-none">
            {quota.teamsCovered}
          </span>
          <span className="text-[11px] uppercase tracking-[0.13em] text-fg-dim">
            teams covered
          </span>
          {quota.bottleneck && state.players.length > 0 && (
            <span
              className="ml-2 inline-flex items-center gap-1.5 text-[11px]"
              style={{ color: "var(--color-fg-dim)" }}
            >
              <span>bottleneck</span>
              <PositionBadge position={quota.bottleneck} />
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {POSITIONS.map((p) => (
            <div key={p} className="flex items-center gap-1.5">
              <PositionBadge position={p} />
              <span className="font-mono text-[11.5px] text-fg tab-fig">
                {quota.byPosition[p]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* — JSON preview — */}
      <div className="grid lg:grid-cols-[1fr_auto] gap-0">
        <pre
          className="overflow-auto scrollbar-thin px-4 py-3 text-[11.5px] font-mono leading-relaxed"
          style={{
            maxHeight: "20rem",
            background: "var(--color-bg)",
            color: "var(--color-fg-muted)",
          }}
        >
          {state.players.length === 0
            ? "// roster is empty — add players, then export here."
            : exported}
        </pre>

        {/* — import dock — */}
        <aside
          className="border-t lg:border-t-0 lg:border-l px-4 py-3 lg:w-[18rem]"
          style={{ borderColor: "var(--color-line)" }}
        >
          <h4 className="overline mb-2">Import JSON</h4>
          <p className="text-[11.5px] text-fg-dim leading-relaxed mb-3">
            Accepts either the template shape (object with a{" "}
            <span className="font-mono text-fg-muted">players</span> array) or a
            bare top-level array.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const mode = e.currentTarget.dataset.mode === "replace" ? "replace" : "append";
              handleFile(f, mode);
              e.currentTarget.value = "";
            }}
          />
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                if (fileRef.current) fileRef.current.dataset.mode = "append";
                onImportClick();
                e.preventDefault();
              }}
              className="btn btn-secondary !py-1.5 text-[12px] w-full"
            >
              append from file…
            </button>
            <button
              type="button"
              onClick={() => {
                if (
                  state.players.length > 0 &&
                  !confirm(`Replace current ${state.players.length} players with imported file?`)
                ) {
                  return;
                }
                if (fileRef.current) fileRef.current.dataset.mode = "replace";
                onImportClick();
              }}
              className="btn btn-ghost !py-1.5 text-[12px] w-full"
            >
              replace roster…
            </button>
          </div>
        </aside>
      </div>

      {toast && (
        <div
          className="px-4 py-2 text-[12px] border-t"
          style={{
            borderColor: "var(--color-line)",
            background:
              toast.kind === "ok" ? "rgba(139,184,154,0.10)" : "rgba(217,138,130,0.12)",
            color: toast.kind === "ok" ? "var(--color-success)" : "var(--color-danger)",
          }}
        >
          {toast.text}
        </div>
      )}
    </section>
  );
}
