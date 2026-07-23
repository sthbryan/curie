import { openUrl } from "@tauri-apps/plugin-opener";
import { motion } from "motion/react";
import { Else, If, Then, When } from "react-if";
import { Button } from "@/components/Button";
import type { SkillSearchResult } from "@/components/types";
import type { Lang } from "@/i18n";
import { t } from "@/i18n";
import { listItem } from "@/lib/motion";
import { formatInstalls } from "@/lib/skills";

type Props = {
  result: SkillSearchResult;
  lang: Lang;
  installed: boolean;
  installing: boolean;
  installBusy: boolean;
  onInstall: (pkg: string) => void;
};

export function ResultRow({ result, lang, installed, installing, installBusy, onInstall }: Props) {
  const installs = formatInstalls(result.installs);

  return (
    <motion.article
      layout
      variants={listItem}
      className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_4.5rem_7rem] items-start gap-4 border-b border-border py-4 first:border-t"
    >
      <div className="min-w-0 flex flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-mono text-mono text-fg truncate">{result.name}</span>
          <When condition={installed}>
            <span className="shrink-0 font-mono uppercase tracking-label text-micro text-fg-3 border border-border-strong px-1.5 py-0.5 rounded-sm">
              {t(lang, "find.installed")}
            </span>
          </When>
        </div>
        <span className="font-mono text-micro text-fg-4 truncate" title={result.package}>
          {result.package}
        </span>
      </div>

      <div className="min-w-0 flex flex-col gap-1">
        <span className="font-mono text-mono text-fg-2 truncate">{result.source || "—"}</span>
        <button
          type="button"
          onClick={() => {
            void openUrl(result.url);
          }}
          className="w-fit font-mono uppercase tracking-label text-micro text-fg-4 hover:text-fg truncate text-left"
        >
          {t(lang, "find.open")}
        </button>
      </div>

      <div className="text-right">
        <span className="font-mono uppercase tracking-label text-micro text-fg-3">
          {installs || "—"}
        </span>
      </div>

      <div className="flex justify-end">
        <If condition={installed}>
          <Then>
            <span className="font-mono uppercase tracking-label text-micro text-fg-4">
              {t(lang, "find.installed")}
            </span>
          </Then>
          <Else>
            <Button
              size="xs"
              variant="primary"
              onClick={() => onInstall(result.package)}
              disabled={installBusy}
            >
              <If condition={installing}>
                <Then>{t(lang, "find.installing")}</Then>
                <Else>{t(lang, "find.install")}</Else>
              </If>
            </Button>
          </Else>
        </If>
      </div>
    </motion.article>
  );
}
