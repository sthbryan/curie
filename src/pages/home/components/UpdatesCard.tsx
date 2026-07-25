import { RotateCcw } from "lucide-react";
import { Button } from "@/components/Button";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { updatesError } from "@/store/skills";
import { useUpdatesCheck } from "../hooks/useUpdatesCheck";
import { checkingUpdates, PREVIEW_LIMIT, totalSkills, updates } from "../lib/derived";
import { CardHead } from "./CardHead";
import { EmptyNote } from "./EmptyNote";
import { MoreLink } from "./MoreLink";
import { UpdateRow } from "./UpdateRow";

export function UpdatesCard() {
  const t = useT("home");
  const { checking, check } = useUpdatesCheck();
  const pending = checkingUpdates.value;
  const list = updates.value;

  return (
    <section className="flex flex-col gap-5">
      <CardHead
        title={t("updates")}
        meta={
          <Button
            size="xs"
            variant="link"
            className="px-0"
            onClick={check}
            disabled={checking}
            aria-label={t("updatesCheck")}
          >
            <RotateCcw
              size={10}
              strokeWidth={1.5}
              className={cn("transition-transform", checking && "animate-spin")}
            />
            {checking ? t("updatesChecking") : t("updatesCheck")}
          </Button>
        }
      />
      {updatesError.value ? (
        <EmptyNote>{t("updatesError")}</EmptyNote>
      ) : pending ? (
        <EmptyNote pulse>{t("updatesChecking")}</EmptyNote>
      ) : list.length === 0 ? (
        <EmptyNote>{totalSkills.value === 0 ? t("skillsNone") : t("noUpdates")}</EmptyNote>
      ) : (
        <div className="flex flex-col">
          {list.slice(0, PREVIEW_LIMIT).map(({ skill, source }) => (
            <UpdateRow key={skill.name} name={skill.name} source={source} />
          ))}
          <MoreLink count={list.length - PREVIEW_LIMIT} to="/installed" />
        </div>
      )}
    </section>
  );
}
