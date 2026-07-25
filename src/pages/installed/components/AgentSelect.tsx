import { ChevronDown } from "lucide-react";
import { useId } from "react";
import { useT } from "@/i18n";
import { agentOptions } from "../lib/derived";
import { agentFilter, setAgentFilter } from "../store/store";

export function AgentSelect() {
  const t = useT("installed");
  const id = useId();
  const options = agentOptions.value;

  if (options.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-mono uppercase tracking-label text-micro text-fg-4">
        {t("filterAgent")}
      </label>
      <div className="relative">
        <select
          id={id}
          value={agentFilter.value ?? ""}
          onChange={(e) => setAgentFilter((e.target as HTMLSelectElement).value || null)}
          className="h-9 w-full min-w-44 appearance-none border border-border-strong bg-bg pr-8 pl-2.5 font-mono uppercase tracking-label text-micro text-fg outline-none focus:border-fg"
        >
          <option value="">{t("filterAll")}</option>
          {options.map((agent) => (
            <option key={agent.id} value={agent.label}>
              {agent.label} · {agent.count}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-fg-4"
          aria-hidden
        />
      </div>
    </div>
  );
}
