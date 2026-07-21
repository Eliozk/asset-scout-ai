"use client";

interface FilterOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

interface FilterCheckboxGroupProps<T extends string> {
  readonly title: string;
  readonly idPrefix: string;
  readonly options: readonly (T | FilterOption<T>)[];
  readonly selected: readonly T[];
  readonly onChange: (next: readonly T[]) => void;
}

function toOption<T extends string>(option: T | FilterOption<T>): FilterOption<T> {
  return typeof option === "string" ? { value: option, label: option } : option;
}

/**
 * Generic checkbox filter group reused for asset type, license, source,
 * format, engine, and style — one implementation, no per-filter duplication.
 * Options may be plain strings (label === value) or {value, label} pairs
 * for cases like source ids that need a friendlier display label.
 */
export function FilterCheckboxGroup<T extends string>({
  title,
  idPrefix,
  options,
  selected,
  onChange,
}: FilterCheckboxGroupProps<T>) {
  function toggle(value: T) {
    onChange(selected.includes(value) ? selected.filter((entry) => entry !== value) : [...selected, value]);
  }

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-foreground">{title}</legend>
      <div className="mt-2.5 flex flex-col gap-2">
        {options.map((rawOption) => {
          const { value, label } = toOption(rawOption);
          const id = `${idPrefix}-${value}`;
          return (
            <label
              key={value}
              htmlFor={id}
              className="flex cursor-pointer items-center gap-2.5 text-sm text-text-muted hover:text-foreground"
            >
              <input
                id={id}
                type="checkbox"
                checked={selected.includes(value)}
                onChange={() => toggle(value)}
                className="focus-ring size-4 rounded border-border-strong bg-surface-elevated text-accent-blue accent-accent-blue"
              />
              {label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
