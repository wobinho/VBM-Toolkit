"use client";

import { POSITION_SHORT } from "@/lib/player-forge/constants";
import type { Position } from "@/lib/player-forge/types";

const COLORS: Record<Position, string> = {
  "Outside Hitter": "#7fa8cc",
  "Middle Blocker": "#a3c69a",
  "Opposite Hitter": "#cfb98a",
  Setter: "#c69ac7",
  Libero: "#d98a82",
};

export function PositionBadge({
  position,
  size = "sm",
}: {
  position: Position;
  size?: "sm" | "md";
}) {
  const color = COLORS[position];
  const sizes =
    size === "md"
      ? "text-[12px] px-2 py-0.5 min-w-[42px]"
      : "text-[10.5px] px-1.5 py-0.5 min-w-[36px]";
  return (
    <span
      className={`inline-flex items-center justify-center rounded font-mono font-semibold tab-fig tracking-wide ${sizes}`}
      style={{
        background: `${color}1a`,
        color: color,
        border: `1px solid ${color}44`,
      }}
      title={position}
    >
      {POSITION_SHORT[position]}
    </span>
  );
}
