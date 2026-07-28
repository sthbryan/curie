import { AgentBadge } from "@/components/AgentBadge";
import { useT } from "@/i18n";

const VISIBLE = 2;

type Props = {
  agents: string[];
};

export function AgentCell({ agents }: Props) {
  const t = useT("installed");

  if (agents.length === 0) {
    return (
      <span className="font-mono uppercase tracking-label text-micro text-fg-4">
        {t("noAgents")}
      </span>
    );
  }

  const hidden = agents.length - VISIBLE;

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {agents.slice(0, VISIBLE).map((agent) => (
        <AgentBadge key={agent} label={agent} />
      ))}
      {hidden > 0 ? (
        <span
          title={agents.slice(VISIBLE).join(", ")}
          className="shrink-0 font-mono uppercase tracking-label text-micro text-fg-4"
        >
          {t("agentsMore", { n: hidden })}
        </span>
      ) : null}
    </div>
  );
}
