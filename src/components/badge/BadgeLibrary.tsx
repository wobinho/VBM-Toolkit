"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { COLOR_CATEGORY_IDS, useBadgeStudio } from "@/lib/badge-builder/store";
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
            library={library}
            onAdd={(draft) =>
              active.kind === "color"
                ? bb.addColorOptions([draft])
                : bb.addOption(active.id, draft)
            }
            onAddMultiple={(drafts) =>
              active.kind === "color"
                ? bb.addColorOptions(drafts)
                : bb.addOptions(active.id, drafts)
            }
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
  library,
  onAdd,
  onAddMultiple,
  onUpdate,
  onRemove,
}: {
  category: BadgeCategory;
  library: { categories: BadgeCategory[] };
  onAdd: (draft: { label: string; value: string; swatch?: string }) => void;
  onAddMultiple: (
    drafts: Array<{ label: string; value: string; swatch?: string }>
  ) => void;
  onUpdate: (
    optId: string,
    patch: { label?: string; value?: string; swatch?: string }
  ) => void;
  onRemove: (optId: string) => void;
}) {
  const isColor = category.kind === "color";
  const [showImport, setShowImport] = useState(false);

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
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-secondary px-2.5 py-1 text-[11.5px] cursor-pointer"
              onClick={() => setShowImport(true)}
            >
              Import CSV
            </button>
            {isColor && (
              <span className="text-[10px] text-fg-dim hidden sm:inline">
                syncs to all colour fields
              </span>
            )}
            <span className="tag text-[10px]">
              {category.options.length} value
              {category.options.length === 1 ? "" : "s"}
            </span>
          </div>
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

      {showImport && (
        <CsvImportModal
          category={category}
          library={library}
          onClose={() => setShowImport(false)}
          onImport={(drafts) => {
            onAddMultiple(drafts);
            setShowImport(false);
          }}
        />
      )}
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

/* -------------------------------------------------------------------------- */
/*  CSV Import Tooling                                                        */
/* -------------------------------------------------------------------------- */

function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let currentVal = "";
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (insideQuote) {
      if (char === '"') {
        if (nextChar === '"') {
          currentVal += '"';
          i++; // skip next quote
        } else {
          insideQuote = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        insideQuote = true;
      } else if (char === ',') {
        row.push(currentVal);
        currentVal = "";
      } else if (char === '\r' || char === '\n') {
        row.push(currentVal);
        currentVal = "";
        result.push(row);
        row = [];
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      } else {
        currentVal += char;
      }
    }
  }
  if (currentVal !== "" || row.length > 0) {
    row.push(currentVal);
    result.push(row);
  }

  // Clean rows: trim whitespace, filter out empty rows
  return result
    .map((r) => r.map((cell) => cell.trim()))
    .filter((r) => r.length > 0 && r.some((cell) => cell !== ""));
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
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

interface CsvImportModalProps {
  category: BadgeCategory;
  library: { categories: BadgeCategory[] };
  onClose: () => void;
  onImport: (drafts: Array<{ label: string; value: string; swatch?: string }>) => void;
}

function CsvImportModal({
  category,
  library,
  onClose,
  onImport,
}: CsvImportModalProps) {
  const isColor = category.kind === "color";
  const [activeTab, setActiveTab] = useState<"file" | "paste">("file");
  const [csvText, setCsvText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        setCsvText(text);
        setActiveTab("paste"); // Switch tab to preview/edit pasted CSV text
      }
    };
    reader.readAsText(file);
  };

  const parsedRows = useMemo(() => {
    if (!csvText.trim()) return [];
    return parseCSV(csvText);
  }, [csvText]);

  const hasHeaderDetected = useMemo(() => {
    if (parsedRows.length === 0) return false;
    const firstRow = parsedRows[0];
    return firstRow.some((cell) => {
      const c = cell.toLowerCase();
      return ["label", "value", "swatch", "hex", "color", "colour", "motif", "shape", "name"].includes(c);
    });
  }, [parsedRows]);

  const [hasHeader, setHasHeader] = useState(false);
  const [prevCsvText, setPrevCsvText] = useState("");

  if (csvText !== prevCsvText) {
    setPrevCsvText(csvText);
    setHasHeader(hasHeaderDetected);
  }

  const finalDrafts = useMemo(() => {
    const rowsToProcess = hasHeader ? parsedRows.slice(1) : parsedRows;
    return rowsToProcess
      .map((row) => {
        if (isColor) {
          const label = row[0] || "";
          let swatch = row[1] || "";
          if (swatch && !swatch.startsWith("#")) {
            if (/^[0-9a-f]{3,6}$/i.test(swatch)) {
              swatch = "#" + swatch;
            }
          }
          if (!/^#[0-9a-f]{3,6}$/i.test(swatch)) {
            swatch = "#888888";
          }
          return { label, value: label, swatch };
        } else {
          const label = row[0] || "";
          const value = row[1] || label;
          return { label, value };
        }
      })
      .filter((d) => d.label.trim() !== "");
  }, [parsedRows, hasHeader, isColor]);

  const existingLabels = useMemo(() => {
    if (!isColor) {
      return new Set(category.options.map((o) => o.label.toLowerCase().trim()));
    }
    const labels = new Set<string>();
    for (const id of COLOR_CATEGORY_IDS) {
      const cat = library.categories.find((c) => c.id === id);
      cat?.options.forEach((o) => labels.add(o.label.toLowerCase().trim()));
    }
    return labels;
  }, [category.options, isColor, library.categories]);

  const existingValues = useMemo(() => {
    if (!isColor) {
      return new Set(category.options.map((o) => o.value.toLowerCase().trim()));
    }
    return existingLabels;
  }, [category.options, existingLabels, isColor]);

  const { itemsToImport, duplicateCount } = useMemo(() => {
    let dupCount = 0;
    const toImport: Array<{ label: string; value: string; swatch?: string }> = [];
    const seenLabels = new Set<string>();
    const seenValues = new Set<string>();

    for (const d of finalDrafts) {
      const lLower = d.label.toLowerCase().trim();
      const vLower = d.value.toLowerCase().trim();

      const isDuplicate =
        existingLabels.has(lLower) ||
        existingValues.has(vLower) ||
        seenLabels.has(lLower) ||
        seenValues.has(vLower);

      if (isDuplicate) {
        dupCount++;
      } else {
        toImport.push(d);
        seenLabels.add(lLower);
        seenValues.add(vLower);
      }
    }
    return { itemsToImport: toImport, duplicateCount: dupCount };
  }, [finalDrafts, existingLabels, existingValues]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="card w-full max-w-md p-5 flex flex-col gap-4 relative max-h-[90vh] overflow-y-auto scrollbar-thin rise-in">
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--color-line-2)" }}>
          <div>
            <h3 className="font-display text-[16px] font-semibold tracking-tight">
              Import to {isColor ? "colour library" : category.label}
            </h3>
            <span className="block text-[10.5px] text-fg-dim font-mono mt-0.5">
              CSV format · {isColor ? "Name, Hex (# optional)" : "Label, Value"}
              {isColor ? " · added to primary, secondary & accent" : ""}
            </span>
          </div>
          <button
            type="button"
            className="btn-icon hover:bg-surface-3 cursor-pointer"
            onClick={onClose}
            aria-label="Close modal"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b" style={{ borderColor: "var(--color-line)" }}>
          <button
            type="button"
            className={`px-3 py-1.5 text-[12px] font-medium border-b-2 transition-colors cursor-pointer -mb-px ${
              activeTab === "file"
                ? "border-accent text-fg"
                : "border-transparent text-fg-dim hover:text-fg-muted"
            }`}
            onClick={() => setActiveTab("file")}
          >
            Upload File
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-[12px] font-medium border-b-2 transition-colors cursor-pointer -mb-px ${
              activeTab === "paste"
                ? "border-accent text-fg"
                : "border-transparent text-fg-dim hover:text-fg-muted"
            }`}
            onClick={() => setActiveTab("paste")}
          >
            Paste CSV
          </button>
        </div>

        {activeTab === "file" ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragActive
                ? "border-accent bg-accent/5 text-fg"
                : "border-line-2 hover:border-line-3 text-fg-muted hover:text-fg"
            }`}
            style={{ backgroundColor: "var(--color-surface-2)" }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              accept=".csv,text/csv"
              className="hidden"
            />
            <UploadIcon className="mx-auto mb-2 text-fg-dim" />
            <span className="block text-[13px] font-medium">
              Drag &amp; drop your CSV file here, or <span className="text-accent underline">browse</span>
            </span>
            <span className="block text-[10px] text-fg-dim mt-1">Supports .csv files</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <textarea
              className="field-input font-mono text-[11px] min-h-[120px] resize-y"
              placeholder={
                isColor
                  ? "royal gold,#d4af37\nivory white,f3efe3\nmatte black,#16161a"
                  : "roaring tiger head,roaring tiger head\nsleeping cat,sleeping cat"
              }
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />
            <span className="text-[10px] text-fg-dim leading-normal">
              Provide values separated by commas. One item per line.
            </span>
          </div>
        )}

        {parsedRows.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-[12px] text-fg-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasHeader}
                  onChange={(e) => setHasHeader(e.target.checked)}
                  className="rounded-sm accent-accent"
                />
                <span>First row is header (skip it)</span>
              </label>
              {hasHeader && (
                <span className="text-[10px] text-fg-dim font-mono truncate max-w-[200px]">
                  Header: [{parsedRows[0]?.slice(0, 3).join(", ")}]
                </span>
              )}
            </div>

            <div className="border border-line rounded-md overflow-hidden bg-surface-2">
              <div className="px-3 py-1.5 bg-surface-3/50 text-[10px] overline border-b border-line text-fg-dim">
                Preview (First 5 Items)
              </div>
              <div className="max-h-[140px] overflow-auto scrollbar-thin">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-line/45 text-fg-dim font-mono">
                      <th className="px-3 py-1 font-medium">
                        {isColor ? "Colour name" : "Label"}
                      </th>
                      {isColor ? (
                        <th className="px-3 py-1 font-medium w-28">Hex</th>
                      ) : (
                        <th className="px-3 py-1 font-medium">Value</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/40">
                    {finalDrafts.slice(0, 5).map((d, idx) => (
                      <tr key={idx} className="text-fg-muted font-mono hover:bg-surface-3/20 transition-colors">
                        <td className="px-3 py-1.5 truncate max-w-[120px]">{d.label}</td>
                        {isColor ? (
                          <td className="px-3 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-3.5 h-3.5 rounded-sm border border-line"
                                style={{ backgroundColor: d.swatch }}
                              />
                              <span className="text-[10px]">{d.swatch}</span>
                            </div>
                          </td>
                        ) : (
                          <td className="px-3 py-1.5 truncate max-w-[150px]">{d.value}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {finalDrafts.length > 5 && (
                <div className="text-[10px] text-fg-dim text-center py-1.5 border-t border-line/40 bg-surface-3/10">
                  ... and {finalDrafts.length - 5} more items.
                </div>
              )}
            </div>

            <div className="text-[11px] flex flex-col gap-1 text-fg-muted">
              <div>Found <span className="text-fg font-medium">{finalDrafts.length}</span> items in CSV.</div>
              {duplicateCount > 0 && (
                <div className="text-accent-strong">
                  {duplicateCount} duplicate items will be automatically skipped.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 mt-2 border-t pt-3" style={{ borderColor: "var(--color-line)" }}>
          <button
            type="button"
            className="btn btn-secondary px-4 cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary px-4 cursor-pointer"
            disabled={itemsToImport.length === 0}
            onClick={() => onImport(itemsToImport)}
          >
            Import {itemsToImport.length} Item{itemsToImport.length === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>
  );
}
