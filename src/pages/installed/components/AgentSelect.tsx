import { Field } from "@zovaris/sephiro/field";
import { Select } from "@zovaris/sephiro/select";

import "@zovaris/sephiro/css/field.css";
import "@zovaris/sephiro/css/select.css";

import { useT } from "@/i18n";

import { agentOptions } from "../lib/derived";
import { agentFilter, setAgentFilter } from "../store/store";

export function AgentSelect() {
  const t = useT("installed");
  const agents = agentOptions.value;

  if (agents.length === 0) return null;

  return (
    <Field label={t("filterAgent")} className="w-56 shrink-0">
      <Select
        ariaLabel={t("filterAgent")}
        size="lg"
        value={agentFilter.value ?? ""}
        onValueChange={(value) => setAgentFilter(value || null)}
        options={[
          { value: "", label: t("filterAll") },
          ...agents.map((agent) => ({
            value: agent.label,
            label: `${agent.label} · ${agent.count}`,
          })),
        ]}
      />
    </Field>
  );
}
