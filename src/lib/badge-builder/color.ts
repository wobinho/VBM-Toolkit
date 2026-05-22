/**
 * Colour maths for the Badge Builder — hex/rgb/hsl/hsv conversion, WCAG
 * contrast scoring, descriptive naming and palette-harmony classification.
 *
 * Pure functions, no React. The palette model follows two references:
 *  - Figma's "types of color palettes" (monochromatic, analogous,
 *    complementary, split-complementary, triadic) for harmony classification.
 *  - The WCAG 2.x contrast-ratio formula (as used by Deque's contrast checker)
 *    for the AA / AAA legibility grades.
 */

export type RGB = { r: number; g: number; b: number };
export type HSL = { h: number; s: number; l: number };
export type HSV = { h: number; s: number; v: number };

/* -------------------------------------------------------------------------- */
/*  Hex parsing                                                               */
/* -------------------------------------------------------------------------- */

/** Coerce loose input ("fff", "#ABC", " 1d4ed8 ") to a canonical #rrggbb,
 *  or null when it isn't a colour. */
export function normalizeHex(input: string): string | null {
  let s = input.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(s)) {
    s = s
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return /^[0-9a-f]{6}$/.test(s) ? `#${s}` : null;
}

/** True when input parses as a hex colour. */
export function isHex(input: string): boolean {
  return normalizeHex(input) !== null;
}

export function hexToRgb(hex: string): RGB {
  const n = normalizeHex(hex) ?? "#000000";
  const v = parseInt(n.slice(1), 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const ch = (x: number) =>
    Math.max(0, Math.min(255, Math.round(x)))
      .toString(16)
      .padStart(2, "0");
  return `#${ch(r)}${ch(g)}${ch(b)}`;
}

/* -------------------------------------------------------------------------- */
/*  HSV  ⇄  RGB  — drives the picker's saturation/value square                */
/* -------------------------------------------------------------------------- */

export function rgbToHsv({ r, g, b }: RGB): HSV {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s: s * 100, v: max * 100 };
}

