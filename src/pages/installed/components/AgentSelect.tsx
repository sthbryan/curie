import { Select } from "@/components/Select";
import { useT } from "@/i18n";
import { agentOptions } from "../lib/derived";
import { agentFilter, setAgentFilter } from "../store/store";

export function AgentSelect() {
  const t = useT("installed");
  const agents = agentOptions.value;

  if (agents.length === 0) return null;

  return (
    <Select
      label={t("filterAgent")}
      value={agentFilter.value ?? ""}
      onChange={(e) => setAgentFilter((e.target as HTMLSelectElement).value || null)}
      wrapperClassName="w-56 shrink-0"
      options={[
        { value: "", label: t("filterAll") },
        ...agents.map((agent) => ({
          value: agent.label,
          label: `${agent.label} · ${agent.count}`,
        })),
      ]}
    />
  );
}
