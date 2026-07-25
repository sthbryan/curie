import { FileUp, LoaderCircle, Save } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/Button";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { useLocalInstall } from "../hooks/useLocalInstall";
import { checkFrontmatter } from "../lib/frontmatter";
import { FieldLabel } from "./FieldLabel";
import { FormSection } from "./FormSection";

const CONTENT_ID = "custom-local-content";

export function LocalSkillForm() {
  const t = useT("custom.local");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { installing, install } = useLocalInstall();

  const hasContent = content.trim().length > 0;
  const frontmatter = checkFrontmatter(content);
  const canInstall = hasContent && frontmatter.ok && !installing;

  const warning =
    !hasContent || frontmatter.ok
      ? null
      : frontmatter.reason === "block"
        ? t("frontmatterMissing")
        : frontmatter.reason === "fields"
          ? t("frontmatterFields", { fields: frontmatter.missing.join(", ") })
          : t("frontmatterName", { name: frontmatter.name });

  const reset = () => {
    setContent("");
    setFileName(null);
  };

  const handleFile = async (file: File) => {
    setContent(await file.text());
    setFileName(file.name);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  };

  const handleSubmit = () => {
    if (!canInstall || !frontmatter.ok) return;
    void install(frontmatter.name, content).then((ok) => {
      if (ok) reset();
    });
  };

  return (
    <FormSection eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")}>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-end justify-between gap-3">
          <FieldLabel htmlFor={CONTENT_ID}>{t("contentLabel")}</FieldLabel>
          <input
            ref={fileRef}
            type="file"
            accept=".md,text/markdown,text/plain"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => fileRef.current?.click()}
            disabled={installing}
          >
            <FileUp size={12} aria-hidden />
            {t("fileButton")}
          </Button>
        </div>
        <textarea
          id={CONTENT_ID}
          value={content}
          onChange={(e) => setContent((e.target as HTMLTextAreaElement).value)}
          placeholder={t("contentPlaceholder")}
          spellCheck={false}
          rows={10}
          disabled={installing}
          aria-invalid={warning !== null}
          aria-describedby={`${CONTENT_ID}-status`}
          className={cn(
            "w-full border bg-bg px-3 py-2 font-mono text-mono text-fg placeholder:text-fg-4 outline-none rounded-sm resize-y min-h-45 disabled:opacity-60",
            warning
              ? "border-warning/60 focus:border-warning"
              : "border-border-strong focus:border-fg-3",
          )}
        />
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p
          id={`${CONTENT_ID}-status`}
          aria-live="polite"
          className={cn("font-body text-xs max-w-md", warning ? "text-warning" : "text-fg-4")}
        >
          {warning ??
            (frontmatter.ok
              ? t("ready", { name: frontmatter.name })
              : fileName
                ? t("fileLoaded", { name: fileName })
                : t("hint"))}
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="lg"
            variant="ghost"
            className="px-5"
            onClick={reset}
            disabled={installing || !hasContent}
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
