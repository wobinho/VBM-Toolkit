"use client";

import { useMemo, useState } from "react";
import type {
  FeatureCategory,
  PortraitLibrary,
} from "@/lib/portrait-library/types";

type Props = {
  library: PortraitLibrary;
  onSetBaseTemplate: (tpl: string) => void;
  onAddCategory: (draft: {
    key: string;
    label: string;
    slot: string;
    required: boolean;
    allowNone: boolean;
  }) => void;
  onUpdateCategory: (
    id: string,
    patch: Partial<Omit<FeatureCategory, "id" | "options">>
  ) => void;
  onRemoveCategory: (id: string) => void;
  onMoveCategory: (id: string, dir: -1 | 1) => void;
  onAddOption: (categoryId: string, label: string, value: string) => void;
  onUpdateOption: (
    categoryId: string,
    optionId: string,
    patch: { label?: string; value?: string }
  ) => void;
  onRemoveOption: (categoryId: string, optionId: string) => void;
  onRemoveAllOptions: (categoryId: string) => void;
  onReset: () => void;
};

export function LibraryBuilder(props: Props) {
  const {
    library,
    onSetBaseTemplate,
    onAddCategory,
    onUpdateCategory,
    onRemoveCategory,
    onMoveCategory,
    onAddOption,
    onUpdateOption,
    onRemoveOption,
    onRemoveAllOptions,
    onReset,
  } = props;

  const [activeId, setActiveId] = useState<string | null>(
    library.categories[0]?.id ?? null
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
      {/* — categories list + base template — */}
      <div className="col-span-12 lg:col-span-5 space-y-6">
        <section>
          <div
            className="flex items-end justify-between pb-3 mb-4 border-b"
            style={{ borderColor: "var(--color-line-2)" }}
          >
            <div>
              <div className="overline mb-1.5">Step 01 — Library</div>
              <h2 className="font-display text-[20px] font-semibold tracking-tight">
                Categories
              </h2>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onReset}
              title="Reset library to factory defaults"
            >
              <ResetIcon />
              Reset
            </button>
          </div>

          <CategoryList
            categories={library.categories}
            activeId={active?.id ?? null}
            onSelect={setActiveId}
            onMove={onMoveCategory}
            onRemove={(id) => {
              onRemoveCategory(id);
              if (active?.id === id) {
                const remaining = library.categories.filter((c) => c.id !== id);
                setActiveId(remaining[0]?.id ?? null);
              }
            }}
          />

          <AddCategoryForm onAdd={onAddCategory} />
        </section>

        <section className="card p-4">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="font-display text-[15px] font-semibold tracking-tight">
              Base template
            </h3>
            <span className="font-mono text-[10px] text-fg-dim tab-fig">
              {library.basePromptTemplate.length} chars
            </span>
          </div>
          <p className="text-[12px] text-fg-muted mb-3 leading-relaxed">
            Slot tokens in square brackets are replaced with the value of the
            selected option — e.g.{" "}
            <code className="font-mono text-accent-strong">[AGE]</code> or{" "}
            <code className="font-mono text-accent-strong">[HAIR_COLOR]</code>.
          </p>
          <textarea
            className="field-input font-mono text-[12px] leading-[1.7] min-h-[160px] resize-y"
            value={library.basePromptTemplate}
            onChange={(e) => onSetBaseTemplate(e.target.value)}
          />
          <div className="mt-2 text-[11px] text-fg-dim">
            {library.categories.length} slots available
          </div>
        </section>
      </div>

      {/* — category detail — */}
      <div className="col-span-12 lg:col-span-7">
        {active ? (
          <CategoryEditor
            key={active.id}
            category={active}
            onUpdate={(patch) => onUpdateCategory(active.id, patch)}
            onAddOption={(label, value) => onAddOption(active.id, label, value)}
            onUpdateOption={(optId, patch) =>
              onUpdateOption(active.id, optId, patch)
            }
            onRemoveOption={(optId) => onRemoveOption(active.id, optId)}
            onRemoveAllOptions={() => onRemoveAllOptions(active.id)}
          />
        ) : (
          <div className="card p-12 text-center">
            <div className="font-display text-[17px] font-semibold">
              No category selected
            </div>
            <div className="text-[13px] text-fg-muted mt-1">
              Pick one on the left, or add a new category to begin.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryList({
  categories,
  activeId,
  onSelect,
  onMove,
  onRemove,
}: {
  categories: FeatureCategory[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onRemove: (id: string) => void;
}) {
  if (categories.length === 0) {
    return (
      <div className="card p-6 text-center text-[13px] text-fg-muted">
        No categories yet. Add one below to get started.
      </div>
    );
  }

  return (
    <ul className="card overflow-hidden max-h-[420px] overflow-y-auto scrollbar-thin">
      {categories.map((c, i) => {
        const isActive = c.id === activeId;
        return (
          <li
            key={c.id}
            className={`group flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors ${
              i > 0 ? "border-t" : ""
            } ${isActive ? "bg-surface-2" : "hover:bg-surface-2"}`}
            style={{ borderColor: "var(--color-line)" }}
            onClick={() => onSelect(c.id)}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span
                className={`font-mono text-[10px] tab-fig w-5 text-right ${
                  isActive ? "text-accent-strong" : "text-fg-faint"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium truncate">
                  {c.label}
                </div>
                <div className="font-mono text-[10px] text-fg-dim truncate mt-0.5">
                  {c.slot} · {c.options.length} option
                  {c.options.length === 1 ? "" : "s"}
                  {c.required ? " · required" : ""}
                </div>
              </div>
            </div>
            <div
              className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="btn-icon"
                onClick={() => onMove(c.id, -1)}
                aria-label="Move up"
              >
                <ChevronIcon up />
              </button>
              <button
                type="button"
                className="btn-icon"
                onClick={() => onMove(c.id, 1)}
                aria-label="Move down"
              >
                <ChevronIcon />
              </button>
              <button
                type="button"
                className="btn-icon hover:!text-danger"
                onClick={() => {
                  if (
                    confirm(`Delete category "${c.label}" and all its options?`)
                  )
                    onRemove(c.id);
                }}
                aria-label="Delete category"
              >
                <TrashIcon />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function AddCategoryForm({
  onAdd,
}: {
  onAdd: (d: {
    key: string;
    label: string;
    slot: string;
    required: boolean;
    allowNone: boolean;
  }) => void;
}) {
  const [label, setLabel] = useState("");
  const [slot, setSlot] = useState("");
  const [required, setRequired] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return;

    const autoSlot = `[${trimmedLabel
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")}]`;
    const finalSlot = slot.trim() || autoSlot;
    const key = finalSlot.replace(/[[\]]/g, "");

    onAdd({
      label: trimmedLabel,
      slot: finalSlot,
      key,
      required,
      allowNone: !required,
    });

    setLabel("");
    setSlot("");
    setRequired(false);
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="mt-2.5 w-full card card-hover p-2.5 text-[13px] text-fg-muted hover:text-fg flex items-center justify-center gap-2"
      >
        <PlusIcon />
        Add category
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-2.5 card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="overline">New category</div>
        <button
          type="button"
          className="btn-icon"
          onClick={() => setExpanded(false)}
          aria-label="Cancel"
        >
          <CloseIcon />
        </button>
      </div>
      <div className="grid grid-cols-12 gap-2">
        <input
          className="field-input col-span-7"
          placeholder="Label (e.g. Eye Glow)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          autoFocus
        />
        <input
          className="field-input col-span-5 font-mono text-[11px]"
          placeholder="[SLOT]"
          value={slot}
          onChange={(e) => setSlot(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-[12px] text-fg-muted cursor-pointer">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
          />
          Required slot
        </label>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setExpanded(false)}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Add category
          </button>
        </div>
      </div>
    </form>
  );
}

function CategoryEditor({
  category,
  onUpdate,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  onRemoveAllOptions,
}: {
  category: FeatureCategory;
  onUpdate: (patch: Partial<Omit<FeatureCategory, "id" | "options">>) => void;
  onAddOption: (label: string, value: string) => void;
  onUpdateOption: (
    optId: string,
    patch: { label?: string; value?: string }
  ) => void;
  onRemoveOption: (optId: string) => void;
  onRemoveAllOptions: () => void;
}) {
  return (
    <div className="card overflow-hidden">
      {/* header */}
      <div
        className="px-5 py-4 border-b bg-surface-2"
        style={{ borderColor: "var(--color-line)" }}
      >
        <div className="grid grid-cols-12 gap-3 items-end">
          <div className="col-span-12 sm:col-span-5">
            <label className="field-label">Category label</label>
            <input
              className="field-input"
              value={category.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
            />
          </div>
          <div className="col-span-7 sm:col-span-4">
            <label className="field-label">Slot token</label>
            <input
              className="field-input font-mono text-[11px]"
              value={category.slot}
              onChange={(e) =>
                onUpdate({
                  slot: e.target.value,
                  key: e.target.value.replace(/[[\]]/g, ""),
                })
              }
            />
          </div>
          <div className="col-span-5 sm:col-span-3 flex flex-col gap-2 pb-1">
            <label className="flex items-center gap-2 text-[12px] text-fg-muted cursor-pointer">
              <input
                type="checkbox"
                checked={category.required}
                onChange={(e) =>
                  onUpdate({
                    required: e.target.checked,
                    allowNone: !e.target.checked,
                  })
                }
              />
              Required
            </label>
            <label className="flex items-center gap-2 text-[12px] text-fg-muted cursor-pointer">
              <input
                type="checkbox"
                checked={category.allowNone}
                onChange={(e) => onUpdate({ allowNone: e.target.checked })}
              />
              Allow skip
            </label>
          </div>
        </div>
      </div>

      {/* options */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-display text-[15px] font-semibold tracking-tight">
            Options
            <span className="text-fg-dim font-mono text-[12px] tab-fig ml-2">
              {category.options.length}
            </span>
          </h4>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-6 overline">
              <span className="w-[200px]">Label</span>
              <span className="flex-1">Prompt fragment</span>
            </div>
            {category.options.length > 0 && (
              <button
                type="button"
                className="text-[11px] px-2 py-1 rounded hover:bg-danger/10 hover:text-danger transition-colors text-fg-dim"
                onClick={() => {
                  if (confirm(`Delete all ${category.options.length} options in "${category.label}"?`))
                    onRemoveAllOptions();
                }}
                title="Delete all options in this category"
              >
                Delete all
              </button>
            )}
          </div>
        </div>

        <ul className="space-y-1 max-h-[420px] overflow-auto scrollbar-thin pr-1 -mr-1">
          {category.options.map((opt, i) => (
            <li
              key={opt.id}
              className="grid grid-cols-12 gap-2 items-center group p-1.5 rounded-md hover:bg-surface-2 transition-colors"
            >
              <span className="col-span-1 font-mono text-[10px] tab-fig text-fg-faint text-center">
                {String(i + 1).padStart(2, "0")}
              </span>
              <input
                className="field-input col-span-4 py-1.5"
                value={opt.label}
                onChange={(e) =>
                  onUpdateOption(opt.id, { label: e.target.value })
                }
              />
              <input
                className="field-input col-span-6 py-1.5 font-mono text-[11px]"
                value={opt.value}
                onChange={(e) =>
                  onUpdateOption(opt.id, { value: e.target.value })
                }
              />
              <button
                type="button"
                className="btn-icon col-span-1 hover:!text-danger justify-self-center"
                onClick={() => {
                  if (confirm(`Delete option "${opt.label}"?`))
                    onRemoveOption(opt.id);
                }}
                aria-label="Delete option"
              >
                <TrashIcon />
              </button>
            </li>
          ))}
          {category.options.length === 0 && (
            <li className="card p-6 text-center text-[13px] text-fg-muted">
              No options yet. Add one below.
            </li>
          )}
        </ul>

        <AddOptionForm onAdd={onAddOption} />
      </div>
    </div>
  );
}

function AddOptionForm({
  onAdd,
}: {
  onAdd: (label: string, value: string) => void;
}) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const l = label.trim();
    const v = value.trim();
    if (!l || !v) return;
    onAdd(l, v);
    setLabel("");
    setValue("");
  };

  return (
    <form
      onSubmit={submit}
      className="mt-4 bg-surface-2 rounded-lg p-3 grid grid-cols-12 gap-2 items-center"
      style={{ border: "1px solid var(--color-line)" }}
    >
      <input
        className="field-input col-span-4"
        placeholder="Option label"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <input
        className="field-input col-span-6 font-mono text-[11px]"
        placeholder="Prompt fragment (replaces slot)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        type="submit"
        className="btn btn-primary col-span-2 justify-center"
      >
        <PlusIcon />
        Add
      </button>
    </form>
  );
}

/* — icons — */

function ChevronIcon({ up = false }: { up?: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: up ? "rotate(180deg)" : undefined }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

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

function CloseIcon() {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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
