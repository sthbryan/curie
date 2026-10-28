import { Button } from "@zovaris/sephiro/button";
import { Field } from "@zovaris/sephiro/field";
import { Input } from "@zovaris/sephiro/input";
import { X } from "lucide-react";

import "@zovaris/sephiro/css/field.css";
import "@zovaris/sephiro/css/input.css";

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
      <Field label={t("search")} className="min-w-64 flex-1">
        <Input
          type="search"
          size="lg"
          value={queryInput.value}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
        />
      </Field>

      <AgentSelect />

      {outdated > 0 ? (
        <Button
          size="lg"
          variant={updatesOnly.value ? "primary" : "secondary"}
          aria-pressed={updatesOnly.value}
          onClick={toggleUpdatesOnly}
        >
          {t("filterUpdates")}
          <span className="opacity-60">{outdated}</span>
        </Button>
      ) : null}

      {hasFilters.value ? (
        <Button size="lg" variant="quiet" onClick={clearFilters}>
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
