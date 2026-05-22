"use client";

import { useMemo, useState } from "react";
import { useBadgeStudio } from "@/lib/badge-builder/store";
import { DEFAULT_BADGE_TEMPLATE } from "@/lib/badge-builder/presets";
import type { BadgeCategory } from "@/lib/badge-builder/types";

type Props = { bb: ReturnType<typeof useBadgeStudio> };

export function BadgeLibrary({ bb }: Props) {
  const { library } = bb.state;
  const [activeId, setActiveId] = useState<string>(
    library.categories[0]?.id ?? ""
  );

  const active = useMemo(
    () =>
      library.categories.find((c) => c.id === activeId) ??
      library.categories[0] ??
      null,
    [library.categories, activeId]
  );

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* — category rail + base template — */}
      <div className="col-span-12 lg:col-span-5 space-y-6">
        <section>
          <div
            className="flex items-end justify-between pb-3 mb-4 border-b"
            style={{ borderColor: "var(--color-line-2)" }}
          >
            <div>
              <div className="overline mb-1.5">Library</div>
              <h2 className="font-display text-[20px] font-semibold tracking-tight">
                Fields &amp; values
              </h2>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                if (
                  confirm(
                    "Reset every field, value and the base template to factory defaults?"
                  )
                )
                  bb.resetLibrary();
              }}
              title="Reset the library to factory defaults"
            >
              <ResetIcon />
              Reset
            </button>
          </div>

          <ul className="card overflow-hidden">
            {library.categories.map((c, i) => {
              const isActive = c.id === active?.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(c.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      i > 0 ? "border-t" : ""
                    } ${isActive ? "bg-surface-2" : "hover:bg-surface-2"}`}
                    style={{ borderColor: "var(--color-line)" }}
                  >
                    <span
                      className={`font-mono text-[10px] tab-fig w-5 text-right ${
                        isActive ? "text-accent-strong" : "text-fg-faint"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-medium truncate">
                        {c.label}
                      </span>
                      <span className="block font-mono text-[10px] text-fg-dim truncate mt-0.5">
                        {c.slot} · {c.options.length} value
                        {c.options.length === 1 ? "" : "s"}
                      </span>
                    </span>
                    {c.kind === "color" && (
                      <span className="tag text-[10px]">colour</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card p-4">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="font-display text-[15px] font-semibold tracking-tight">
              Base template
            </h3>
            <button
              type="button"
              className="btn btn-ghost text-[12px]"
              onClick={bb.resetTemplate}
              disabled={library.basePromptTemplate === DEFAULT_BADGE_TEMPLATE}
            >
              <ResetIcon />
              Reset
            </button>
          </div>
          <p className="text-[12px] text-fg-muted mb-3 leading-relaxed">
            Tokens in square brackets are swapped for the selected value — keep
            them intact. Team name is woven in automatically when enabled.
          </p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {library.categories.map((c) => (
              <span
                key={c.id}
                className="tag tag-accent font-mono text-[10px]"
              >
                {c.slot}
              </span>
            ))}
          </div>
          <textarea
            className="field-input font-mono text-[12px] leading-[1.7] min-h-[150px] resize-y"
            value={library.basePromptTemplate}
            onChange={(e) => bb.setTemplate(e.target.value)}
          />
          <div className="mt-2 font-mono text-[10px] text-fg-dim tab-fig">
            {library.basePromptTemplate.length} chars
          </div>
        </section>
      </div>

      {/* — value editor — */}
      <div className="col-span-12 lg:col-span-7">
        {active ? (
          <CategoryEditor
            key={active.id}
            category={active}
            onAdd={(draft) => bb.addOption(active.id, draft)}
            onUpdate={(optId, patch) =>
              bb.updateOption(active.id, optId, patch)
            }
            onRemove={(optId) => bb.removeOption(active.id, optId)}
          />
        ) : (
          <div className="card p-12 text-center text-[13px] text-fg-muted">
            No field selected.
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function CategoryEditor({
  category,
  onAdd,
  onUpdate,
  onRemove,
}: {
  category: BadgeCategory;
  onAdd: (draft: { label: string; value: string; swatch?: string }) => void;
  onUpdate: (
    optId: string,
    patch: { label?: string; value?: string; swatch?: string }
  ) => void;
  onRemove: (optId: string) => void;
}) {
  const isColor = category.kind === "color";

  return (
    <div className="card overflow-hidden">
      <div
        className="px-5 py-4 border-b bg-surface-2"
        style={{ borderColor: "var(--color-line)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-[16px] font-semibold tracking-tight">
              {category.label}
            </h3>
            <div className="font-mono text-[10px] text-fg-dim mt-0.5">
              {category.slot} · {isColor ? "colour values" : "text values"}
            </div>
          </div>
          <span className="tag text-[10px]">
            {category.options.length} value
            {category.options.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="hidden sm:flex items-center gap-2 mb-2 overline">
          {isColor ? (
            <>
              <span className="w-9" />
              <span className="flex-1">Colour name (used in the prompt)</span>
            </>
          ) : (
            <>
              <span className="w-8" />
              <span className="w-[40%]">Label</span>
              <span className="flex-1">Prompt fragment</span>
            </>
          )}
        </div>

        <ul className="space-y-1 max-h-[440px] overflow-auto scrollbar-thin pr-1 -mr-1">
          {category.options.map((opt, i) => (
            <li
              key={opt.id}
              className="flex items-center gap-2 group p-1.5 rounded-md hover:bg-surface-2 transition-colors"
            >
              <span className="font-mono text-[10px] tab-fig text-fg-faint w-5 text-center shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>

              {isColor ? (
                <>
                  <SwatchInput
                    value={opt.swatch || "#888888"}
                    onChange={(swatch) => onUpdate(opt.id, { swatch })}
                  />
                  <input
                    className="field-input flex-1 py-1.5"
                    value={opt.label}
                    onChange={(e) =>
                      onUpdate(opt.id, {
                        label: e.target.value,
                        value: e.target.value,
                      })
                    }
                  />
                </>
              ) : (
                <>
                  <input
                    className="field-input w-[40%] py-1.5"
                    value={opt.label}
                    onChange={(e) => onUpdate(opt.id, { label: e.target.value })}
                  />
                  <input
                    className="field-input flex-1 py-1.5 font-mono text-[11px]"
                    value={opt.value}
                    onChange={(e) => onUpdate(opt.id, { value: e.target.value })}
                  />
                </>
              )}

              <button
                type="button"
                className="btn-icon hover:!text-danger shrink-0"
                onClick={() => {
                  if (confirm(`Delete value "${opt.label}"?`)) onRemove(opt.id);
                }}
                aria-label={`Delete ${opt.label}`}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
          {category.options.length === 0 && (
            <li className="card p-6 text-center text-[13px] text-fg-muted">
              No values yet. Add one below.
            </li>
          )}
        </ul>

        <AddValueForm isColor={isColor} onAdd={onAdd} />
      </div>
    </div>
  );
}

function SwatchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label
      className="w-9 h-9 rounded-md shrink-0 cursor-pointer relative overflow-hidden block"
      style={{ background: value, border: "1px solid var(--color-line-2)" }}
      title="Pick swatch colour"
    >
      <input
        type="color"
        value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#888888"}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
    </label>
  );
}

function AddValueForm({
  isColor,
  onAdd,
}: {
  isColor: boolean;
  onAdd: (draft: { label: string; value: string; swatch?: string }) => void;
}) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [swatch, setSwatch] = useState("#7fa8cc");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const l = label.trim();
    if (!l) return;
    if (isColor) {
      onAdd({ label: l, value: l, swatch });
    } else {
      const v = value.trim();
      if (!v) return;
      onAdd({ label: l, value: v });
    }
    setLabel("");
    setValue("");
    setSwatch("#7fa8cc");
  };

  return (
    <form
      onSubmit={submit}
      className="mt-4 bg-surface-2 rounded-lg p-3 flex items-center gap-2"
      style={{ border: "1px solid var(--color-line)" }}
    >
      {isColor ? (
        <>
          <SwatchInput value={swatch} onChange={setSwatch} />
          <input
            className="field-input flex-1"
            placeholder="Colour name (e.g. royal purple)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </>
      ) : (
        <>
          <input
            className="field-input w-[40%]"
            placeholder="Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <input
            className="field-input flex-1 font-mono text-[11px]"
            placeholder="Prompt fragment"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </>
      )}
      <button type="submit" className="btn btn-primary shrink-0">
        <PlusIcon />
        Add
      </button>
    </form>
  );
}

/* — icons — */

function TrashIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
