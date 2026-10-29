import { openUrl } from "@tauri-apps/plugin-opener";
import { Button } from "@zovaris/sephiro/button";
import { MetadataList } from "@zovaris/sephiro/metadata-list";
import { Notice } from "@zovaris/sephiro/notice";
import { SegmentedControl } from "@zovaris/sephiro/segmented-control";
import { SquareArrowOutUpRight } from "lucide-react";
import { Else, If, Then } from "react-if";

import "@zovaris/sephiro/css/metadata-list.css";

import { Heading } from "@/components/Heading";
import { Label } from "@/components/Label";
import {
  COLOR_MODE_OPTIONS,
  type ColorMode,
  REDUCED_MOTION_OPTIONS,
  type ReducedMotionPref,
  THEME_OPTIONS,
} from "@/components/types";
import { useT } from "@/i18n";
import { APP_NAME } from "@/lib/meta";
import { systemStore } from "@/store/system";

import { Row } from "./components/Row";
import { ThemeCard } from "./components/ThemeCard";
import { UpdateSection } from "./components/UpdateSection";

const REDUCED_MOTION_LABEL: Record<ReducedMotionPref, string> = {
  user: "reducedMotionSystem",
  always: "reducedMotionTrue",
  never: "reducedMotionFalse",
};

const COLOR_MODE_LABEL: Record<ColorMode, string> = {
  auto: "colorModeAuto",
  light: "colorModeLight",
  dark: "colorModeDark",
};

export function Settings() {
  const t = useT("settings");
  const {
    lang,
    theme,
    colorMode,
    resolvedMode,
    reducedMotion,
    node,
    setLang,
    setTheme,
    setColorMode,
    setReducedMotion,
  } = systemStore;

  const handleOpenGitHub = () => {
    void Promise.resolve(openUrl("https://github.com/sthbryan/curie")).catch(() => {
      // ignore
    });
  };

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-10 pt-12 pb-8">
        <section className="flex flex-col gap-3">
          <Label>{t("eyebrow")}</Label>
          <Heading>{t("title")}</Heading>
        </section>

        <hr className="border-0 border-t border-border" />

        <section className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between pb-4">
            <Label>{t("preferences")}</Label>
          </div>

          <div className="flex flex-col gap-1">
            <Row label={t("language")}>
              <div className="flex items-center gap-3">
                <span className="font-body text-sm text-fg-3 hidden sm:inline">
                  {t(lang.value === "en" ? "languageENFull" : "languageESFull")}
                </span>
                <SegmentedControl
                  ariaLabel={t("language")}
                  size="sm"
                  value={lang.value}
                  options={[
                    { value: "en", label: t("languageEN") },
                    { value: "es", label: t("languageES") },
                  ]}
                  onValueChange={(value) => setLang(value === "es" ? "es" : "en")}
                />
              </div>
            </Row>

            <p className="font-body text-sm text-fg-3 pb-4 pl-0">{t("languageDesc")}</p>

            <div className="flex flex-col gap-3 border-b border-border py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-body text-sm text-fg">{t("theme")}</span>
                <SegmentedControl
                  ariaLabel={t("colorMode")}
                  size="sm"
                  value={colorMode.value}
                  options={COLOR_MODE_OPTIONS.map((mode) => ({
                    value: mode,
                    label: t(COLOR_MODE_LABEL[mode]),
                  }))}
                  onValueChange={(value) =>
                    setColorMode(value === "light" ? "light" : value === "dark" ? "dark" : "auto")
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                {THEME_OPTIONS.map((opt) => (
                  <ThemeCard
                    key={opt.id}
                    id={opt.id}
                    active={theme.value === opt.id}
                    label={opt.label}
                    swatches={opt.swatches[resolvedMode.value]}
                    onClick={() => setTheme(opt.id)}
                  />
                ))}
              </div>
            </div>

            <p className="font-body text-sm text-fg-3 pb-4 pl-0 pt-3">{t("themeDesc")}</p>

            <Row label={t("reducedMotion")}>
              <SegmentedControl
                ariaLabel={t("reducedMotion")}
                size="sm"
                value={reducedMotion.value}
                options={REDUCED_MOTION_OPTIONS.map((opt) => ({
                  value: opt,
                  label: t(REDUCED_MOTION_LABEL[opt]),
                }))}
                onValueChange={(value) =>
                  setReducedMotion(
                    value === "always" ? "always" : value === "never" ? "never" : "user",
                  )
                }
              />
            </Row>

            <p className="font-body text-sm text-fg-3 pb-4 pl-0">{t("reducedMotionDesc")}</p>
          </div>
        </section>

        <hr className="border-0 border-t border-border" />

        <section className="flex flex-col gap-5">
          <Label>{t("system")}</Label>

          <If condition={Boolean(node.value?.installed)}>
            <Then>
              <MetadataList
                layout="columns"
                dividers
                items={[
                  {
                    label: t("nodeVersion"),
                    value: node.value?.version?.replace(/^v/, ""),
                  },
                  { label: t("nodeManager"), value: node.value?.manager },
                  { label: t("nodePath"), value: node.value?.path },
                ]}
              />
            </Then>
            <Else>
              <Notice variant="warning" title={t("nodeMissing")}>
                <Label>{t("goToSetup")}</Label>
              </Notice>
            </Else>
          </If>
        </section>

        <hr className="border-0 border-t border-border" />

        <UpdateSection />

        <hr className="border-0 border-t border-border" />

        <section className="flex flex-col gap-3">
          <Label>{t("about")}</Label>
          <p className="font-body text-sm text-fg-2 max-w-md leading-relaxed">
            {t("aboutDescription")}
          </p>
          <p className="font-mono uppercase tracking-label text-micro text-fg-4 pt-2 flex items-center gap-2 flex-wrap">
            <span>{APP_NAME}</span>
            <span className="text-fg-4">·</span>
            <Button
              size="sm"
              variant="quiet"
              className="hover:underline cursor-pointer"
              onClick={handleOpenGitHub}
            >
              github.com/sthbryan/curie
              <SquareArrowOutUpRight size={10} strokeWidth={1.5} />
            </Button>
          </p>
        </section>
      </div>
    </main>
  );
}
