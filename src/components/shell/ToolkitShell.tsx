import Link from "next/link";
import type { ReactNode } from "react";

type Crumb = { label: string; href?: string };

type ShellProps = {
  children: ReactNode;
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
      {/* — top bar — */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{
          borderColor: "var(--color-line)",
          background: "rgba(12,12,13,0.86)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6 h-14 flex items-center justify-between gap-3 sm:gap-6 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <span
              className="w-6 h-6 grid place-items-center rounded-[5px] font-mono text-[11px] font-semibold"
              style={{
                border: "1px solid var(--color-line-3)",
                color: "var(--color-fg)",
              }}
            >
              V
            </span>
            <span className="font-display text-[15px] font-semibold tracking-tight">
              VBM<span className="hidden sm:inline"> Toolkit</span>
            </span>
            <span className="hidden sm:block font-mono text-[10px] text-fg-faint mt-0.5">
              v0.2
            </span>
          </Link>

          <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-none min-w-0">
            <NavLink href="/" label="Tools" />
            <NavLink href="/tools/portrait-prompt" label="Portraits" />
            <NavLink href="/tools/club-badge" label="Badges" />
            <NavLink href="/tools/player-forge" label="Players" />
            <span className="hidden sm:block w-px h-4 mx-1.5 shrink-0" style={{ background: "var(--color-line-2)" }} />
            <a
              href="https://github.com"
              className="hidden sm:inline-flex btn btn-ghost text-[12px] shrink-0"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </nav>
        </div>

        {/* — breadcrumb strip — */}
        <div className="border-t" style={{ borderColor: "var(--color-line)" }}>
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6 h-9 flex items-center justify-between text-[11.5px] font-mono">
            <div className="flex items-center gap-1.5 text-fg-dim">
              {crumbs.map((c, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {c.href ? (
                    <Link
                      href={c.href}
                      className="hover:text-fg transition-colors"
                    >
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
            {rightSlot && (
              <div className="hidden md:block text-[11px] text-fg-dim">
                {rightSlot}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* — footer — */}
      <footer className="mt-24 border-t" style={{ borderColor: "var(--color-line)" }}>
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6 py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11.5px]">
          <span className="text-fg-dim">
            VBM Toolkit — a side workshop for the Volleyball Manager project.
          </span>
          <span className="font-mono text-fg-faint">
            Local-first · © 2026
          </span>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="btn btn-ghost text-[12px]">
      {label}
    </Link>
  );
}
