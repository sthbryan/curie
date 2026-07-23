import { t } from "@/i18n";
import { lang } from "@/store/system";
import { Button } from "./Button";
import { Label } from "./Label";

type Props = {
  message: string;
  onRetry: () => void;
};

export function FullPageError({ message, onRetry }: Props) {
  return (
    <main className="flex min-w-0 flex-1 flex-col items-center justify-center gap-6 px-10">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <Label className="text-accent">{t(lang.value, "home.loadError")}</Label>
        <p className="font-body text-sm text-fg-3 break-all">{message}</p>
      </div>
      <Button size="lg" variant="primary" onClick={onRetry}>
        {t(lang.value, "home.retry")}
      </Button>
    </main>
  );
}
