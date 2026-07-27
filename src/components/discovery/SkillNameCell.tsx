import { useT } from "@/i18n";
import type { DiscoveryNamespace } from "./types";

type Props = {
  ns: DiscoveryNamespace;
  name: string;
  pkg: string;
  installed: boolean;
};

export function SkillNameCell({ ns, name, pkg, installed }: Props) {
  const t = useT(ns);

  return (
    <>
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate font-mono text-mono text-fg">{name}</span>
        {installed ? (
          <span className="shrink-0 rounded-sm border border-border-strong px-1 py-px font-mono uppercase tracking-label text-micro text-fg-3">
            {t("installed")}
          </span>
        ) : null}
      </div>
      <span className="truncate font-mono text-micro text-fg-4" title={pkg}>
        {pkg}
      </span>
    </>
  );
}
