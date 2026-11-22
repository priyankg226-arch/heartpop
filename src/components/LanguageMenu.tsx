import { Globe } from "lucide-react";
import { languages, type Language } from "../i18n";
import { useLanguage } from "../i18n/react";
import { translate } from "../i18n/ui";
import { SelectMenu } from "./SelectMenu";

const options = (Object.keys(languages) as Language[]).map((key) => ({
  value: key,
  label: languages[key],
}));

export function LanguageMenu() {
  const { language, setLanguage } = useLanguage();
  const label = translate(language, "Message language");
  return (
    <SelectMenu
      variant="language"
      value={language}
      options={options}
      onChange={setLanguage}
      ariaLabel={`${label}: ${languages[language]}`}
      icon={<Globe size={16} aria-hidden="true" />}
    />
  );
}
