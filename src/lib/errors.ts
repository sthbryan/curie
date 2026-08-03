import { t } from "@/i18n";
import { lang } from "@/store/system";

const DETAIL_SEP = "\u001f";
const CODE_PREFIX = "errors.";

function raw(e: unknown): string {
  return typeof e === "string" ? e : e instanceof Error ? e.message : String(e);
}

export function errorMessage(e: unknown): string {
  const text = raw(e);
  const sep = text.indexOf(DETAIL_SEP);
  const code = sep === -1 ? text : text.slice(0, sep);
  const detail = sep === -1 ? undefined : text.slice(sep + 1);

  if (!code.startsWith(CODE_PREFIX)) return text;

  const translated = t(lang.value, code, detail ? { detail } : undefined);
  if (translated !== code) return translated;
  return detail ? `${code} (${detail})` : code;
}
