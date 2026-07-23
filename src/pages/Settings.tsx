import { openUrl } from "@tauri-apps/plugin-opener";
import { ChoiceButton } from "../components/ChoiceButton";
import { Label } from "../components/Label";
import { THEME_OPTIONS, type ThemeMode } from "../components/types";
import { t } from "../i18n";
import { APP_NAME, APP_VERSION_LABEL } from "../lib/meta";
import { useAppStore } from "../store/app";

const THEME_LABEL: Record<ThemeMode, { label: string; hint: string }> = {
  dark: { label: "settings.themeDark", hint: "settings.themeDarkHint" },
  light: { label: "settings.themeLight", hint: "settings.themeLightHint" },
  rose: { label: "settings.themeRose", hint: "settings.themeRoseHint" },
  dawn: { label: "settings.themeDawn", hint: "settings.themeDawnHint" },
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-4">
      <span className="font-body text-sm text-fg">{label}</span>
      <div className="flex items-center">{children}</div>
    </div>
  );
}

function SystemRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border py-3">
      <span className="font-mono uppercase tracking-label text-mono text-fg-3">{label}</span>
      <span className="font-mono text-mono text-fg truncate max-w-md text-right">{value}</span>
    </div>
  );
}

function ThemeCard({
  id,
  active,
  label,
  hint,
  swatches,
  onClick,
}: {
  id: ThemeMode;
  active: boolean;
  label: string;
  hint: string;
  swatches: [string, string, string];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-theme-option={id}
      className={`flex flex-col gap-3 border p-4 text-left transition-colors duration-150 rounded-sm ${
        active
          ? "border-fg bg-surface-tint"
          : "border-border-strong hover:border-fg-3 hover:bg-surface-hover"
      }`}
    >
      <div className="flex items-center gap-1.5">
        {swatches.map((color) => (
          <span
            key={`${id}-${color}`}
            className="h-5 w-5 rounded-sm border border-border-strong"
            style={{ backgroundColor: color }}
            aria-hidden
          />
        ))}
      </div>
      <div className="flex flex-col gap-0.5">
        <span
          className={`font-mono uppercase tracking-label text-mono ${
            active ? "text-fg font-bold" : "text-fg-2"
          }`}
        >
          {label}
        </span>
        <span className="font-mono uppercase tracking-label text-micro text-fg-4">{hint}</span>
      </div>
    </button>
  );
}

export function Settings() {
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const node = useAppStore((s) => s.node);
  const setLang = useAppStore((s) => s.setLang);
  const setTheme = useAppStore((s) => s.setTheme);

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-10 pt-12 pb-8">
        <section className="flex flex-col gap-3">
          <Label lang={lang}>{t(lang, "settings.eyebrow")}</Label>
          <h2 className="font-display text-heading font-bold tracking-tight text-fg">
            {t(lang, "settings.title")}
          </h2>
        </section>

        <hr className="border-0 border-t border-border" />

        <section className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between pb-4">
            <Label lang={lang}>{t(lang, "settings.preferences")}</Label>
          </div>

          <div className="flex flex-col gap-1">
            <Row label={t(lang, "settings.language")}>
              <div className="flex items-center gap-3">
                <span className="font-body text-sm text-fg-3 hidden sm:inline">
                  {t(lang, lang === "en" ? "settings.languageENFull" : "settings.languageESFull")}
                </span>
                <div className="flex">
                  <ChoiceButton
                    active={lang === "en"}
                    label={t(lang, "settings.languageEN")}
                    onClick={() => setLang("en")}
                  />
                  <ChoiceButton
                    active={lang === "es"}
                    label={t(lang, "settings.languageES")}
                    onClick={() => setLang("es")}
                    isLast
                  />
                </div>
              </div>
            </Row>

            <p className="font-body text-sm text-fg-3 pb-4 pl-0">
              {t(lang, "settings.languageDesc")}
            </p>

            <div className="flex flex-col gap-3 border-b border-border py-4">
              <span className="font-body text-sm text-fg">{t(lang, "settings.theme")}</span>
              <div className="grid grid-cols-2 gap-3">
                {THEME_OPTIONS.map((opt) => (
                  <ThemeCard
                    key={opt.id}
                    id={opt.id}
                    active={theme === opt.id}
                    label={t(lang, THEME_LABEL[opt.id].label)}
                    hint={t(lang, THEME_LABEL[opt.id].hint)}
                    swatches={opt.swatches}
                    onClick={() => setTheme(opt.id)}
                  />
                ))}
              </div>
            </div>

            <p className="font-body text-sm text-fg-3 pb-4 pl-0 pt-3">
              {t(lang, "settings.themeDesc")}
            </p>
          </div>
        </section>

        <hr className="border-0 border-t border-border" />

        <section className="flex flex-col gap-5">
          <Label lang={lang}>{t(lang, "settings.system")}</Label>

          {node?.installed ? (
            <div className="flex flex-col">
              <SystemRow
                label={t(lang, "settings.nodeVersion")}
                value={node.version?.replace(/^v/, "") ?? "—"}
              />
              <SystemRow label={t(lang, "settings.nodeManager")} value={node.manager ?? "—"} />
              <SystemRow label={t(lang, "settings.nodePath")} value={node.path ?? "—"} />
            </div>
          ) : (
            <div className="flex flex-col gap-2 border border-border-strong bg-surface-tint px-5 py-4">
              <span className="font-body text-sm text-fg">{t(lang, "settings.nodeMissing")}</span>
              <Label lang={lang}>{t(lang, "settings.goToSetup")}</Label>
            </div>
          )}
        </section>

        <hr className="border-0 border-t border-border" />

        <section className="flex flex-col gap-3">
          <Label lang={lang}>{t(lang, "settings.about")}</Label>
          <p className="font-body text-sm text-fg-2 max-w-md leading-relaxed">
            {t(lang, "settings.aboutDescription")}
          </p>
          <p className="font-mono uppercase tracking-label text-micro text-fg-4 pt-2 flex items-center gap-2">
            <span>
              {APP_NAME} · {APP_VERSION_LABEL}
            </span>
            <span className="text-fg-4">·</span>
            <button
              type="button"
              onClick={() => {
                openUrl("https://github.com/sthbryan/curie").catch(() => {
                  // ignore
                });
              }}
              className="font-mono uppercase tracking-label text-micro text-fg-3 hover:text-fg hover:underline cursor-pointer transition-colors duration-150"
            >
              github.com/sthbryan/curie ↗
            </button>
          </p>
        </section>
      </div>
    </main>
  );
}
