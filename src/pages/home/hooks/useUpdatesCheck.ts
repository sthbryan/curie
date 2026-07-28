import { toast } from "sonner";
import { t } from "@/i18n";
import { checkSkillUpdates } from "@/lib/boot";
import { unverifiedCount } from "@/lib/skills";
import { skillUpdates, updatesLoading } from "@/store/skills";
import { lang } from "@/store/system";

export function useUpdatesCheck() {
  const check = async () => {
    await checkSkillUpdates();
    const found = skillUpdates.value.filter((update) => update.updateAvailable).length;
    const unverified = unverifiedCount(skillUpdates.value);

    if (found > 0) {
      toast.success(t(lang.value, "toast.updates", { n: found }));
      return;
    }
    if (unverified > 0) {
      toast.warning(t(lang.value, "toast.unverified", { n: unverified }));
      return;
    }
    toast.success(t(lang.value, "toast.noUpdates"));
  };

  return { checking: updatesLoading.value, check };
}
