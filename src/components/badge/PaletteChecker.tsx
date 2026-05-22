"use client";

import { useMemo } from "react";
import {
  reviewPalette,
  type PaletteColorRole,
} from "@/lib/badge-builder/color";

type Props = {
  primary: string;
  secondary: string;
  accent: string;
  locks?: Partial<Record<PaletteColorRole, boolean>>;
  onApplyFix?: (role: PaletteColorRole, hex: string) => void;
};

/** Tone → CSS colour token. */
const TONE: Record<"good" | "ok" | "bad", { fg: string; bg: string; bd: string }> =
  {
    good: {
      fg: "var(--color-success)",
      bg: "rgba(139, 184, 154, 0.12)",
      bd: "rgba(139, 184, 154, 0.30)",
    },
    ok: {
      fg: "var(--color-accent-strong)",
      bg: "rgba(127, 168, 204, 0.12)",
      bd: "rgba(127, 168, 204, 0.30)",
    },
    bad: {
      fg: "var(--color-danger)",
      bg: "rgba(217, 138, 130, 0.12)",
      bd: "rgba(217, 138, 130, 0.30)",
    },
  };

const ROLE_LABEL: Record<PaletteColorRole, string> = {
  primary: "Primary",
  secondary: "Secondary",
  accent: "Accent",
};

/**
 * Reviews the primary / secondary / accent combination — palette-harmony type
 * (Figma's scheme families) and WCAG contrast (the AA / AAA grades a checker
 * like Deque's reports) — and surfaces a plain "is this good?" verdict.
 */
export function PaletteChecker({
  primary,
  secondary,
  accent,
  locks = {},
  onApplyFix,
}: Props) {
  const report = useMemo(
    () => reviewPalette(primary, secondary, accent),
    [primary, secondary, accent]
  );
  const verdictTone = TONE[report.verdictTone];
  const showFixes = report.fixes.length > 0 && !!onApplyFix;

  return (
    <div className="card overflow-hidden">
      {/* header + verdict */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 border-b"
        style={{ borderColor: "var(--color-line)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium">Palette check</span>
          <span className="font-mono text-[10px] text-fg-faint">
            harmony · contrast
          </span>
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-medium"
          style={{
            color: verdictTone.fg,
            background: verdictTone.bg,
            border: `1px solid ${verdictTone.bd}`,
          }}
        >
          <Dot color={verdictTone.fg} />
          {report.verdict}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* score + verdict note */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ScoreBar score={report.score} tone={verdictTone.fg} />
            <span className="font-mono text-[11px] text-fg-dim tab-fig shrink-0">
              {report.score}/5
            </span>
          </div>
          <p className="text-[12px] text-fg-muted leading-relaxed">
            {report.verdictNote}
          </p>
        </div>

        {/* palette type */}
        <div
          className="rounded-md p-3"
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-line)",
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="overline">Palette type</span>
            <span className="tag tag-accent text-[10px]">
              {report.classification.type}
            </span>
          </div>
          <p className="text-[12px] text-fg-muted leading-relaxed">
            {report.classification.summary}
          </p>
        </div>

        {/* contrast pairs */}
        <div>
          <div className="overline mb-2">Contrast — WCAG</div>
          <div className="space-y-1.5">
            {report.pairs.map((pair) => {
              const tone = TONE[pair.grade.tone];
              return (
                <div
                  key={pair.label}
                  className="flex items-center gap-2.5"
                  title={pair.grade.note}
                >
                  <span className="flex shrink-0">
                    <span
                      className="w-5 h-5 rounded-l-[4px]"
                      style={{
                        background: pair.a,
                        border: "1px solid var(--color-line-2)",
                      }}
                    />
                    <span
                      className="w-5 h-5 rounded-r-[4px] -ml-px"
                      style={{
                        background: pair.b,
                        border: "1px solid var(--color-line-2)",
                      }}
                    />
                  </span>
                  <span className="text-[12px] text-fg-muted flex-1 min-w-0 truncate">
                    {pair.label}
                  </span>
                  <span className="font-mono text-[11px] text-fg-dim tab-fig shrink-0">
                    {pair.grade.ratio.toFixed(2)}:1
                  </span>
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium shrink-0 w-[64px] justify-center"
                    style={{
                      color: tone.fg,
                      background: tone.bg,
                      border: `1px solid ${tone.bd}`,
                    }}
                  >
                    {pair.grade.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* fix suggestions */}
        {showFixes && (
          <div>
            <div className="overline mb-2">Suggested fixes</div>
            <ul className="space-y-2">
              {report.fixes.map((fix) => {
                const locked = !!locks[fix.role];
                return (
                  <li
                    key={fix.id}
                    className="rounded-md p-3"
                    style={{
                      background: "var(--color-surface-2)",
                      border: "1px solid var(--color-line)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <span className="text-[12px] font-medium text-fg">
                          {fix.label}
                        </span>
                        <span className="ml-1.5 tag text-[10px]">
                          {ROLE_LABEL[fix.role]}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className="w-5 h-5 rounded-[4px] border border-line-2"
                          style={{ background: fix.currentHex }}
                          title="Current"
                        />
                        <span className="text-fg-faint text-[10px]">→</span>
                        <span
                          className="w-5 h-5 rounded-[4px] border border-line-2"
                          style={{ background: fix.suggestedHex }}
                          title="Suggested"
                        />
                      </div>
                    </div>
                    <p className="text-[11.5px] text-fg-muted leading-relaxed mb-2">
                      {fix.reason}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-fg-dim">
                        {fix.currentHex} → {fix.suggestedHex}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary text-[11px] px-2.5 py-1 shrink-0"
                        disabled={locked}
                        onClick={() => onApplyFix(fix.role, fix.suggestedHex)}
                        title={
                          locked
                            ? `${ROLE_LABEL[fix.role]} is locked`
                            : `Apply to ${ROLE_LABEL[fix.role]}`
                        }
                      >
                        Apply
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* notes */}
        <div>
          <div className="overline mb-2">Notes</div>
          <ul className="space-y-1.5">
            {report.tips.map((tip, i) => (
              <li
                key={i}
                className="flex gap-2 text-[12px] text-fg-muted leading-relaxed"
              >
                <span className="text-fg-faint shrink-0 mt-px">—</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full"
      style={{ background: color }}
      aria-hidden
    />
  );
}

function ScoreBar({ score, tone }: { score: number; tone: string }) {
  return (
    <div className="flex items-center gap-1 flex-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className="h-1.5 flex-1 rounded-full"
          style={{
            background: i < score ? tone : "var(--color-surface-3)",
          }}
        />
      ))}
    </div>
  );
}
