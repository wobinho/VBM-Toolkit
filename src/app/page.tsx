import Link from "next/link";
import { ToolkitShell } from "@/components/shell/ToolkitShell";
import { TOOLS } from "@/lib/tools";

const STATUS_CHIP: Record<string, { label: string; classes: string }> = {
  live: { label: "Live", classes: "chip-accent" },
  drafting: { label: "Drafting", classes: "chip-info" },
  queued: { label: "Queued", classes: "chip-muted" },
};

export default function HomePage() {
  return (
    <ToolkitShell toolName="Tools" crumbs={[{ label: "Toolkit" }]}>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-50 pointer-events-none" />
        <div
          className="absolute -top-32 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(197,247,79,0.10), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-[1400px] px-6 pt-20 pb-16">
          <div className="flex items-center gap-2 mb-6">
            <span className="chip chip-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
              v0.1 · Portrait Studio shipped
            </span>
            <span className="chip chip-muted">5 tools queued</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight max-w-[18ch] leading-[0.95]">
            A workshop of small,
            <br />
            <span className="text-fg-muted">sharp tools for </span>
            <span className="text-accent">Volleyball Manager</span>
            <span className="text-fg-muted">.</span>
          </h1>

          <p className="mt-6 text-lg text-fg-muted max-w-[60ch] leading-relaxed">
            Each tool solves one problem well. Portrait prompts first — rosters,
            schedules, kits and scouting reports queued behind. Everything stays
            local; nothing leaves your browser unless you copy it.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/tools/portrait-prompt" className="btn btn-primary">
              Open Portrait Studio
              <span className="text-base leading-none">→</span>
            </Link>
            <a href="#roster" className="btn btn-secondary">
              Browse the roster
            </a>
          </div>
        </div>
      </section>

      {/* TOOL ROSTER */}
      <section id="roster" className="mx-auto max-w-[1400px] px-6 pt-8 pb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-fg-dim mb-1">
              Tool roster
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Pick a tool to enter
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-fg-dim font-mono">
            <span className="tab-fig text-fg">01</span> live ·
            <span className="tab-fig text-fg-muted">05</span> queued
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((tool) => {
            const chip = STATUS_CHIP[tool.status];
            const isDisabled = !tool.href;

            const inner = (
              <article
                className={`card card-hover h-full p-5 flex flex-col gap-5 ${
                  isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-mono text-sm font-semibold tab-fig"
                      style={{
                        background: "var(--color-surface-3)",
                        border: "1px solid var(--color-line-2)",
                      }}
                    >
                      {tool.no}
                    </div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-fg-dim">
                      {tool.category}
                    </div>
                  </div>
                  <span className={`chip ${chip.classes}`}>
                    {tool.status === "live" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
                    )}
                    {chip.label}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="font-display text-xl font-semibold tracking-tight">
                    {tool.name}
                  </h3>
                  <p className="mt-2 text-sm text-fg-muted leading-relaxed">
                    {tool.blurb}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-fg-dim">/{tool.slug}</span>
                  <span className="inline-flex items-center gap-1.5 text-fg-muted group-hover/card:text-accent transition-colors">
                    {tool.href ? (
                      <>
                        Enter
                        <span className="transition-transform">→</span>
                      </>
                    ) : (
                      <span className="text-fg-faint">Coming soon</span>
                    )}
                  </span>
                </div>
              </article>
            );

            return tool.href ? (
              <Link key={tool.no} href={tool.href} className="group/card block">
                {inner}
              </Link>
            ) : (
              <div key={tool.no} className="group/card" aria-disabled>
                {inner}
              </div>
            );
          })}
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="mx-auto max-w-[1400px] px-6 pb-20">
        <div className="card p-8 md:p-10">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-fg-dim mb-2">
                Principles
              </div>
              <div className="font-display text-2xl font-semibold tracking-tight">
                How the workshop runs
              </div>
            </div>
            <Principle
              n="01"
              title="One problem each"
              body="No omnibus tools. Every utility solves a single, well-bounded problem inside the VBM workflow."
            />
            <Principle
              n="02"
              title="Local-first data"
              body="Libraries and selections live in your browser. Nothing leaves the workshop unless you explicitly copy or export."
            />
            <Principle
              n="03"
              title="Built for scale"
              body="Thousands of players, hundreds of kits, a full season of fixtures — the tools are sized for the real workload."
            />
          </div>
        </div>
      </section>
    </ToolkitShell>
  );
}

function Principle({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-mono text-xs text-accent tab-fig">{n}</span>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className="text-sm text-fg-muted leading-relaxed">{body}</p>
    </div>
  );
}
