import { useEffect, useState } from "react";

type ThemeMode = "dark" | "light";
type View = "home" | "installed" | "marketplace" | "search" | "settings";

const NAV_ITEMS_TOP: { id: View; label: string }[] = [
  { id: "home", label: "HOME" },
  { id: "installed", label: "SKILLS" },
  { id: "marketplace", label: "SHOP" },
  { id: "search", label: "FIND" },
];

const NAV_ITEMS_BOTTOM: { id: View; label: string }[] = [
  { id: "settings", label: "SET" },
];

const VIEW_ROW: { id: View; label: string }[] = [
  { id: "home", label: "HOME" },
  { id: "installed", label: "INSTALLED" },
  { id: "marketplace", label: "MARKETPLACE" },
  { id: "search", label: "FIND" },
  { id: "settings", label: "SETTINGS" },
];

function navBtnClass(active: boolean): string {
  const base =
    "h-7 rounded-sm font-mono uppercase tracking-label flex items-center justify-center transition-colors duration-75";
  return active
    ? `${base} bg-fg text-bg font-bold`
    : `${base} text-fg-3 hover:text-fg-2 hover:bg-surface-hover`;
}

function chipClass(active: boolean): string {
  const base =
    "h-7 px-3 rounded-sm border font-mono uppercase tracking-label inline-flex items-center transition-colors duration-75";
  return active
    ? `${base} bg-fg text-bg border-fg font-bold`
    : `${base} border-border text-fg hover:border-fg-2`;
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [view, setView] = useState<View>("home");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div className="flex h-screen w-screen flex-col bg-bg text-fg">
      <header
        className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-6"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <span className="font-display text-[36px] font-bold leading-none tracking-tight">
          curie
        </span>
        <span className="font-mono text-mono uppercase tracking-label text-fg-3">
          {theme}
        </span>
        <span className="flex-1" />
        <span className="font-mono text-mono uppercase tracking-label text-fg-3">
          node v24.18.0 · 12 skills · 3 agents · 3 updates
        </span>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <nav className="flex w-24 shrink-0 flex-col border-r border-border py-5">
          <div className="flex flex-col gap-1 px-3">
            {NAV_ITEMS_TOP.map((item) => (
              <button
                key={item.id}
                className={navBtnClass(view === item.id)}
                onClick={() => setView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="flex flex-col gap-1 px-3">
            {NAV_ITEMS_BOTTOM.map((item) => (
              <button
                key={item.id}
                className={navBtnClass(view === item.id)}
                onClick={() => setView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        <main className="flex min-w-0 flex-1 flex-col gap-10 overflow-y-auto px-10 pt-14 pb-10">
          <section className="flex items-baseline gap-5">
            <span className="font-display text-display font-bold leading-none tracking-[-0.04em]">
              12
            </span>
            <span className="font-mono text-mono uppercase tracking-label text-fg-3">
              SKILLS INSTALLED
            </span>
          </section>

          <section className="flex gap-14">
            <div className="flex flex-col gap-1">
              <div className="font-mono text-mono uppercase tracking-label text-fg-3">
                NODE
              </div>
              <div className="font-display text-heading font-bold leading-[1.1] tracking-tight">
                v24.18.0
              </div>
              <div className="font-mono text-mono uppercase tracking-label text-fg-3">
                via volta
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="font-mono text-mono uppercase tracking-label text-fg-3">
                AGENTS
              </div>
              <div className="font-display text-heading font-bold leading-[1.1] tracking-tight">
                3
              </div>
              <div className="font-mono text-mono uppercase tracking-label text-fg-3">
                claude-code · cursor · opencode
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="font-mono text-mono uppercase tracking-label text-fg-3">
                UPDATES
              </div>
              <div className="font-display text-heading font-bold leading-[1.1] tracking-tight">
                3
              </div>
              <div className="font-mono text-mono uppercase tracking-label text-fg-3">
                skills out of date
              </div>
            </div>
          </section>

          <hr className="border-0 border-t border-border" />

          <div className="flex items-center gap-4">
            <span className="font-mono text-mono uppercase tracking-label text-fg-3 min-w-14">
              VIEW
            </span>
            <div className="flex gap-2">
              {VIEW_ROW.map((item) => (
                <button
                  key={item.id}
                  className={chipClass(view === item.id)}
                  onClick={() => setView(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              className="h-7 px-3 rounded-sm font-mono uppercase tracking-label text-fg-3 hover:text-fg hover:bg-surface-hover transition-colors duration-75"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            >
              THEME {theme.toUpperCase()}
            </button>
            <span className="font-mono text-mono uppercase tracking-label text-fg-3">
              READY · all systems operational
            </span>
          </div>

          <div className="flex-1" />

          <footer className="-mx-10 -mb-10 border-t border-border px-10 py-3">
            <span className="font-mono text-mono uppercase tracking-label text-fg-3">
              CURIE · READY · 2026-07-22 16:03
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
