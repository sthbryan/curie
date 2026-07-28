import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { Project } from "@/components/types";
import { useT } from "@/i18n";

type Props = {
  project: Project | null;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ForgetProjectDialog({ project, busy, onConfirm, onCancel }: Props) {
  const t = useT("projects");

  return (
    <ConfirmDialog
      open={project !== null}
      title={t("forgetTitle")}
      description={t("forgetBody")}
      detail={project?.path}
      confirmLabel={t("forgetConfirm")}
      cancelLabel={t("forgetCancel")}
      busy={busy}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
