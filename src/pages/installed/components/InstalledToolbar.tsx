import { X } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useT } from "@/i18n";
import { skills } from "@/store/skills";
import { hasFilters, updateNames, visibleSkills } from "../lib/derived";
import { clearFilters, queryInput, setQuery, toggleUpdatesOnly, updatesOnly } from "../store/store";
import { AgentSelect } from "./AgentSelect";

export function InstalledToolbar() {
  const t = useT("installed");
  const outdated = updateNames.value.size;

  return (
    <section className="flex flex-wrap items-end gap-3">
      <Input
        label={t("search")}
        type="search"
        value={queryInput.value}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("searchPlaceholder")}
        wrapperClassName="min-w-64 flex-1"
      />

      <AgentSelect />

      {outdated > 0 ? (
        <Button
          size="sm"
          variant="outline"
          selected={updatesOnly.value}
          onClick={toggleUpdatesOnly}
          className="h-10"
        >
          {t("filterUpdates")}
          <span className="opacity-60">{outdated}</span>
        </Button>
      ) : null}

      {hasFilters.value ? (
        <Button size="sm" variant="ghost" onClick={clearFilters} className="h-10">
          <X size={12} />
          {t("clearFilters")}
        </Button>
      ) : null}

      <span className="ml-auto flex h-10 items-center border-l border-border pl-4 font-mono uppercase tracking-label text-micro text-fg-4">
        {t("showing", { n: visibleSkills.value.length, total: skills.value.length })}
      </span>
    </section>
  );
}
