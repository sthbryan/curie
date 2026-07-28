import { Check, Plus } from "lucide-react";
import { ActionProgress } from "@/components/ActionProgress";
import { Button } from "@/components/Button";
import { useT } from "@/i18n";
import { useScope } from "@/lib/routes";
import type { DiscoveryNamespace } from "./types";

type Props = {
  ns: DiscoveryNamespace;
  pkg: string;
  installed: boolean;
  installing: boolean;
  busy: boolean;
  onInstall: (pkg: string) => void;
};

export function SkillInstallAction({ ns, pkg, installed, installing, busy, onInstall }: Props) {
  const t = useT(ns);
  const scope = useScope();

  if (installed) {
    return (
      <span className="flex items-center gap-1 font-mono uppercase tracking-label text-micro text-fg-4">
        <Check size={10} strokeWidth={1.5} />
        {t("installed")}
      </span>
    );
  }

  if (installing) {
    return <ActionProgress active labelKey={`${ns}.installing`} />;
  }

  const handleInstall = () => {
    onInstall(pkg);
  };

  const scoped = scope.kind === "project";

  return (
    <Button
      size="xs"
      variant={scoped ? "accent" : "primary"}
      onClick={handleInstall}
      disabled={busy}
    >
      <Plus size={10} />
      {t("install")}
      {scoped ? (
        <>
          <span aria-hidden className="opacity-50">
            →
          </span>
          <span className="max-w-24 truncate">{scope.project.name}</span>
        </>
      ) : null}
    </Button>
  );
}
