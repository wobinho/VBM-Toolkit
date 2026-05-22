import type { BadgeOption } from "@/lib/badge-builder/types";

type Resolved = {
  shape: BadgeOption | null;
  motif: BadgeOption | null;
  primary: BadgeOption | null;
  secondary: BadgeOption | null;
  accent: BadgeOption | null;
};

type Props = {
  resolved: Resolved;
  teamName: string;
};

// Neutral fall-backs so the sketch still reads when a swatch is missing.
const FALLBACK = {
  primary: "#26262b",
  secondary: "#3a3a42",
  accent: "#5b5b66",
};

/** Pick black or white text for legibility against a hex background. */
function readable(hex: string): string {
  const m = hex.trim().match(/^#([0-9a-f]{6})$/i);
  if (!m) return "#f4f4f5";
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.58 ? "#16161a" : "#f4f4f5";
}

/** Derive a centre monogram from the team name. */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const C = 120;
const E = 104;

const poly = (pts: [number, number][]) =>
  pts.map(([x, y]) => `${C + x},${C + y}`).join(" ");

const polyAngles = (n: number, r: number, startDeg: number) => {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = ((startDeg + (i * 360) / n) * Math.PI) / 180;
    out.push(
      `${(C + r * Math.cos(a)).toFixed(1)},${(C + r * Math.sin(a)).toFixed(1)}`
    );
  }
  return out.join(" ");
};

const shieldPath = (e: number) =>
  `M ${C - e},${C - e} L ${C + e},${C - e} L ${C + e},${C - e * 0.05} ` +
  `Q ${C + e},${C + e * 0.62} ${C},${C + e} ` +
  `Q ${C - e},${C + e * 0.62} ${C - e},${C - e * 0.05} Z`;

const crestPath = (e: number) =>
  `M ${C - e},${C - e * 0.78} Q ${C},${C - e * 1.04} ${C + e},${C - e * 0.78} ` +
  `L ${C + e},${C + e * 0.18} Q ${C + e},${C + e * 0.78} ${C},${C + e} ` +
  `Q ${C - e},${C + e * 0.78} ${C - e},${C + e * 0.18} Z`;

const bannerPath = (e: number) =>
  `M ${C - e * 0.84},${C - e} L ${C + e * 0.84},${C - e} ` +
  `L ${C + e * 0.84},${C + e} L ${C},${C + e * 0.5} ` +
  `L ${C - e * 0.84},${C + e} Z`;

type ShapeAttrs = {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity?: number;
};

/** Render the badge silhouette for the chosen shape at scale `k`. */
function ShapeNode({
  shape,
  k,
  attrs,
}: {
  shape: string;
  k: number;
  attrs: ShapeAttrs;
}) {
  const e = E * k;
  const common = {
    ...attrs,
    strokeLinejoin: "round" as const,
  };
  const s = shape.toLowerCase();

  if (s.includes("circ")) return <circle cx={C} cy={C} r={e} {...common} />;
  if (s.includes("oval"))
    return <ellipse cx={C} cy={C} rx={e} ry={e * 0.8} {...common} />;
  if (s.includes("round"))
    return (
      <rect
        x={C - e}
        y={C - e}
        width={2 * e}
        height={2 * e}
        rx={e * 0.22}
        {...common}
      />
    );
  if (s.includes("diamond"))
    return (
      <polygon
        points={poly([
          [0, -e],
          [e, 0],
          [0, e],
          [-e, 0],
        ])}
        {...common}
      />
    );
  if (s.includes("hex"))
    return <polygon points={polyAngles(6, e, -90)} {...common} />;
  if (s.includes("oct"))
    return <polygon points={polyAngles(8, e, -67.5)} {...common} />;
  if (s.includes("shield"))
    return <path d={shieldPath(e)} {...common} />;
  if (s.includes("crest"))
    return <path d={crestPath(e)} {...common} />;
  if (s.includes("banner"))
    return <path d={bannerPath(e)} {...common} />;
  return <circle cx={C} cy={C} r={e} {...common} />;
}

/**
 * A schematic, pure-SVG crest sketch that updates live from the selections.
 * It is intentionally rough — the AI model renders the finished artwork.
 */
export function CrestPreview({ resolved, teamName }: Props) {
  const primary = resolved.primary?.swatch || FALLBACK.primary;
  const secondary = resolved.secondary?.swatch || FALLBACK.secondary;
  const accent = resolved.accent?.swatch || FALLBACK.accent;

  const shapeLabel = resolved.shape?.label ?? "circular";
  const motifLabel = resolved.motif?.label ?? "random";
  const name = teamName.trim();
  const mono = initials(name);
  const ink = readable(primary);

  return (
    <svg
      viewBox="0 0 240 240"
      className="w-full h-auto"
      role="img"
      aria-label={`Crest preview — ${shapeLabel} badge`}
    >
      {/* outer silhouette */}
      <ShapeNode
        shape={shapeLabel}
        k={1}
        attrs={{ fill: primary, stroke: accent, strokeWidth: 3 }}
      />
      {/* inner outline */}
      <ShapeNode
        shape={shapeLabel}
        k={0.82}
        attrs={{
          fill: "none",
          stroke: accent,
          strokeWidth: 1.4,
          opacity: 0.55,
        }}
      />

      {/* team name — straight, above centre */}
      {name && (
        <text
          x={C}
          y={C - 34}
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill={ink}
          style={{ fontFamily: "var(--font-display)", letterSpacing: "2px" }}
        >
          {name.toUpperCase().slice(0, 18)}
        </text>
      )}

      {/* centre monogram, or a mark when there is no team name */}
      {mono ? (
        <text
          x={C}
          y={C + 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={mono.length > 2 ? 38 : 50}
          fontWeight="800"
          fill={accent}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {mono}
        </text>
      ) : (
        <g>
          <polygon
            points={poly([
              [0, -16],
              [16, 0],
              [0, 16],
              [-16, 0],
            ])}
            fill="none"
            stroke={accent}
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <circle cx={C} cy={C} r={3.4} fill={accent} />
        </g>
      )}

      {/* motif label — straight, below centre */}
      <text
        x={C}
        y={C + 40}
        textAnchor="middle"
        fontSize="9"
        fontWeight="600"
        fill={ink}
        opacity={0.85}
        style={{ fontFamily: "var(--font-mono)", letterSpacing: "1.6px" }}
      >
        {motifLabel.toUpperCase().slice(0, 24)}
      </text>

      {/* secondary accent — a thin underline tick in the secondary colour */}
      <rect
        x={C - 22}
        y={C + 50}
        width={44}
        height={3}
        rx={1.5}
        fill={secondary}
      />
    </svg>
  );
}
