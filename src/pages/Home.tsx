import { Label } from "../components/Label";
import { ACTIVE_AGENTS, AGENTS, RECENT, TOTAL_SKILLS, TOTAL_UPDATES } from "../components/types";
import { t } from "../i18n";
import { useAppStore } from "../store/app";

function density(count: number, capacity: number): number {
  return Math.min(count / capacity, 1);
}

export function Home() {
  const lang = useAppStore((s) => s.lang);
  const setView = useAppStore((s) => s.setView);
  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-10 pt-12 pb-8">
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
            <Label lang={lang}>{t(lang, "home.status")}</Label>
          </div>
          <div className="flex items-baseline gap-5 pt-3">
            <span className="font-display text-display font-bold leading-none tracking-display">
              {TOTAL_SKILLS}
            </span>
            <div className="flex flex-col gap-1">
              <span className="font-body text-base text-fg-2 tracking-tight">
                {t(lang, "home.skillsReady", { n: ACTIVE_AGENTS })}
              </span>
              <Label lang={lang} className="text-mono">
                {t(lang, "home.needAttention", { n: TOTAL_UPDATES })}
              </Label>
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
                  {t(lang, "home.updates", { n: TOTAL_UPDATES })}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setView("installed")}
              className="h-8 px-4 rounded-sm bg-fg text-bg font-mono uppercase tracking-label text-mono font-bold hover:opacity-90 transition-opacity duration-150"
            >
              {t(lang, "home.updateCta")}
            </button>
          </section>
        )}

        <section className="grid grid-cols-2 gap-12">
          <div className="flex flex-col gap-5">
            <div className="flex items-baseline justify-between">
              <Label lang={lang}>{t(lang, "home.aiTools")}</Label>
              <Label lang={lang} className="text-micro">
                {t(lang, "home.active", { n: ACTIVE_AGENTS })}
              </Label>
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
                      ? `${agent.updates} ${t(lang, "home.updateWord")}${agent.updates === 1 ? "" : lang === "es" ? "S" : "S"}`
                      : t(lang, "home.current")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex items-baseline justify-between">
              <Label lang={lang}>{t(lang, "home.recent")}</Label>
              <Label lang={lang} className="text-micro">
                {t(lang, "home.events", { n: RECENT.length })}
              </Label>
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
                  <Label lang={lang} className="text-micro w-28 truncate text-right">
                    {event.agent}
                  </Label>
                  <Label lang={lang} className="text-micro w-20 text-right shrink-0">
                    {event.when}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="border-0 border-t border-border" />

        <section className="flex flex-col gap-5">
          <Label lang={lang}>{t(lang, "home.actions")}</Label>
          <div className="flex gap-3">
            <button
              type="button"
              className="flex flex-1 items-center justify-between h-14 px-5 bg-fg text-bg rounded-sm font-mono uppercase tracking-label text-mono font-bold hover:opacity-90 active:scale-[0.99] transition-all duration-150"
            >
              <span>{t(lang, "home.install")}</span>
              <span>→</span>
            </button>
            <button
              type="button"
              className="flex h-14 px-6 items-center justify-center border border-border-strong text-fg rounded-sm font-mono uppercase tracking-label text-mono font-bold hover:border-fg-3 active:scale-[0.99] transition-all duration-150"
            >
              {t(lang, "home.exploreBtn")}
            </button>
            <button
              type="button"
              className="flex h-14 px-6 items-center justify-center text-fg-3 rounded-sm font-mono uppercase tracking-label text-mono hover:text-fg hover:bg-surface-hover active:scale-[0.99] transition-all duration-150"
            >
              {t(lang, "home.share")}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
