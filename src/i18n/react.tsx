import { createContext, useContext } from "react";
import type { Language } from "./index";
import { translate } from "./ui";
export const LanguageContext = createContext<{
  language: Language;
  setLanguage: (value: Language) => void;
}>({ language: "en", setLanguage: () => {} });
export const useLanguage = () => useContext(LanguageContext);
export function I18nText({
  text,
  values,
}: {
  text: string;
  values?: Record<string, string>;
}) {
  const { language } = useLanguage();
  return <>{translate(language, text, values)}</>;
}
