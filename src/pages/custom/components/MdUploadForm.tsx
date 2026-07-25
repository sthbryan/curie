import { FileUp, LoaderCircle, Save } from "lucide-react";
import { useRef, useState } from "react";
import { When } from "react-if";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { useSkillSave } from "../hooks/useSkillSave";
import { isValidSkillName, slugifySkillName } from "../lib/skillName";
import { FieldLabel } from "./FieldLabel";
import { FormSection } from "./FormSection";

const NAME_ID = "custom-md-name";
const CONTENT_ID = "custom-md-content";

export function MdUploadForm() {
  const t = useT("custom.md");
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { saving, save } = useSkillSave();

  const nameValid = isValidSkillName(name);
  const canSubmit = nameValid && content.trim().length > 0 && !saving;

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
    if (!canSubmit) return;
    void save(name, content).then((ok) => {
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
            disabled={saving}
            wrapperClassName="w-full"
            className={cn(
              "disabled:opacity-60",
              name && !nameValid && "border-accent/60 focus:border-accent",
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
          disabled={saving}
        >
          <FileUp size={14} aria-hidden />
          {t("fileButton")}
        </Button>
      </div>

      <When condition={fileName !== null}>
        <p className="font-body text-xs text-fg-3">{t("fileLoaded", { name: fileName ?? "" })}</p>
      </When>

      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor={CONTENT_ID}>{t("contentLabel")}</FieldLabel>
        <textarea
          id={CONTENT_ID}
          value={content}
          onChange={(e) => setContent((e.target as HTMLTextAreaElement).value)}
          placeholder={t("contentPlaceholder")}
          spellCheck={false}
          rows={10}
          disabled={saving}
          className="w-full border border-border-strong bg-bg px-3 py-2 font-mono text-mono text-fg placeholder:text-fg-4 outline-none focus:border-fg-3 rounded-sm resize-y min-h-45 disabled:opacity-60"
        />
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="font-body text-xs text-fg-4 max-w-md">{t("hint")}</p>
        <div className="flex items-center gap-2">
          <Button
            size="lg"
            variant="ghost"
            className="px-5"
            onClick={reset}
            disabled={saving || (!name && !content)}
          >
            {t("clear")}
          </Button>
          <Button
            size="lg"
            variant="primary"
            className="px-5 min-w-32"
            onClick={handleSubmit}
            disabled={!canSubmit}
            aria-busy={saving}
          >
            {saving ? (
              <LoaderCircle size={14} className="animate-spin" aria-hidden />
            ) : (
              <Save size={14} aria-hidden />
            )}
            {saving ? t("saving") : t("submit")}
          </Button>
        </div>
      </div>
    </FormSection>
  );
}
