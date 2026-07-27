import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import type { DiscoveryNamespace } from "./types";

type Props = {
  ns: DiscoveryNamespace;
  name: string;
  pkg: string;
  installed: boolean;
  official?: boolean;
};

const CHIP = "shrink-0 rounded-sm border px-1 py-px font-mono uppercase tracking-label text-micro";

export function SkillNameCell({ ns, name, pkg, installed, official = false }: Props) {
  const t = useT(ns);

  return (
    <>
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate font-mono text-mono text-fg">{name}</span>
        {official ? (
          <span className={cn(CHIP, "border-accent/50 text-accent")}>{t("official")}</span>
        ) : null}
        {installed ? (
          <span className={cn(CHIP, "border-border-strong text-fg-3")}>{t("installed")}</span>
        ) : null}
      </div>
      <span className="truncate font-mono text-micro text-fg-4" title={pkg}>
        {pkg}
      </span>
    </>
  );
}
