import { GitBranch } from "lucide-react";
import { useState } from "react";
import { Else, If, Then } from "react-if";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Label } from "@/components/Label";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { type CustomActions, classifyInput } from "../hooks/useCustomActions";

type Props = {
  actions: CustomActions;
};

export function UrlInstallForm({ actions }: Props) {
  const t = useT("custom.url");
  const [url, setUrl] = useState("");

  const kind = classifyInput(url);
  const isReady = kind !== null;
  const busy = actions.installStatus.value.status === "processing";

  const handleSubmit = () => {
    if (!isReady || busy) return;
    const submitted = url.trim();
    void actions.install(submitted).then((result) => {
      if (!result) return;
      if (url.trim() === submitted) setUrl("");
    });
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
            value={url}
            onChange={(e) => setUrl(e.target.value)}
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
