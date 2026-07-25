import { toast } from "sonner";
import { t } from "@/i18n";
import { checkSkillUpdates } from "@/lib/boot";
import { skillUpdates, updatesLoading } from "@/store/skills";
import { lang } from "@/store/system";

export function useUpdatesCheck() {
  const check = async () => {
    await checkSkillUpdates();
    const found = skillUpdates.value.filter((update) => update.updateAvailable).length;
    toast.success(
      found > 0 ? t(lang.value, "toast.updates", { n: found }) : t(lang.value, "toast.noUpdates"),
    );
  };

  return { checking: updatesLoading.value, check };
}
