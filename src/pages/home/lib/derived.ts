import { computed } from "@preact/signals";
import {
  availableUpdates,
  buildRecentActivity,
  maxAgentCount,
  summarizeAgents,
} from "@/lib/skills";
import { skills, skillUpdates, updatesLoading } from "@/store/skills";

export const PREVIEW_LIMIT = 5;

export const totalSkills = computed(() => skills.value.length);

export const agents = computed(() => summarizeAgents(skills.value));

export const agentCapacity = computed(() => maxAgentCount(agents.value));

export const agentsShareCount = computed(() => {
  const list = agents.value;
  return list.length > 1 && list.every((agent) => agent.count === list[0].count);
});

export const recent = computed(() => buildRecentActivity(skills.value));

export const updates = computed(() => availableUpdates(skills.value, skillUpdates.value));

export const checkingUpdates = computed(
  () => updatesLoading.value && skillUpdates.value.length === 0,
);
