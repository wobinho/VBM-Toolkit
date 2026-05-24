"use client";

/** Rounded square showing an overall rating 1–99 with a colour band tied to
 *  tiers: 85+ elite, 75–84 strong, 65–74 solid, 55–64 squad, <55 fringe. */
export function OverallPill({
  value,
  size = "md",
}: {
  value: number;
  size?: "sm" | "md" | "lg";
}) {
  const color =
    value >= 85
      ? "#a3c4e0" // accent-strong
      : value >= 75
        ? "#8bb89a" // success
        : value >= 65
          ? "#cfb98a" // gold-ish
          : value >= 55
            ? "#9c9c98" // fg-muted
            : "#6b6b67"; // fg-dim

  const sizing =
    size === "lg"
      ? "w-14 h-14 text-[24px]"
      : size === "md"
        ? "w-10 h-10 text-[16px]"
        : "w-8 h-8 text-[13px]";

  return (
    <div
      className={`grid place-items-center rounded-md font-display font-semibold tab-fig leading-none ${sizing}`}
      style={{
        color,
        background: `${color}15`,
        border: `1px solid ${color}55`,
      }}
      aria-label={`Overall ${value}`}
    >
      {value}
    </div>
  );
}
