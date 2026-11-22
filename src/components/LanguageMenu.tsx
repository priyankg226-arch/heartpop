import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { languages, type Language } from "../i18n";
import { useLanguage } from "../i18n/react";
import { translate } from "../i18n/ui";

const keys = Object.keys(languages) as Language[];

export function LanguageMenu() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => keys.indexOf(language));
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const label = translate(language, "Message language");

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    list.current?.focus();
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const choose = (key: Language) => {
    setLanguage(key);
    setOpen(false);
    button.current?.focus();
  };

  const openMenu = () => {
    setActive(keys.indexOf(language));
    setOpen(true);
  };

  const onButtonKey = (e: KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      openMenu();
    }
  };

  const onListKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") setActive((i) => (i + 1) % keys.length);
    else if (e.key === "ArrowUp")
      setActive((i) => (i - 1 + keys.length) % keys.length);
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(keys.length - 1);
    else if (e.key === "Enter" || e.key === " ") choose(keys[active]);
    else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      if (e.key === "Escape") button.current?.focus();
      return;
    } else return;
    e.preventDefault();
  };

  return (
    <div className={`language-control${open ? " open" : ""}`} ref={root}>
      <button
        ref={button}
        type="button"
        className="language-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={`${label}: ${languages[language]}`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onButtonKey}
      >
        <Globe size={16} />
        <span className="language-current">{languages[language]}</span>
        <ChevronDown size={13} className="language-chevron" />
      </button>
      {open && (
        <ul
          ref={list}
          id={`${id}-list`}
          className="language-menu"
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${id}-${keys[active]}`}
          onKeyDown={onListKey}
        >
          {keys.map((key, i) => (
            <li
              key={key}
              id={`${id}-${key}`}
              role="option"
              data-value={key}
              aria-selected={key === language}
              className={i === active ? "active" : undefined}
              onPointerEnter={() => setActive(i)}
              onClick={() => choose(key)}
            >
              <span>{languages[key]}</span>
              {key === language && <Check size={15} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
