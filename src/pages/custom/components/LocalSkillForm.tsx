import { FileUp, LoaderCircle, Save } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { useLocalInstall } from "../hooks/useLocalInstall";
import { isValidSkillName, slugifySkillName } from "../lib/skillName";
import { FieldLabel } from "./FieldLabel";
import { FormSection } from "./FormSection";

const NAME_ID = "custom-local-name";
const CONTENT_ID = "custom-local-content";

export function LocalSkillForm() {
  const t = useT("custom.local");
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { installing, install } = useLocalInstall();

  const nameValid = isValidSkillName(name);
  const canInstall = nameValid && content.trim().length > 0 && !installing;

  const reset = () => {
    setName("");
    setContent("");
    setFileName(null);
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    setContent(text);
    setFileName(file.name);
    if (!name) setName(slugifySkillName(file.name));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  };

  const handleSubmit = () => {
    if (!canInstall) return;
    void install(name, content).then((ok) => {
      if (ok) reset();
    });
  };

  return (
    <FormSection eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <FieldLabel htmlFor={NAME_ID}>{t("nameLabel")}</FieldLabel>
          <Input
            id={NAME_ID}
            label={t("nameLabel")}
            type="text"
            value={name}
            onChange={(e) => setName((e.target as HTMLInputElement).value)}
            placeholder={t("namePlaceholder")}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            disabled={installing}
            wrapperClassName="w-full"
            className={cn(
              "disabled:opacity-60",
              name && !nameValid && "border-warning/60 focus:border-warning",
            )}
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
          onClick={() => fileRef.current?.click()}
          disabled={installing}
        >
          <FileUp size={14} aria-hidden />
          {t("fileButton")}
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor={CONTENT_ID}>{t("contentLabel")}</FieldLabel>
        <textarea
          id={CONTENT_ID}
          value={content}
          onChange={(e) => setContent((e.target as HTMLTextAreaElement).value)}
          placeholder={t("contentPlaceholder")}
          spellCheck={false}
          rows={10}
          disabled={installing}
          className="w-full border border-border-strong bg-bg px-3 py-2 font-mono text-mono text-fg placeholder:text-fg-4 outline-none focus:border-fg-3 rounded-sm resize-y min-h-45 disabled:opacity-60"
        />
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="font-body text-xs text-fg-4 max-w-md">
          {fileName ? t("fileLoaded", { name: fileName }) : t("hint")}
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="lg"
            variant="ghost"
            className="px-5"
            onClick={reset}
            disabled={installing || (!name && !content)}
          >
            {t("clear")}
          </Button>
          <Button
            size="lg"
            variant="primary"
            className="px-5 min-w-40"
            onClick={handleSubmit}
            disabled={!canInstall}
            aria-busy={installing}
          >
            {installing ? (
              <LoaderCircle size={14} className="animate-spin" aria-hidden />
            ) : (
              <Save size={14} aria-hidden />
            )}
            {installing ? t("installing") : t("submit")}
          </Button>
        </div>
      </div>
    </FormSection>
  );
}
