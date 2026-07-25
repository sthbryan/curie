import { Button } from "@/components/Button";
import { useT } from "@/i18n";
import { dismissErrors, removeError, updateApplyError } from "../store/store";

export function ErrorBanner() {
  const t = useT("installed");
  const message = updateApplyError.value ?? removeError.value;

  if (!message) return null;

  return (
    <div className="flex items-start justify-between gap-4 border border-accent/30 bg-surface-tint px-4 py-3">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-mono uppercase tracking-label text-micro text-accent">
          {updateApplyError.value ? t("updateError") : t("removeError")}
        </span>
        <p className="break-all font-body text-sm text-fg-3">{message}</p>
      </div>
      <Button size="xs" variant="link" className="shrink-0 px-0" onClick={dismissErrors}>
        ×
      </Button>
    </div>
  );
}
