import { computed } from "@preact/signals";
import { summarizeAgents, updateNameSet } from "@/lib/skills";
import { skills, skillUpdates } from "@/store/skills";
import { agentFilter, query, sortDir, sortKey, updatesOnly } from "../store/store";
import { buildSearchIndex, selectSkills } from "./query";

export const ROW_HEIGHT = 61;

export const updateNames = computed(() => updateNameSet(skillUpdates.value));

export const agentOptions = computed(() => summarizeAgents(skills.value));

export const searchIndex = computed(() => buildSearchIndex(skills.value));

export const visibleSkills = computed(() =>
  selectSkills(
    skills.value,
    searchIndex.value,
    { query: query.value, agent: agentFilter.value, updatesOnly: updatesOnly.value },
    updateNames.value,
    { key: sortKey.value, dir: sortDir.value },
  ),
);

export const hasFilters = computed(
  () => query.value.trim() !== "" || agentFilter.value !== null || updatesOnly.value,
);
