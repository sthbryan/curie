import { Heading } from "@/components/Heading";
import { Label } from "@/components/Label";
import { useT } from "@/i18n";
import { fadeUp } from "@/lib/motion";
import { totalSkills } from "../lib/derived";
import { StatLine } from "./StatLine";

export function HomeIntro() {
  const t = useT("home");

  return (
    <section {...fadeUp(0)} className="flex flex-col gap-3">
      <Label>{t("eyebrow")}</Label>
      <Heading>{t("title")}</Heading>
      {totalSkills.value === 0 ? (
        <p className="max-w-2xl font-body text-sm text-fg-3">{t("skillsNone")}</p>
      ) : (
        <StatLine />
      )}
    </section>
  );
}
