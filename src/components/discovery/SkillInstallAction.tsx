import { Check, Plus } from "lucide-react";
import { ActionProgress } from "@/components/ActionProgress";
import { Button } from "@/components/Button";
import { useT } from "@/i18n";
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

  return (
    <Button size="xs" variant="primary" onClick={handleInstall} disabled={busy}>
      <Plus size={10} />
      {t("install")}
    </Button>
  );
}
