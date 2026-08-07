import { Heading } from "@/components/Heading";
import { Label } from "@/components/Label";
import { ScopeBanner } from "@/components/ScopeBanner";
import { useT } from "@/i18n";
import { fadeUp } from "@/lib/motion";
import { LocalSkillForm } from "./components/LocalSkillForm";
import { RemoteSkillForm } from "./components/RemoteSkillForm";

export function Custom() {
  const t = useT("custom");

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-10 pt-12 pb-8">
        <ScopeBanner />

        <section {...fadeUp(0)} className="flex flex-col gap-3">
          <Label>{t("eyebrow")}</Label>
          <Heading>{t("title")}</Heading>
          <p className="max-w-2xl font-body text-sm text-fg-3">{t("subtitle")}</p>
        </section>

        <section
          {...fadeUp(0.05)}
          className="flex flex-col gap-8 border border-border bg-surface-tint p-8"
        >
          <RemoteSkillForm />

          <div className="flex items-center gap-4">
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono uppercase tracking-label text-micro text-fg-4">
              {t("divider")}
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <LocalSkillForm />
        </section>
      </div>
    </main>
  );
}
