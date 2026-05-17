import Link from "next/link";
import type { ReactNode } from "react";

type Crumb = { label: string; href?: string };

type ShellProps = {
  children: ReactNode;
  toolNumber?: string;
  toolName?: string;
  crumbs?: Crumb[];
  rightSlot?: ReactNode;
};

export function ToolkitShell({
  children,
  toolName = "Index",
  crumbs = [{ label: "Toolkit", href: "/" }],
  rightSlot,
}: ShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-30">
        <div className="glass border-b" style={{ borderColor: "var(--color-line)" }}>
          <div className="mx-auto max-w-[1400px] px-6 h-14 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-7 h-7 rounded-lg surface-3 border border-line-2 flex items-center justify-center overflow-hidden">
                <span
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 30%, rgba(197,247,79,0.6), transparent 60%)",
                  }}
                />
                <span className="relative font-mono text-[11px] font-semibold text-fg">V</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-sm font-semibold tracking-tight">
                  VBM Toolkit
                </span>
                <span className="font-mono text-[10px] text-fg-dim">v0.1</span>
              </div>
            </Link>

            <nav className="flex items-center gap-1">
              <NavLink href="/" label="Tools" />
              <NavLink href="/tools/portrait-prompt" label="Portraits" />
              <span className="btn btn-ghost text-xs opacity-50 cursor-not-allowed">
                Docs
              </span>
              <div className="w-px h-5 bg-line-2 mx-2" />
              <a
                href="https://github.com"
                className="btn btn-ghost text-xs"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </nav>
          </div>
        </div>

        {/* breadcrumb strip */}
        {(crumbs.length > 1 || toolName) && (
          <div
            className="border-b"
            style={{ borderColor: "var(--color-line)", background: "var(--color-bg)" }}
          >
            <div className="mx-auto max-w-[1400px] px-6 h-10 flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-2 font-mono text-fg-dim">
                {crumbs.map((c, i) => (
                  <span key={i} className="flex items-center gap-2">
                    {c.href ? (
                      <Link href={c.href} className="hover:text-fg transition-colors">
                        {c.label}
                      </Link>
                    ) : (
                      <span>{c.label}</span>
                    )}
                    <span className="text-fg-faint">/</span>
                  </span>
                ))}
                <span className="text-fg">{toolName}</span>
              </div>
              <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-fg-dim">
                {rightSlot}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-20 border-t" style={{ borderColor: "var(--color-line)" }}>
        <div className="mx-auto max-w-[1400px] px-6 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-accent pulse-dot" />
            <span className="text-xs text-fg-muted">
              VBM Toolkit — a side workshop for the Volleyball Manager project
            </span>
          </div>
          <div className="font-mono text-[11px] text-fg-dim">
            Local-first · Built for scale · © 2026
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="btn btn-ghost text-xs">
      {label}
    </Link>
  );
}
