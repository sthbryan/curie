import { GitBranch, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Else, If, Then, When } from "react-if";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Label } from "@/components/Label";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { type CustomActions, classifyInput } from "../hooks/useCustomActions";

const SUCCESS_RESET_MS = 2500;

type Props = {
  actions: CustomActions;
};

export function UrlInstallForm({ actions }: Props) {
  const t = useT("custom.url");
  const [value, setValue] = useState("");
  const resetTimer = useRef<number | null>(null);

  const kind = classifyInput(value);
  const isReady = kind !== null;
  const busy = actions.installing;
  const showSuccess = actions.urlSuccess !== null && !actions.installError;

  useEffect(() => {
    if (!actions.urlSuccess) return;
    const installed = actions.urlSuccess;
    const handle = window.setTimeout(() => {
      setValue((current) => (current.trim() === installed ? "" : current));
      actions.dismissUrlSuccess();
    }, SUCCESS_RESET_MS);
    resetTimer.current = handle;
    return () => {
      window.clearTimeout(handle);
      resetTimer.current = null;
    };
  }, [actions.urlSuccess, actions]);

  const handleSubmit = () => {
    if (!isReady || busy) return;
    void actions.install(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label>{t("eyebrow")}</Label>
        <h3 className="font-display text-xl font-bold tracking-tight text-fg">{t("title")}</h3>
        <p className="font-body text-sm text-fg-3 max-w-lg">{t("subtitle")}</p>
      </div>

      <When condition={Boolean(actions.installError)}>
        <div className="flex items-start justify-between gap-4 border border-accent/30 bg-surface-tint px-4 py-3">
          <div className="min-w-0 flex flex-col gap-1">
            <span className="font-mono uppercase tracking-label text-micro text-accent">
              {t("error")}
            </span>
            <p className="font-body text-sm text-fg-3 break-all">{actions.installError}</p>
          </div>
          <Button
            size="xs"
            variant="link"
            className="shrink-0 px-0"
            aria-label={t("error")}
            onClick={actions.dismissInstallError}
          >
            <X size={10} />
          </Button>
        </div>
      </When>

      <When condition={showSuccess}>
        <div className="flex items-center gap-3 border border-success/30 bg-surface-tint px-4 py-3">
          <span className="font-mono uppercase tracking-label text-micro text-success">
            {t("success", { target: actions.urlSuccess ?? "" })}
          </span>
        </div>
      </When>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <label
            htmlFor="custom-url-input"
            className="font-mono uppercase tracking-label text-micro text-fg-3"
          >
            {t("label")}
          </label>
          <Input
            id="custom-url-input"
            label={t("label")}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("placeholder")}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            wrapperClassName="w-full"
          />
        </div>
        <Button
          size="lg"
          variant="primary"
          className="px-5 shrink-0 sm:mt-5.5"
          onClick={handleSubmit}
          disabled={!isReady || busy}
        >
          <GitBranch size={14} />
          <If condition={busy}>
            <Then>{t("installing")}</Then>
            <Else>{t("submit")}</Else>
          </If>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={cn(
            "font-mono uppercase tracking-label text-micro",
            isReady ? "text-success" : "text-fg-4",
          )}
        >
          <If condition={isReady}>
            <Then>{kind === "url" ? "URL DETECTED" : "PACKAGE DETECTED"}</Then>
            <Else>—</Else>
          </If>
        </span>
        <p className="font-body text-xs text-fg-4">{t("hint")}</p>
      </div>
    </div>
  );
}
