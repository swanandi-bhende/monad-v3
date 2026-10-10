export function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="tablist" className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`text-caption rounded-pill px-4 py-2 font-medium transition-all duration-200 ${
              active ? "bg-ink text-canvas" : "text-muted hover:bg-ink/5 hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
