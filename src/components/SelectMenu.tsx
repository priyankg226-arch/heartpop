import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption<V extends string> {
  value: V;
  label: ReactNode;
}

/**
 * Custom dropdown that looks and behaves like the language picker.
 * Use it wherever the app lets people choose one option from a list.
 */
export function SelectMenu<V extends string>({
  value,
  options,
  onChange,
  label,
  ariaLabel,
  icon,
  variant,
  className = "",
}: {
  value: V;
  options: SelectOption<V>[];
  onChange: (value: V) => void;
  /** Visible label rendered above the trigger. */
  label?: ReactNode;
  /** Accessible name when there is no visible label. */
  ariaLabel?: string;
  icon?: ReactNode;
  /** Extra class prefix, e.g. "language" adds language-control / language-trigger… */
  variant?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const [active, setActive] = useState(index);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const cls = (base: string) =>
    variant ? `select-${base} ${variant}-${base}` : `select-${base}`;
  const current = options[index];

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    list.current?.focus();
    list.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView?.({ block: "nearest" });
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const choose = (next: V) => {
    if (next !== value) onChange(next);
    setOpen(false);
    button.current?.focus();
  };

  const openMenu = () => {
    setActive(index);
    setOpen(true);
  };

  const onButtonKey = (e: KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      openMenu();
    }
  };

  const onListKey = (e: KeyboardEvent) => {
    const n = options.length;
    if (e.key === "ArrowDown") setActive((i) => (i + 1) % n);
    else if (e.key === "ArrowUp") setActive((i) => (i - 1 + n) % n);
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(n - 1);
    else if (e.key === "Enter" || e.key === " ") choose(options[active].value);
    else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      if (e.key === "Escape") button.current?.focus();
      return;
    } else return;
    e.preventDefault();
  };

  return (
    <div
      className={`${cls("control")}${open ? " open" : ""} ${className}`.trim()}
      ref={root}
    >
      {label && (
        <span id={`${id}-label`} className="select-label">
          {label}
        </span>
      )}
      <button
        ref={button}
        type="button"
        className={cls("trigger")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={ariaLabel}
        aria-labelledby={
          label && !ariaLabel ? `${id}-label ${id}-value` : undefined
        }
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onButtonKey}
      >
        {icon}
        <span id={`${id}-value`} className={cls("current")}>
          {current?.label}
        </span>
        <ChevronDown size={14} className={cls("chevron")} aria-hidden="true" />
      </button>
      {open && (
        <ul
          ref={list}
          id={`${id}-list`}
          className={cls("menu")}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel}
          aria-labelledby={label && !ariaLabel ? `${id}-label` : undefined}
          aria-activedescendant={`${id}-opt-${active}`}
          onKeyDown={onListKey}
        >
          {options.map((option, i) => (
            <li
              key={option.value}
              id={`${id}-opt-${i}`}
              role="option"
              data-value={option.value}
              aria-selected={option.value === value}
              className={i === active ? "active" : undefined}
              onPointerEnter={() => setActive(i)}
              onClick={() => choose(option.value)}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={15} aria-hidden="true" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
