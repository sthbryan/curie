import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useT } from "@/i18n";
import { useScope } from "@/lib/routes";
import { skills } from "@/store/skills";
import { removeAll, removingSkill } from "../store/store";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function RemoveAllDialog({ open, onClose }: Props) {
  const t = useT("installed");
  const scope = useScope();
  const scoped = scope.kind === "project";
  const phrase = scoped ? scope.project.name : t("removeAllPhrase");

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
      description={
        scoped
          ? t("removeAllBodyProject", { name: scope.project.name })
          : t("removeAllBody", { n: skills.value.length })
      }
      detail={scoped ? scope.project.path : undefined}
      confirmLabel={t("removeAllConfirm")}
      cancelLabel={t("removeCancel")}
      busy={removingSkill.value !== null}
      busyLabel={t("removing")}
      confirmPhrase={phrase}
      confirmPhraseLabel={t("removeAllPhraseLabel", { phrase })}
      onCancel={onClose}
      onConfirm={confirm}
    />
  );
}
