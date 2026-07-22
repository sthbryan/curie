import { useEffect, useState } from "react";

type ThemeMode = "dark" | "light";
type View = "home" | "installed" | "marketplace" | "search" | "settings";

type Agent = {
  id: string;
  label: string;
  count: number;
  capacity: number;
  status: "current" | "updates";
  updates: number;
};

const AGENTS: Agent[] = [
  { id: "claude", label: "claude-code", count: 9, capacity: 12, status: "updates", updates: 3 },
  { id: "cursor", label: "cursor", count: 6, capacity: 12, status: "current", updates: 0 },
  { id: "opencode", label: "opencode", count: 4, capacity: 12, status: "current", updates: 0 },
];

type Activity = {
  kind: "install" | "update" | "remove";
  skill: string;
  agent: string;
  when: string;
};

const RECENT: Activity[] = [
  { kind: "install", skill: "skill-creator", agent: "claude-code", when: "2h ago" },
  { kind: "install", skill: "web-design-guidelines", agent: "claude-code", when: "yesterday" },
  { kind: "update", skill: "react-patterns", agent: "cursor", when: "yesterday" },
  { kind: "install", skill: "figma-tokens", agent: "opencode", when: "3 days ago" },
];

const TOTAL_SKILLS = 12;
const TOTAL_UPDATES = 3;
const ACTIVE_AGENTS = AGENTS.filter((a) => a.count > 0).length;

function density(count: number, capacity: number): number {
  return Math.min(count / capacity, 1);
}

function MonoLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`font-mono uppercase tracking-label text-fg-3 ${className}`}>{children}</span>
  );
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [view, setView] = useState<View>("home");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const homeView = (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-10 pt-12 pb-8">
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
            <MonoLabel>STATUS · WORKING</MonoLabel>
          </div>
          <div className="flex items-baseline gap-5 pt-3">
            <span className="font-display text-display font-bold leading-none tracking-display">
              {TOTAL_SKILLS}
            </span>
            <div className="flex flex-col gap-1">
              <span className="font-body text-base text-fg-2 tracking-tight">
                skills ready across {ACTIVE_AGENTS} AI tools
              </span>
              <span className="font-mono uppercase tracking-label text-fg-3 text-mono">
                {TOTAL_UPDATES} NEED ATTENTION
              </span>
            </div>
          </div>
        </section>

        <hr className="border-0 border-t border-border" />

        {TOTAL_UPDATES > 0 && (
          <section className="flex items-center justify-between border border-border-strong bg-surface-tint px-5 py-4">
            <div className="flex items-center gap-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-fg font-mono text-mono font-bold">
                !
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-body text-sm text-fg">
                  {TOTAL_UPDATES} skills have updates available
                </span>
                <MonoLabel className="text-micro">review before installing</MonoLabel>
              </div>
            </div>
            <button
              type="button"
              className="h-8 px-4 rounded-sm bg-fg text-bg font-mono uppercase tracking-label text-mono font-bold hover:opacity-90 transition-opacity duration-150"
              onClick={() => setView("installed")}
            >
              UPDATE ALL →
            </button>
          </section>
        )}

        <section className="grid grid-cols-2 gap-12">
          <div className="flex flex-col gap-5">
            <div className="flex items-baseline justify-between">
              <MonoLabel>AI TOOLS</MonoLabel>
              <MonoLabel className="text-micro">{ACTIVE_AGENTS} ACTIVE</MonoLabel>
            </div>
            <div className="flex flex-col">
              {AGENTS.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-4 border-b border-border py-3 first:border-t"
                >
                  <span className="font-mono text-mono text-fg-2 w-28 truncate">{agent.label}</span>
                  <div className="flex flex-1 items-center gap-2">
                    <div className="relative h-1.5 flex-1 bg-border overflow-hidden rounded-sm">
                      <div
                        className="absolute inset-y-0 left-0 bg-fg-2 transition-[width] duration-300"
                        style={{ width: `${density(agent.count, agent.capacity) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="font-display text-kpi font-bold leading-none tracking-tight w-10 text-right">
                    {agent.count}
                  </span>
                  <span
                    className={`font-mono uppercase tracking-label text-micro w-20 text-right ${
                      agent.status === "updates" ? "text-accent" : "text-success"
                    }`}
                  >
                    {agent.status === "updates"
                      ? `${agent.updates} UPDATE${agent.updates === 1 ? "" : "S"}`
                      : "CURRENT"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex items-baseline justify-between">
              <MonoLabel>RECENT</MonoLabel>
              <MonoLabel className="text-micro">{RECENT.length} EVENTS</MonoLabel>
            </div>
            <div className="flex flex-col">
              {RECENT.map((event) => (
                <div
                  key={`${event.kind}-${event.skill}-${event.when}`}
                  className="flex items-baseline gap-3 border-b border-border py-3 first:border-t"
                >
                  <span className="font-mono uppercase tracking-label text-micro text-fg-3 w-16 shrink-0">
                    {event.kind}
                  </span>
                  <span className="font-mono text-mono text-fg grow truncate">{event.skill}</span>
                  <MonoLabel className="text-micro w-28 truncate text-right">
                    {event.agent}
                  </MonoLabel>
                  <MonoLabel className="text-micro w-20 text-right shrink-0">
                    {event.when}
                  </MonoLabel>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="border-0 border-t border-border" />

        <section className="flex flex-col gap-5">
          <MonoLabel>QUICK ACTIONS</MonoLabel>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setView("search")}
              className="flex flex-1 items-center justify-between h-14 px-5 bg-fg text-bg rounded-sm font-mono uppercase tracking-label text-mono font-bold hover:opacity-90 active:scale-[0.99] transition-all duration-150"
            >
              <span>+ INSTALL A SKILL</span>
              <span>→</span>
            </button>
            <button
              type="button"
              onClick={() => setView("marketplace")}
              className="flex h-14 px-6 items-center justify-center border border-border-strong text-fg rounded-sm font-mono uppercase tracking-label text-mono font-bold hover:border-fg-3 active:scale-[0.99] transition-all duration-150"
            >
              EXPLORE
            </button>
            <button
              type="button"
              onClick={() => setView("installed")}
              className="flex h-14 px-6 items-center justify-center text-fg-3 rounded-sm font-mono uppercase tracking-label text-mono hover:text-fg hover:bg-surface-hover active:scale-[0.99] transition-all duration-150"
            >
              SHARE WITH TEAM
            </button>
          </div>
        </section>
      </div>

      <StatusBar
        theme={theme}
        onToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      />
    </main>
  );

  const otherView = (
    <main className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 px-10">
      <span className="font-display text-heading font-bold tracking-tight text-fg">
        {view.toUpperCase()}
      </span>
      <MonoLabel>SCREEN NOT YET BUILT</MonoLabel>
      <button
        type="button"
        onClick={() => setView("home")}
        className="mt-4 h-9 px-4 border border-border-strong text-fg-2 rounded-sm font-mono uppercase tracking-label text-mono hover:border-fg-3 hover:text-fg active:scale-[0.99] transition-all duration-150"
      >
        BACK TO HOME
      </button>
    </main>
  );

  return (
    <div className="flex h-screen w-screen flex-col bg-bg text-fg">
      <header
        className="flex h-12 shrink-0 items-center justify-between border-b border-border px-6 select-none"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <div
          className="flex items-center gap-3"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <span className="font-display text-xl font-bold leading-none tracking-tight">curie</span>
          <MonoLabel className="text-micro">v0.1.0</MonoLabel>
        </div>
        <div
          className="flex items-center gap-2 font-mono uppercase tracking-label text-micro text-fg-3"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
          <span>READY</span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <nav className="flex w-24 shrink-0 flex-col border-r border-border py-5">
          <div className="flex flex-col gap-1 px-3">
            {(
              [
                { id: "home", label: "HOME" },
                { id: "installed", label: "SKILLS" },
                { id: "marketplace", label: "EXPLORE" },
                { id: "search", label: "FIND" },
              ] as { id: View; label: string }[]
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                className={
                  view === item.id
                    ? "h-7 flex items-center justify-center rounded-sm font-mono uppercase tracking-label text-mono bg-fg text-bg font-bold transition-colors duration-150"
                    : "h-7 flex items-center justify-center rounded-sm font-mono uppercase tracking-label text-mono text-fg-3 hover:text-fg hover:bg-surface-hover transition-colors duration-150"
                }
                onClick={() => setView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="flex flex-col gap-1 px-3">
            <button
              type="button"
              className={
                view === "settings"
                  ? "h-7 flex items-center justify-center rounded-sm font-mono uppercase tracking-label text-mono bg-fg text-bg font-bold transition-colors duration-150"
                  : "h-7 flex items-center justify-center rounded-sm font-mono uppercase tracking-label text-mono text-fg-3 hover:text-fg hover:bg-surface-hover transition-colors duration-150"
              }
              onClick={() => setView("settings")}
            >
              SET
            </button>
          </div>
        </nav>

        {view === "home" ? homeView : otherView}
      </div>
    </div>
  );
}

function StatusBar({ theme, onToggle }: { theme: ThemeMode; onToggle: () => void }) {
  return (
    <footer className="shrink-0 flex items-center justify-between border-t border-border px-6 py-2.5 bg-bg">
      <div className="flex items-center gap-4 font-mono uppercase tracking-label text-micro text-fg-3">
        <span>CURIE · v0.1.0</span>
        <span className="text-fg-4">·</span>
        <span>NODE 24.18.0</span>
        <span className="text-fg-4">·</span>
        <span>3 AGENTS</span>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 font-mono uppercase tracking-label text-micro text-fg-3 hover:text-fg transition-colors duration-150"
      >
        <span>{theme === "dark" ? "◐" : "◑"}</span>
        <span>{theme.toUpperCase()}</span>
      </button>
    </footer>
  );
}

export default App;
