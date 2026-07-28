import { Plus } from "lucide-react";
import { useT } from "@/i18n";

type Props = {
  busy: boolean;
  onAdd: () => void;
};

export function AddProjectCell({ busy, onAdd }: Props) {
  const t = useT("projects");

  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={busy}
      className="flex min-h-40 flex-col items-center justify-center gap-2 border border-dashed border-border text-fg-3 transition-colors duration-150 hover:border-fg-3 hover:text-fg focus-visible:outline focus-visible:outline-1 focus-visible:outline-fg disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Plus size={16} aria-hidden />
      <span className="font-mono uppercase tracking-label text-micro">
        {busy ? t("adding") : t("add")}
      </span>
    </button>
  );
}