export function hsvToRgb({ h, s, v }: HSV): RGB {
  const sn = s / 100;
  const vn = v / 100;
  const c = vn * sn;
  const hh = ((((h % 360) + 360) % 360) / 60);
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hh < 1) [r, g, b] = [c, x, 0];
  else if (hh < 2) [r, g, b] = [x, c, 0];
  else if (hh < 3) [r, g, b] = [0, c, x];
  else if (hh < 4) [r, g, b] = [0, x, c];
  else if (hh < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = vn - c;
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

/* -------------------------------------------------------------------------- */
/*  HSL — used for naming and harmony classification                          */
/* -------------------------------------------------------------------------- */

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

export const hexToHsl = (hex: string): HSL => rgbToHsl(hexToRgb(hex));

/* -------------------------------------------------------------------------- */
/*  WCAG contrast                                                             */
/* -------------------------------------------------------------------------- */

function channelLuminance(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance per WCAG 2.x. */
export function relativeLuminance(rgb: RGB): number {
  return (
    0.2126 * channelLuminance(rgb.r) +
    0.7152 * channelLuminance(rgb.g) +
    0.0722 * channelLuminance(rgb.b)
  );
}

/** WCAG contrast ratio between two hex colours — 1 (identical) … 21 (b/w). */
export function contrastRatio(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexToRgb(hexA));
  const lb = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export type ContrastGrade = {
  ratio: number;
  /** "AAA" | "AA" | "AA Large" | "Fail" */
  label: string;
  /** Passes AA for normal-size text/marks. */
  pass: boolean;
  /** "good" | "ok" | "bad" — drives the badge colour. */
  tone: "good" | "ok" | "bad";
  note: string;
};

/** Grade a contrast ratio against the WCAG thresholds Deque's checker reports. */
export function gradeContrast(ratio: number): ContrastGrade {
  if (ratio >= 7)
    return {
      ratio,
      label: "AAA",
      pass: true,
      tone: "good",
      note: "Passes AAA — crisp at any size.",
    };
  if (ratio >= 4.5)
    return {
      ratio,
      label: "AA",
      pass: true,
      tone: "good",
      note: "Passes AA for normal text and small marks.",
    };
  if (ratio >= 3)
    return {
      ratio,
      label: "AA Large",
      pass: false,
      tone: "ok",
      note: "Only safe for large or bold shapes.",
    };
  return {
    ratio,
    label: "Fail",
    pass: false,
    tone: "bad",
    note: "Too close — these colours blend together.",
  };
}

/** Pick black or white ink for legible text on a hex background. */
export function readableInk(hex: string): string {
  return relativeLuminance(hexToRgb(hex)) > 0.34 ? "#16161a" : "#f4f4f5";
}

/* -------------------------------------------------------------------------- */
/*  Descriptive naming                                                        */
/* -------------------------------------------------------------------------- */

function hueLabel(h: number): string {
  const names: [number, string][] = [
    [15, "red"],
    [40, "orange"],
    [62, "yellow"],
    [90, "lime"],
    [152, "green"],
    [186, "teal"],
    [205, "cyan"],
    [248, "blue"],
    [278, "indigo"],
    [312, "violet"],
    [338, "magenta"],
    [360, "red"],
  ];
  for (const [max, name] of names) if (h < max) return name;
  return "red";
}

/** A human-readable name for a hex colour — "deep blue", "vivid red",
 *  "light grey". Used as the prompt fragment for custom-picked colours. */
export function describeColor(hex: string): string {
  const { h, s, l } = hexToHsl(hex);
  if (l >= 96) return "white";
  if (l <= 5) return "black";
  if (s <= 9) {
    if (l < 22) return "near-black grey";
    if (l < 42) return "dark grey";
    if (l < 62) return "mid grey";
    if (l < 82) return "light grey";
    return "off-white";
  }
  const lightWord =
    l < 20 ? "deep" : l < 38 ? "dark" : l < 60 ? "" : l < 78 ? "light" : "pale";
  const satWord = s < 32 ? "muted" : s > 82 ? "vivid" : "";
  return [lightWord, satWord, hueLabel(h)].filter(Boolean).join(" ");
}

/* -------------------------------------------------------------------------- */
/*  Palette harmony classification                                            */
/* -------------------------------------------------------------------------- */

/** Shortest distance between two hues around the 360° wheel. */
function hueGap(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** Circular midpoint of two hues. */
function midHue(a: number, b: number): number {
  let d = b - a;
  if (Math.abs(d) > 180) d -= Math.sign(d) * 360;
  return (((a + d / 2) % 360) + 360) % 360;
}

export type PaletteType =
  | "Monochromatic"
  | "Analogous"
  | "Complementary"
  | "Split-complementary"
  | "Triadic"
  | "Neutral"
  | "Eclectic";

export type PaletteClass = {
  type: PaletteType;
  summary: string;
  /** harmonious — a recognised scheme; neutral — safe but plain;
   *  clashing — no scheme, likely accidental. */
  harmony: "harmonious" | "neutral" | "clashing";
};

/** Classify a set of colours into the closest Figma-style palette type. */
export function classifyPalette(hexes: string[]): PaletteClass {
  const hsl = hexes.map(hexToHsl);
  // A colour counts as "chromatic" only when it carries real hue.
  const chromatic = hsl.filter((c) => c.s > 12 && c.l > 8 && c.l < 94);

  if (chromatic.length === 0)
    return {
      type: "Neutral",
      summary:
        "An all-neutral set — greys, blacks and whites with no colour cast.",
      harmony: "neutral",
    };

  if (chromatic.length === 1)
    return {
      type: "Neutral",
      summary:
        "One colour carried by neutrals — a restrained, low-risk accent palette.",
      harmony: "neutral",
    };

  const hues = chromatic.map((c) => c.h);
  const near = (x: number, target: number, tol: number) =>
    Math.abs(x - target) <= tol;

  if (chromatic.length === 2) {
    const g = hueGap(hues[0], hues[1]);
    if (g <= 20)
      return {
        type: "Monochromatic",
        summary: "Two shades of a single hue — calm and cohesive.",
        harmony: "harmonious",
      };
    if (g <= 65)
      return {
        type: "Analogous",
        summary: "Neighbouring hues — naturally harmonious, low tension.",
        harmony: "harmonious",
      };
    if (g >= 150)
      return {
        type: "Complementary",
        summary: "Opposite hues — maximum contrast and energy.",
        harmony: "harmonious",
      };
    return {
      type: "Eclectic",
      summary:
        "A mid-distance hue pair — distinct, but not a textbook harmony.",
      harmony: "neutral",
    };
  }

  // Three chromatic colours — measure the spread around the wheel.
  const sorted = [...hues].sort((a, b) => a - b);
  const gaps = [
    sorted[1] - sorted[0],
    sorted[2] - sorted[1],
    360 - sorted[2] + sorted[0],
  ];
  const spread = 360 - Math.max(...gaps);

  if (spread <= 25)
    return {
      type: "Monochromatic",
      summary: "Three tones of one hue — extremely cohesive.",
      harmony: "harmonious",
    };
  if (spread <= 95)
    return {
      type: "Analogous",
      summary: "Three adjacent hues — smooth, harmonious and easy on the eye.",
      harmony: "harmonious",
    };
  if (gaps.every((g) => near(g, 120, 40)))
    return {
      type: "Triadic",
      summary: "Three evenly-spaced hues — vivid, balanced and bold.",
      harmony: "harmonious",
    };

  // Split-complementary: two hues sit close, the third near their opposite.
  const trios: [number, number, number][] = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 2, 0],
  ];
  for (const [a, b, c] of trios) {
    const closeGap = hueGap(sorted[a], sorted[b]);
    if (closeGap <= 70) {
      const opp = hueGap(midHue(sorted[a], sorted[b]), sorted[c]);
      if (near(opp, 180, 40)) {
        if (closeGap <= 18)
          return {
            type: "Complementary",
            summary:
              "Two opposite hues, one doubled as a shade — punchy and clear.",
            harmony: "harmonious",
          };
        return {
          type: "Split-complementary",
          summary:
            "A base hue against two neighbours of its opposite — high contrast, less harsh than pure complementary.",
          harmony: "harmonious",
        };
      }
    }
  }

  return {
    type: "Eclectic",
    summary:
      "A wide, uneven hue spread — striking, but it can read as accidental. Lock the pair you like and re-roll the third.",
    harmony: "clashing",
  };
}

/* -------------------------------------------------------------------------- */
/*  Full palette review                                                       */
/* -------------------------------------------------------------------------- */

export type PairReport = {
  /** "Primary · Secondary" etc. */
  label: string;
  a: string;
  b: string;
  grade: ContrastGrade;
};

export type PaletteReport = {
  classification: PaletteClass;
  /** Contrast for the three colour pairs. */
  pairs: PairReport[];
  /** 0–5. */
  score: number;
  verdict: "Strong" | "Workable" | "Needs work";
  verdictTone: "good" | "ok" | "bad";
  verdictNote: string;
  /** Specific, actionable notes — what's good or what to fix. */
  tips: string[];
};

/** Score a primary / secondary / accent combination for harmony, contrast and
 *  legibility, and return an actionable report — the "is this good?" verdict. */
export function reviewPalette(
  primary: string,
  secondary: string,
  accent: string
): PaletteReport {
  const classification = classifyPalette([primary, secondary, accent]);

  const pair = (a: string, b: string, label: string): PairReport => ({
    label,
    a,
    b,
    grade: gradeContrast(contrastRatio(a, b)),
  });
  const pairs = [
    pair(primary, secondary, "Primary · Secondary"),
    pair(primary, accent, "Primary · Accent"),
    pair(secondary, accent, "Secondary · Accent"),
  ];

  const lightness = [primary, secondary, accent].map((h) => hexToHsl(h).l);
  const lightnessRange = Math.max(...lightness) - Math.min(...lightness);

  let score = 0;
  const tips: string[] = [];

  // 1 — harmony (0–2)
  if (classification.harmony === "harmonious") score += 2;
  else if (classification.harmony === "neutral") score += 1;
  else
    tips.push(
      "The hues don't form a recognised scheme — try pulling them into an analogous, complementary or triadic set."
    );

  // 2 — accent visibility (0–2). The accent must read against the primary.
  const primaryAccent = pairs[1].grade.ratio;
  if (primaryAccent >= 4.5) score += 2;
  else if (primaryAccent >= 3) {
    score += 1;
    tips.push(
      "Primary vs accent clears large shapes only — deepen or lighten the accent for fine detail."
    );
  } else
    tips.push(
      "Primary and accent are too close in tone — the accent won't stand out on the badge."
    );

  // 3 — legibility spread (0–1). Three similar-brightness colours muddy.
  if (lightnessRange >= 28) score += 1;
  else
    tips.push(
      "All three colours sit at a similar brightness — vary the lightness so shapes stay legible."
    );

  score = Math.max(0, Math.min(5, score));

  const verdict =
    score >= 4 ? "Strong" : score >= 2 ? "Workable" : "Needs work";
  const verdictTone =
    verdict === "Strong" ? "good" : verdict === "Workable" ? "ok" : "bad";
  const verdictNote =
    verdict === "Strong"
      ? "Balanced harmony and clear contrast — this set will render cleanly."
      : verdict === "Workable"
      ? "A usable palette with room to sharpen — see the notes below."
      : "This combination is likely to muddy or clash — adjust before generating.";

  if (tips.length === 0)
    tips.push(
      "Well balanced — harmonious hues with enough contrast to stay crisp."
    );

  return {
    classification,
    pairs,
    score,
    verdict,
    verdictTone: verdictTone as "good" | "ok" | "bad",
    verdictNote,
    tips,
  };
}
