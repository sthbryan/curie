import { openUrl } from "@tauri-apps/plugin-opener";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Label } from "@/components/Label";
import { useT } from "@/i18n";

const VOLTA_URL = "https://volta.sh";

type Props = {
  command: string;
  showLink: boolean;
};

export function ManualPanel({ command, showLink }: Props) {
  const t = useT("setup");

  const openVolta = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    void Promise.resolve(openUrl(VOLTA_URL)).catch(() => {
      // opening the browser is best effort
    });
  };

  return (
    <section className="flex flex-col gap-4 border-t border-border pt-6">
      <Label>{t("manualHint")}</Label>
      <pre className="overflow-x-auto rounded-sm border border-border bg-surface p-4 font-mono text-mono text-fg-2">
        {command}
      </pre>
      {showLink ? (
        <a
          href={VOLTA_URL}
          onClick={openVolta}
          className="cursor-pointer self-start font-mono uppercase tracking-label text-mono text-fg-3 transition-colors duration-150 hover:text-fg"
        >
          {t("manualLink")}
        </a>
      ) : null}
    </section>
  );
}
