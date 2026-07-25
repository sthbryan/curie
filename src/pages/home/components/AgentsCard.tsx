import { Label } from "@/components/Label";
import { useT } from "@/i18n";
import { agentCapacity, agents, agentsShareCount, PREVIEW_LIMIT } from "../lib/derived";
import { AgentBar } from "./AgentBar";
import { AgentChips } from "./AgentChips";
import { CardHead } from "./CardHead";
import { EmptyNote } from "./EmptyNote";
import { MoreLink } from "./MoreLink";

export function AgentsCard() {
  const t = useT("home");
  const list = agents.value;

  return (
    <section className="flex flex-col gap-5">
      <CardHead
        title={t("aiTools")}
        meta={<Label className="text-micro">{t("active", { n: list.length })}</Label>}
      />
      {list.length === 0 ? (
        <EmptyNote>{t("skillsNone")}</EmptyNote>
      ) : agentsShareCount.value ? (
        <AgentChips agents={list} />
      ) : (
        <div className="flex flex-col">
          {list.slice(0, PREVIEW_LIMIT).map((agent) => (
            <AgentBar key={agent.id} agent={agent} capacity={agentCapacity.value} />
          ))}
          <MoreLink count={list.length - PREVIEW_LIMIT} to="/installed" />
        </div>
      )}
    </section>
  );
}
