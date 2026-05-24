"use client";

/** Segmented control that doubles as the "modified random" picker for age and
 *  height. Hover-popped tooltip shows the bucket's full label. */
export function BucketDial<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (next: T) => void;
  options: readonly { id: T; label: string }[];
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="field-label !mb-0">{label}</span>
        <span className="font-mono text-[10.5px] text-fg-faint">
          {options.find((o) => o.id === value)?.label ?? ""}
        </span>
      </div>
      <div
        className="flex rounded-md overflow-hidden"
        style={{ border: "1px solid var(--color-line-2)" }}
        role="radiogroup"
        aria-label={label}
      >
        {options.map((o, i) => {
          const active = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.id)}
              title={o.label}
              className="flex-1 px-2 py-1.5 text-[11px] font-mono transition-colors"
              style={{
                background: active ? "rgba(127,168,204,0.16)" : "transparent",
                color: active ? "var(--color-accent-strong)" : "var(--color-fg-muted)",
                borderLeft: i === 0 ? undefined : "1px solid var(--color-line)",
              }}
            >
              {o.label.split(" ")[0]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
