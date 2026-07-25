import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useT } from "@/i18n";
import { remove, removingSkill } from "../store/store";

type Props = {
  name: string | null;
  onClose: () => void;
};

export function RemoveSkillDialog({ name, onClose }: Props) {
  const t = useT("installed");

  const confirm = async () => {
    if (!name) return;
    try {
      await remove([name]);
      onClose();
    } catch {
      onClose();
    }
  };

  return (
    <ConfirmDialog
      open={name !== null}
      title={t("removeTitle")}
      description={t("removeBody")}
      detail={name ?? undefined}
      confirmLabel={t("removeConfirm")}
      cancelLabel={t("removeCancel")}
      busy={removingSkill.value !== null}
      busyLabel={t("removing")}
      onCancel={onClose}
      onConfirm={confirm}
    />
  );
}
