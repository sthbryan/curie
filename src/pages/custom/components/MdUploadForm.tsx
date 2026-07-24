import { FileUp, Save, X } from "lucide-react";
import { useRef, useState } from "react";
import { Else, If, Then, When } from "react-if";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Label } from "@/components/Label";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import type { CustomActions } from "../hooks/useCustomActions";

type Props = {
  actions: CustomActions;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.md$/i, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "")
    .slice(0, 64);
}

function isValidName(name: string): boolean {
  if (!name) return false;
  if (name.length > 64) return false;
  if (/^[-._]/.test(name)) return false;
  return /^[A-Za-z0-9._-]+$/.test(name);
}

export function MdUploadForm({ actions }: Props) {
  const t = useT("custom.md");
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const nameValid = isValidName(name);
  const contentValid = content.trim().length > 0;
  const canSubmit = nameValid && contentValid && !actions.saving;
  const showSaved = actions.saved !== null && !actions.saveError;

  const handleFile = async (file: File) => {
    const text = await file.text();
    setContent(text);
    setFileName(file.name);
    if (!name) {
      setName(slugify(file.name));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFile(file);
    }
    e.target.value = "";
  };

  const handlePickFile = () => {
    fileRef.current?.click();
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    actions.save(name, content).catch(() => {});
  };

  const handleReset = () => {
    setName("");
    setContent("");
    setFileName(null);
    actions.clearSaved();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label>{t("eyebrow")}</Label>
        <h3 className="font-display text-xl font-bold tracking-tight text-fg">{t("title")}</h3>
        <p className="font-body text-sm text-fg-3 max-w-lg">{t("subtitle")}</p>
      </div>

      <When condition={Boolean(actions.saveError)}>
        <div className="flex items-start justify-between gap-4 border border-accent/30 bg-surface-tint px-4 py-3">
          <div className="min-w-0 flex flex-col gap-1">
            <span className="font-mono uppercase tracking-label text-micro text-accent">
              {t("error")}
            </span>
            <p className="font-body text-sm text-fg-3 break-all">{actions.saveError}</p>
          </div>
          <Button
            size="xs"
            variant="link"
            className="shrink-0 px-0"
            aria-label={t("error")}
            onClick={actions.dismissSaveError}
          >
            <X size={10} />
          </Button>
        </div>
      </When>

      <When condition={showSaved}>
        <div className="flex flex-col gap-1 border border-success/30 bg-surface-tint px-4 py-3">
          <span className="font-mono uppercase tracking-label text-micro text-success">
            {t("success", { name: actions.saved?.name ?? "" })}
          </span>
          <p className="font-body text-xs text-fg-3 break-all">
            {t("savedAt", { path: actions.saved?.path ?? "" })}
          </p>
        </div>
      </When>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <label
            htmlFor="custom-md-name"
            className="font-mono uppercase tracking-label text-micro text-fg-3"
          >
            {t("nameLabel")}
          </label>
          <Input
            id="custom-md-name"
            label={t("nameLabel")}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            wrapperClassName="w-full"
            className={cn(name && !nameValid && "border-accent/60 focus:border-accent")}
          />
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".md,text/markdown,text/plain"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          size="lg"
          variant="outline"
          className="px-5 shrink-0"
          onClick={handlePickFile}
          type="button"
        >
          <FileUp size={14} />
          {t("fileButton")}
        </Button>
      </div>

      <When condition={fileName !== null}>
        <p className="font-body text-xs text-fg-3">{t("fileLoaded", { name: fileName ?? "" })}</p>
      </When>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="custom-md-content"
          className="font-mono uppercase tracking-label text-micro text-fg-3"
        >
          {t("contentLabel")}
        </label>
        <textarea
          id="custom-md-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("contentPlaceholder")}
          spellCheck={false}
          rows={10}
          className={cn(
            "w-full border border-border-strong bg-bg px-3 py-2 font-mono text-mono text-fg placeholder:text-fg-4 outline-none focus:border-fg-3 rounded-sm resize-y min-h-[180px]",
          )}
        />
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="font-body text-xs text-fg-4 max-w-md">{t("hint")}</p>
        <div className="flex items-center gap-2">
          <When condition={showSaved}>
            <Button size="lg" variant="ghost" className="px-5" onClick={handleReset} type="button">
              {t("fileButton")}
            </Button>
          </When>
          <Button
            size="lg"
            variant="primary"
            className="px-5"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            <Save size={14} />
            <If condition={actions.saving}>
              <Then>{t("saving")}</Then>
              <Else>{t("submit")}</Else>
            </If>
          </Button>
        </div>
      </div>
    </div>
  );
}
