import { useReducedMotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { Else, If, Then, When } from "react-if";
import { useLocation } from "wouter";
import { THEME_OPTIONS } from "@/components/types";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { APP_NAME, APP_VERSION_LABEL } from "@/lib/meta";
import { lang, node, setLang, setTheme, theme } from "@/store/system";
import { appUpdate } from "@/store/update";

const CHIP =
  "flex h-6 cursor-pointer items-center gap-1.5 rounded-sm px-2 font-mono uppercase tracking-label text-micro transition-colors";

function Sep() {
  return <span className="text-fg-4/80 select-none">·</span>;
}

function Meta({ children, dim }: { children: ReactNode; dim?: boolean }) {
  return <span className={dim ? "text-fg-4" : "text-fg-3"}>{children}</span>;
}

export function StatusBar() {
  const t = useT();
  const [, navigate] = useLocation();
  const shouldReduceMotion = useReducedMotionConfig();

  const current = node.value;
  const hasUpdate = appUpdate.value?.updateAvailable === true;

  const themeIndex = Math.max(
    0,
    THEME_OPTIONS.findIndex((option) => option.id === theme.value),
  );
  const activeTheme = THEME_OPTIONS[themeIndex];

  const cycleTheme = () => setTheme(THEME_OPTIONS[(themeIndex + 1) % THEME_OPTIONS.length].id);
  const toggleLang = () => setLang(lang.value === "en" ? "es" : "en");
  const openUpdate = () => navigate("/settings");

  return (
    <footer className="flex h-9 shrink-0 items-center justify-between border-t border-border bg-surface pr-3 pl-5">
      <div className="flex min-w-0 items-center gap-2.5 font-mono uppercase tracking-label text-micro">
        <Meta>{APP_NAME}</Meta>
        <Meta dim>{APP_VERSION_LABEL}</Meta>
        <Sep />
        <If condition={current?.installed === true}>
          <Then>
            <Meta dim>
              <span title={current?.manager ?? undefined}>
                {t("status.node")} {current?.version?.replace(/^v/, "") ?? "—"}
              </span>
            </Meta>
          </Then>
          <Else>
            <span className="flex items-center gap-1.5 text-warning">
              <span className="inline-block h-1 w-1 rounded-full bg-warning" aria-hidden />
              {t("status.setupRequired")}
            </span>
          </Else>
        </If>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <When condition={hasUpdate}>
          <button
            type="button"
            onClick={openUpdate}
            className={cn(CHIP, "text-accent hover:underline")}
          >
            <span
              className={cn(
                "inline-block h-1 w-1 rounded-full bg-accent",
                !shouldReduceMotion && "animate-pulse",
              )}
              aria-hidden
            />
            {t("status.appUpdateAvailable")}
          </button>
        </When>

        <button
          type="button"
          onClick={cycleTheme}
          aria-label={t("settings.theme")}
          className={cn(CHIP, "text-fg-3 hover:bg-surface-hover hover:text-fg")}
        >
          <span className="flex gap-px" aria-hidden>
            {activeTheme.swatches.map((swatch) => (
              <span
                key={swatch}
                className="inline-block h-2 w-1 border border-border-strong"
                style={{ backgroundColor: swatch }}
              />
            ))}
          </span>
          {t(`settings.theme${activeTheme.id.charAt(0).toUpperCase()}${activeTheme.id.slice(1)}`)}
        </button>

        <button
          type="button"
          onClick={toggleLang}
          aria-label={t("settings.language")}
          className={cn(CHIP, "text-fg-3 hover:bg-surface-hover hover:text-fg")}
        >
          {lang.value.toUpperCase()}
        </button>
      </div>
    </footer>
  );
}
