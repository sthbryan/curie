import { openUrl } from "@tauri-apps/plugin-opener";
import { Button } from "@zovaris/sephiro/button";
import { SegmentedControl } from "@zovaris/sephiro/segmented-control";
import { SquareArrowOutUpRight } from "lucide-react";
import { Else, If, Then } from "react-if";

import { Heading } from "@/components/Heading";
import { Label } from "@/components/Label";
import { REDUCED_MOTION_OPTIONS, type ReducedMotionPref, THEME_OPTIONS } from "@/components/types";
import { useT } from "@/i18n";
import { APP_NAME } from "@/lib/meta";
import { systemStore } from "@/store/system";

import { Row } from "./components/Row";
import { SystemRow } from "./components/SystemRow";
import { ThemeCard } from "./components/ThemeCard";
import { UpdateSection } from "./components/UpdateSection";

const REDUCED_MOTION_LABEL: Record<ReducedMotionPref, string> = {
  user: "reducedMotionSystem",
  always: "reducedMotionTrue",
  never: "reducedMotionFalse",
};

export function Settings() {
  const t = useT("settings");
  const { lang, theme, reducedMotion, node, setLang, setTheme, setReducedMotion } = systemStore;

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
              <span className="font-body text-sm text-fg">{t("theme")}</span>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {THEME_OPTIONS.map((opt) => {
                  const handlePickTheme = () => {
                    setTheme(opt.id);
                  };
                  return (
                    <ThemeCard
                      key={opt.id}
                      id={opt.id}
                      active={theme.value === opt.id}
                      label={opt.label}
                      hint={opt.mode.toUpperCase()}
                      swatches={opt.swatches}
                      onClick={handlePickTheme}
                    />
                  );
                })}
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
              <div className="flex flex-col">
                <SystemRow
                  label={t("nodeVersion")}
                  value={node.value?.version?.replace(/^v/, "") ?? "—"}
                />
                <SystemRow label={t("nodeManager")} value={node.value?.manager ?? "—"} />
                <SystemRow label={t("nodePath")} value={node.value?.path ?? "—"} />
              </div>
            </Then>
            <Else>
              <div className="flex flex-col gap-2 border border-border-strong bg-surface-tint px-5 py-4">
                <span className="font-body text-sm text-fg">{t("nodeMissing")}</span>
                <Label>{t("goToSetup")}</Label>
              </div>
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
