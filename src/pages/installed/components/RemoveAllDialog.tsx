import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useT } from "@/i18n";
import { skills } from "@/store/skills";
import { removeAll, removingSkill } from "../store/store";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function RemoveAllDialog({ open, onClose }: Props) {
  const t = useT("installed");

  const confirm = async () => {
    try {
      await removeAll();
      onClose();
    } catch {
      onClose();
    }
  };

  return (
    <ConfirmDialog
      open={open}
      title={t("removeAllTitle")}
      description={t("removeAllBody", { n: skills.value.length })}
      confirmLabel={t("removeAllConfirm")}
      cancelLabel={t("removeCancel")}
      busy={removingSkill.value !== null}
      busyLabel={t("removing")}
      confirmPhrase={t("removeAllPhrase")}
      confirmPhraseLabel={t("removeAllPhraseLabel", { phrase: t("removeAllPhrase") })}
      onCancel={onClose}
      onConfirm={confirm}
    />
  );
}
