import { Plus } from "lucide-react";
import { Button } from "@/components/Button";
import { Label } from "@/components/Label";
import { useT } from "@/i18n";

type Props = {
  busy: boolean;
  onAdd: () => void;
};

export function ProjectsHeader({ busy, onAdd }: Props) {
  const t = useT("projects");

  return (
    <div className="flex items-end justify-between gap-6">
      <div className="flex min-w-0 flex-col gap-2">
        <Label>projects.eyebrow</Label>
        <h2 className="font-display text-heading tracking-display text-fg">{t("title")}</h2>
        <p className="font-body text-sm text-fg-3">{t("subtitle")}</p>
      </div>

      <Button size="sm" variant="primary" disabled={busy} onClick={onAdd}>
        <Plus size={14} />
        {busy ? t("adding") : t("add")}
      </Button>
    </div>
  );
}
