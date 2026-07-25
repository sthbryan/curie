import { ArrowUp, Plus } from "lucide-react";
import type { Activity } from "@/components/types";
import { useT } from "@/i18n";
import { formatRelative } from "@/lib/skills";
import { lang } from "@/store/system";

type Props = {
  event: Activity;
  now: number;
};

export function RecentRow({ event, now }: Props) {
  const t = useT();
  const isInstall = event.kind === "install";
  const Glyph = isInstall ? Plus : ArrowUp;

  return (
    <div className="flex items-center gap-3 border-b border-border py-2.5 first:border-t">
      <Glyph
        size={12}
        strokeWidth={2}
        className="shrink-0 text-fg-4"
        aria-label={t(isInstall ? "home.kindInstall" : "home.kindUpdate")}
      />
      <span className="grow truncate font-mono text-mono text-fg">{event.skill}</span>
      <span className="max-w-40 truncate font-mono uppercase tracking-label text-micro text-fg-3">
        {event.source ?? t("installed.local")}
      </span>
      <span className="w-20 shrink-0 text-right font-mono uppercase tracking-label text-micro text-fg-4">
        {formatRelative(event.at, now, lang.value)}
      </span>
    </div>
  );
}
