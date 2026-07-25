import { ArrowUp, X } from "lucide-react";
import { ActionProgress } from "@/components/ActionProgress";
import { IconButton } from "@/components/IconButton";
import { useT } from "@/i18n";
import { removingSkill, update, updatingSkill } from "../store/store";

type Props = {
  name: string;
  outdated: boolean;
  busy: boolean;
  onAskRemove: (name: string) => void;
};

export function RowActions({ name, outdated, busy, onAskRemove }: Props) {
  const t = useT("installed");
  const updating = updatingSkill.value === name || updatingSkill.value === "*";
  const removing = removingSkill.value === name || removingSkill.value === "*";

  if (updating || removing) {
    return (
      <ActionProgress active labelKey={updating ? "installed.updatingOne" : "installed.removing"} />
    );
  }

  return (
    <>
      {outdated ? (
        <IconButton
          variant="accent"
          size="sm"
          label={t("updateOne")}
          disabled={busy}
          onClick={() => {
            update([name]).catch(() => {});
          }}
        >
          <ArrowUp size={14} />
        </IconButton>
      ) : (
        <span className="inline-block h-7 w-7 shrink-0" aria-hidden />
      )}
      <IconButton
        variant="danger"
        size="sm"
        label={t("remove")}
        disabled={busy}
        onClick={() => onAskRemove(name)}
      >
        <X size={13} />
      </IconButton>
    </>
  );
}
