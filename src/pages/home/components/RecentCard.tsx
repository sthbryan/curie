import { Label } from "@/components/Label";
import { useT } from "@/i18n";
import { useNow } from "../hooks/useNow";
import { PREVIEW_LIMIT, recent } from "../lib/derived";
import { CardHead } from "./CardHead";
import { EmptyNote } from "./EmptyNote";
import { MoreLink } from "./MoreLink";
import { RecentRow } from "./RecentRow";

export function RecentCard() {
  const t = useT("home");
  const now = useNow();
  const events = recent.value;

  return (
    <section className="flex flex-col gap-5">
      <CardHead
        title={t("recent")}
        meta={<Label className="text-micro">{t("events", { n: events.length })}</Label>}
      />
      {events.length === 0 ? (
        <EmptyNote>{t("noRecent")}</EmptyNote>
      ) : (
        <div className="flex flex-col">
          {events.slice(0, PREVIEW_LIMIT).map((event) => (
            <RecentRow key={`${event.kind}-${event.skill}-${event.at}`} event={event} now={now} />
          ))}
          <MoreLink count={events.length - PREVIEW_LIMIT} to="/installed" />
        </div>
      )}
    </section>
  );
}
