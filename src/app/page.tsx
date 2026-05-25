import Link from "next/link";
import { ToolkitShell } from "@/components/shell/ToolkitShell";
import { TOOLS, type ToolEntry } from "@/lib/tools";

export default function HomePage() {
  const live = TOOLS.filter((t) => t.href);
  const upcoming = TOOLS.filter((t) => !t.href);

  return (
    <ToolkitShell toolName="Index" crumbs={[{ label: "Toolkit" }]}>
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 pt-10 sm:pt-12 pb-20 sm:pb-24">
        {/* — page header strip — */}
        <div
          className="rise-in flex items-baseline justify-between pb-3 border-b"
          style={{ borderColor: "var(--color-line-2)" }}
        >
          <div className="overline">The workshop</div>
          <span className="font-mono text-[11px] text-fg-dim tab-fig">
            {String(live.length).padStart(2, "0")} live ·{" "}
            {String(TOOLS.length).padStart(2, "0")} total
          </span>
        </div>

        {/* — live tools — */}
        {live.length > 0 && (
          <section className="mt-10">
            <SectionLabel
              label="Ready to use"
              meta={`${String(live.length).padStart(2, "0")} tools`}
              delay={60}
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {live.map((tool, i) => (
                <LiveCard key={tool.no} tool={tool} delay={120 + i * 70} />
              ))}
            </div>
          </section>
        )}

        {/* — queued tools — */}
        {upcoming.length > 0 && (
          <section className="mt-14">
            <SectionLabel
              label="On the workbench"
              meta={`${String(upcoming.length).padStart(2, "0")} planned`}
              delay={260}
            />
            <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((tool, i) => (
                <QueuedCard key={tool.no} tool={tool} delay={320 + i * 55} />
              ))}
            </div>
          </section>
        )}
      </div>
    </ToolkitShell>
  );
}

/* — section label: overline + meta count, hairline under — */
function SectionLabel({
  label,
  meta,
  delay,
}: {
  label: string;
  meta: string;
  delay: number;
}) {
  return (
    <div
      className="rise-in flex items-baseline justify-between border-b pb-2.5"
      style={{ borderColor: "var(--color-line)", animationDelay: `${delay}ms` }}
    >
      <h2 className="overline">{label}</h2>
      <span className="font-mono text-[11px] text-fg-faint tab-fig">{meta}</span>
    </div>
  );
}

/* — live tool card: prominent, interactive — */
function LiveCard({ tool, delay }: { tool: ToolEntry; delay: number }) {
  return (
    <Link
      href={tool.href!}
      className="card card-hover rise-in group relative flex flex-col overflow-hidden p-6 sm:p-7"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* ghost index — quiet editorial texture */}
      <span
        className="pointer-events-none absolute -right-3 -top-7 select-none font-display text-[128px] font-bold leading-none text-fg transition-opacity duration-300 group-hover:opacity-[0.05]"
        style={{ opacity: 0.025 }}
        aria-hidden
      >
        {tool.no}
      </span>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[12px] text-fg-dim tab-fig">
          {tool.no}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-accent-strong">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          Live
        </span>
      </div>

      <h3 className="mt-5 font-display text-[22px] font-semibold tracking-[-0.02em] transition-colors group-hover:text-accent-strong">
        {tool.name}
      </h3>
      <span className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-fg-dim">
        {tool.category}
      </span>

      <p className="mt-3 text-[13.5px] leading-relaxed text-fg-muted">
        {tool.blurb}
      </p>

      <div
        className="mt-auto flex items-center gap-2 border-t pt-5 text-[13px] font-medium"
        style={{ borderColor: "var(--color-line)" }}
      >
        <span className="text-fg transition-colors group-hover:text-accent-strong">
          Open {tool.name}
        </span>
        <span className="text-fg-dim transition-all group-hover:translate-x-1 group-hover:text-accent-strong">
          <Arrow />
        </span>
      </div>
    </Link>
  );
}

/* — queued tool card: compact, muted — */
function QueuedCard({ tool, delay }: { tool: ToolEntry; delay: number }) {
  return (
    <div
      className="card rise-in flex flex-col p-5"
      style={{ animationDelay: `${delay}ms` }}
      aria-disabled
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-fg-faint tab-fig">
          {tool.no}
        </span>
        <span className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-fg-faint">
          Queued
        </span>
      </div>

      <h3 className="mt-3.5 font-display text-[15.5px] font-semibold tracking-tight text-fg-muted">
        {tool.name}
      </h3>
      <span className="mt-1 text-[10.5px] uppercase tracking-[0.14em] text-fg-faint">
        {tool.category}
      </span>

      <p className="mt-2.5 text-[12.5px] leading-relaxed text-fg-dim">
        {tool.blurb}
      </p>
    </div>
  );
}

function Arrow() {
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
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
