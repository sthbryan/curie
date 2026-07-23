import { openUrl } from "@tauri-apps/plugin-opener";
import { Button } from "@/components/Button";
import { ChoiceButton } from "@/components/ChoiceButton";
import { Label } from "@/components/Label";
import {
  REDUCED_MOTION_OPTIONS,
  type ReducedMotionPref,
  THEME_OPTIONS,
  type ThemeMode,
} from "@/components/types";
import { t } from "@/i18n";
import { APP_NAME, APP_VERSION_LABEL } from "@/lib/meta";
import { systemStore } from "@/store/system";
import { Row } from "./components/Row";
import { SystemRow } from "./components/SystemRow";
import { ThemeCard } from "./components/ThemeCard";

const THEME_LABEL: Record<ThemeMode, { label: string; hint: string }> = {
  dark: { label: "settings.themeDark", hint: "settings.themeDarkHint" },
  light: { label: "settings.themeLight", hint: "settings.themeLightHint" },
  rose: { label: "settings.themeRose", hint: "settings.themeRoseHint" },
  dawn: { label: "settings.themeDawn", hint: "settings.themeDawnHint" },
};

const REDUCED_MOTION_LABEL: Record<ReducedMotionPref, string> = {
  user: "settings.reducedMotionSystem",
  always: "settings.reducedMotionTrue",
  never: "settings.reducedMotionFalse",
};

export function Settings() {
  const { lang, theme, reducedMotion, node, setLang, setTheme, setReducedMotion } = systemStore;

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-10 pt-12 pb-8">
        <section className="flex flex-col gap-3">
          <Label>{t(lang.value, "settings.eyebrow")}</Label>
          <h2 className="font-display text-heading font-bold tracking-tight text-fg">
            {t(lang.value, "settings.title")}
          </h2>
        </section>

        <hr className="border-0 border-t border-border" />

        <section className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between pb-4">
            <Label>{t(lang.value, "settings.preferences")}</Label>
          </div>

          <div className="flex flex-col gap-1">
            <Row label={t(lang.value, "settings.language")}>
              <div className="flex items-center gap-3">
                <span className="font-body text-sm text-fg-3 hidden sm:inline">
                  {t(
                    lang.value,
                    lang.value === "en" ? "settings.languageENFull" : "settings.languageESFull",
                  )}
                </span>
                <div className="flex">
                  <ChoiceButton
                    active={lang.value === "en"}
                    label={t(lang.value, "settings.languageEN")}
                    onClick={() => setLang("en")}
                  />
                  <ChoiceButton
                    active={lang.value === "es"}
                    label={t(lang.value, "settings.languageES")}
                    onClick={() => setLang("es")}
                    isLast
                  />
                </div>
              </div>
            </Row>

            <p className="font-body text-sm text-fg-3 pb-4 pl-0">
              {t(lang.value, "settings.languageDesc")}
            </p>

            <div className="flex flex-col gap-3 border-b border-border py-4">
              <span className="font-body text-sm text-fg">{t(lang.value, "settings.theme")}</span>
              <div className="grid grid-cols-2 gap-3">
                {THEME_OPTIONS.map((opt) => (
                  <ThemeCard
                    key={opt.id}
                    id={opt.id}
                    active={theme.value === opt.id}
                    label={t(lang.value, THEME_LABEL[opt.id].label)}
                    hint={t(lang.value, THEME_LABEL[opt.id].hint)}
                    swatches={opt.swatches}
                    onClick={() => setTheme(opt.id)}
                  />
                ))}
              </div>
            </div>

            <p className="font-body text-sm text-fg-3 pb-4 pl-0 pt-3">
              {t(lang.value, "settings.themeDesc")}
            </p>

            <Row label={t(lang.value, "settings.reducedMotion")}>
              <div className="flex">
                {REDUCED_MOTION_OPTIONS.map((opt, index) => (
                  <ChoiceButton
                    key={opt}
                    active={reducedMotion.value === opt}
                    label={t(lang.value, REDUCED_MOTION_LABEL[opt])}
                    onClick={() => setReducedMotion(opt)}
                    isLast={index === REDUCED_MOTION_OPTIONS.length - 1}
                  />
                ))}
              </div>
            </Row>

            <p className="font-body text-sm text-fg-3 pb-4 pl-0">
              {t(lang.value, "settings.reducedMotionDesc")}
            </p>
          </div>
        </section>

        <hr className="border-0 border-t border-border" />

        <section className="flex flex-col gap-5">
          <Label>{t(lang.value, "settings.system")}</Label>

          {node.value?.installed ? (
            <div className="flex flex-col">
              <SystemRow
                label={t(lang.value, "settings.nodeVersion")}
                value={node.value.version?.replace(/^v/, "") ?? "—"}
              />
              <SystemRow
                label={t(lang.value, "settings.nodeManager")}
                value={node.value.manager ?? "—"}
              />
              <SystemRow
                label={t(lang.value, "settings.nodePath")}
                value={node.value.path ?? "—"}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2 border border-border-strong bg-surface-tint px-5 py-4">
              <span className="font-body text-sm text-fg">
                {t(lang.value, "settings.nodeMissing")}
              </span>
              <Label>{t(lang.value, "settings.goToSetup")}</Label>
            </div>
          )}
        </section>

        <hr className="border-0 border-t border-border" />

        <section className="flex flex-col gap-3">
          <Label>{t(lang.value, "settings.about")}</Label>
          <p className="font-body text-sm text-fg-2 max-w-md leading-relaxed">
            {t(lang.value, "settings.aboutDescription")}
          </p>
          <p className="font-mono uppercase tracking-label text-micro text-fg-4 pt-2 flex items-center gap-2">
            <span>
              {APP_NAME} · {APP_VERSION_LABEL}
            </span>
            <span className="text-fg-4">·</span>
            <Button
              size="xs"
              variant="link"
              className="px-0 hover:underline cursor-pointer"
              onClick={() => {
                void Promise.resolve(openUrl("https://github.com/sthbryan/curie")).catch(() => {
                  // ignore
                });
              }}
            >
              github.com/sthbryan/curie ↗
            </Button>
          </p>
        </section>
      </div>
    </main>
  );
}
