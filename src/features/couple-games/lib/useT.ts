import { useCallback } from "react";
import { useLanguage } from "../../../i18n/react";
import { translate } from "../../../i18n/ui";

/** Translator bound to the active language. Unknown keys fall back to English. */
export function useT() {
  const { language } = useLanguage();
  return useCallback(
    (text: string, values?: Record<string, string | number>) =>
      translate(
        language,
        text,
        values && Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v)])),
      ),
    [language],
  );
}
export type T = ReturnType<typeof useT>;
