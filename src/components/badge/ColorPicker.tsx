"use client";

import { useEffect, useRef, useState } from "react";
import {
  hexToRgb,
  hsvToRgb,
  normalizeHex,
  rgbToHex,
  rgbToHsv,
  type HSV,
  type RGB,
} from "@/lib/badge-builder/color";

type Props = {
  /** Current colour as #rrggbb. */
  value: string;
  /** Fires on every adjustment with a canonical #rrggbb. */
  onChange: (hex: string) => void;
};

/** Minimal typing for the experimental EyeDropper API. */
type EyeDropperResult = { sRGBHex: string };
type EyeDropperLike = { open: () => Promise<EyeDropperResult> };

/**
 * A self-contained colour picker — a saturation/value square, a hue slider and
 * hex + RGB inputs. HSV is held locally so dragging into the black or white
 * corners never loses the hue.
 */
export function ColorPicker({ value, onChange }: Props) {
  const [hsv, setHsv] = useState<HSV>(() => rgbToHsv(hexToRgb(value)));
  const [hexDraft, setHexDraft] = useState(value);
  const [hasEyeDropper, setHasEyeDropper] = useState(false);

  useEffect(() => {
    setHasEyeDropper(
      typeof window !== "undefined" && "EyeDropper" in window
    );
  }, []);

  // Re-sync from the prop when an outside change (preset, saved swatch, loaded
  // palette) lands on a colour our local HSV doesn't already represent.
  useEffect(() => {
    const norm = normalizeHex(value);
    if (!norm) return;
    if (rgbToHex(hsvToRgb(hsv)).toLowerCase() !== norm.toLowerCase()) {
      setHsv(rgbToHsv(hexToRgb(norm)));
      setHexDraft(norm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const hex = rgbToHex(hsvToRgb(hsv));
  const rgb = hsvToRgb(hsv);

  /** Push an HSV update out. `syncDraft` rewrites the hex field — skipped while
   *  the user is typing in it, so their input is never overwritten mid-edit. */
  const applyHsv = (next: HSV, syncDraft: boolean) => {
    setHsv(next);
    const out = rgbToHex(hsvToRgb(next));
    if (syncDraft) setHexDraft(out);
    onChange(out);
  };

  const commit = (next: HSV) => applyHsv(next, true);
  const commitRgb = (next: RGB) => applyHsv(rgbToHsv(next), true);

  /* — saturation / value square — */

  const svRef = useRef<HTMLDivElement>(null);
  const trackSV = (clientX: number, clientY: number) => {
    const el = svRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    commit({ h: hsv.h, s: x * 100, v: (1 - y) * 100 });
  };

  /* — hue slider — */

  const hueRef = useRef<HTMLDivElement>(null);
  const trackHue = (clientX: number) => {
    const el = hueRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    commit({ ...hsv, h: x * 360 });
  };

  /* — hex field — */

  const onHexChange = (raw: string) => {
    setHexDraft(raw);
    const norm = normalizeHex(raw);
    if (norm) applyHsv(rgbToHsv(hexToRgb(norm)), false);
  };
  const onHexBlur = () => {
    const norm = normalizeHex(hexDraft);
    setHexDraft(norm ?? hex);
  };

  /* — RGB fields — */

  const onRgbChange = (channel: keyof RGB, raw: string) => {
    const n = Math.max(0, Math.min(255, Math.round(Number(raw) || 0)));
    commitRgb({ ...rgb, [channel]: n });
  };

  /* — eyedropper — */

  const pickFromScreen = async () => {
    const Ctor = (
      window as unknown as { EyeDropper?: new () => EyeDropperLike }
    ).EyeDropper;
    if (!Ctor) return;
    try {
      const result = await new Ctor().open();
      const norm = normalizeHex(result.sRGBHex);
      if (norm) commit(rgbToHsv(hexToRgb(norm)));
    } catch {
      /* user dismissed the eyedropper — ignore */
    }
  };

  return (
    <div className="space-y-3">
      {/* saturation / value square */}
      <div
        ref={svRef}
        aria-hidden
        className="relative w-full h-[140px] rounded-md cursor-crosshair touch-none select-none"
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), hsl(${hsv.h} 100% 50%)`,
          border: "1px solid var(--color-line-2)",
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          trackSV(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) trackSV(e.clientX, e.clientY);
        }}
      >
        <span
          className="absolute w-3.5 h-3.5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`,
            background: hex,
            border: "2px solid #fff",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.45)",
          }}
        />
      </div>

      {/* hue slider */}
      <div
        ref={hueRef}
        role="slider"
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hsv.h)}
        tabIndex={0}
        className="relative h-3.5 rounded-full cursor-pointer touch-none select-none"
        style={{
          background:
            "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          trackHue(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) trackHue(e.clientX);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft")
            commit({ ...hsv, h: (hsv.h + 355) % 360 });
          else if (e.key === "ArrowRight")
            commit({ ...hsv, h: (hsv.h + 5) % 360 });
        }}
      >
        <span
          className="absolute top-1/2 w-4 h-4 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${(hsv.h / 360) * 100}%`,
            background: `hsl(${hsv.h} 100% 50%)`,
            border: "2px solid #fff",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.45)",
          }}
        />
      </div>

      {/* hex + eyedropper */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="field-label">Hex</label>
          <div className="flex items-center gap-2">
            <span
              className="w-8 h-8 rounded-md shrink-0"
              style={{
                background: hex,
                border: "1px solid var(--color-line-2)",
              }}
              aria-hidden
            />
            <input
              className="field-input font-mono text-[12px] uppercase py-1.5"
              value={hexDraft}
              spellCheck={false}
              onChange={(e) => onHexChange(e.target.value)}
              onBlur={onHexBlur}
              aria-label="Hex colour code"
            />
          </div>
        </div>
        {hasEyeDropper && (
          <button
            type="button"
            className="btn btn-secondary shrink-0 self-end"
            onClick={pickFromScreen}
            title="Pick a colour from anywhere on screen"
          >
            <EyeDropperIcon />
          </button>
        )}
      </div>

      {/* RGB */}
      <div className="grid grid-cols-3 gap-2">
        {(["r", "g", "b"] as const).map((ch) => (
          <div key={ch}>
            <label className="field-label uppercase">{ch}</label>
            <input
              type="number"
              min={0}
              max={255}
              className="field-input font-mono text-[12px] py-1.5"
              value={Math.round(rgb[ch])}
              onChange={(e) => onRgbChange(ch, e.target.value)}
              aria-label={`${ch.toUpperCase()} channel`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function EyeDropperIcon() {
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
      <path d="m2 22 1-1h3l9-9" />
      <path d="M3 21v-3l9-9" />
      <path d="m15 6 3.4-3.4a2.1 2.1 0 0 1 3 3L21 6l-3-3" />
      <path d="m18 9 .4.4a2.1 2.1 0 0 1 0 3L17 14l-6-6 1.6-1.4a2.1 2.1 0 0 1 3 0Z" />
    </svg>
  );
}
