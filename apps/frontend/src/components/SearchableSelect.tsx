import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export interface SearchableSelectOption {
  id: string;
  label: string;
  subtitle?: string | null;
  iconUrl?: string | null;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  /** Icon shown in the trigger and as the default avatar for each row. */
  icon?: ReactNode;
  /** Called (debounced) whenever the search text changes — for server-side search. */
  onSearch?: (query: string) => void;
  loading?: boolean;
  footerLabel?: string;
  onFooterClick?: () => void;
  className?: string;
  required?: boolean;
  name?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder = 'Rechercher...',
  emptyLabel = 'Aucun résultat',
  icon,
  onSearch,
  loading,
  footerLabel,
  onFooterClick,
  className,
  required,
  name,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // On garde l'option sélectionnée en mémoire séparément de `options` : dès
  // qu'on ferme le menu, la recherche est réinitialisée et le parent
  // recharge la liste "par défaut" (les 20 premières écoles) — si l'école
  // choisie venait d'une recherche, elle ne s'y trouve plus. Sans cet état
  // séparé, `options.find(...)` ne la retrouve plus et le champ paraît vide
  // alors que la valeur est en réalité toujours sélectionnée.
  const [selectedOption, setSelectedOption] = useState<SearchableSelectOption | null>(null);

  useEffect(() => {
    if (!value) {
      setSelectedOption(null);
      return;
    }
    const match = options.find((o) => o.id === value);
    if (match) setSelectedOption(match);
  }, [value, options]);

  const selected = selectedOption;

  // Close on outside click.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounce server-side search.
  useEffect(() => {
    if (!onSearch) return;
    const t = setTimeout(() => onSearch(query), 250);
    return () => clearTimeout(t);
  }, [query, onSearch]);

  useEffect(() => {
    if (open) {
      setHighlighted(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery('');
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (onSearch) return options; // server already filtered
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.subtitle ?? '').toLowerCase().includes(q),
    );
  }, [options, query, onSearch]);

  function select(opt: SearchableSelectOption) {
    setSelectedOption(opt);
    onChange(opt.id);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filtered[highlighted];
      if (opt) select(opt);
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className ?? ''}`}>
      {/* Hidden native input so the field still participates in form validation/submit. */}
      {required && <input tabIndex={-1} className="sr-only" value={value} name={name} required onChange={() => {}} />}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-12 sm:h-14 w-full items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-left text-brand-900 outline-none transition-colors focus:border-brand-400"
      >
        {icon && <span className="shrink-0 text-brand-400">{icon}</span>}
        <span className={`flex-1 truncate ${selected ? '' : 'text-gray-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-brand-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 min-w-[280px] rounded-2xl border border-brand-100 bg-white p-3 shadow-xl">
          <div className="relative mb-2">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-brand-100 bg-brand-50/60 py-2 pl-9 pr-3 text-sm text-brand-900 outline-none focus:border-brand-300"
            />
          </div>

          <ul className="max-h-72 overflow-y-auto">
            {loading && (
              <li className="px-3 py-6 text-center text-sm text-brand-400">Chargement...</li>
            )}

            {!loading && filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-brand-400">{emptyLabel}</li>
            )}

            {!loading &&
              filtered.map((opt, i) => (
                <li key={opt.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlighted(i)}
                    onClick={() => select(opt)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      i === highlighted ? 'bg-brand-50' : ''
                    } ${opt.id === value ? 'bg-brand-100/70' : ''}`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-brand-500">
                      {opt.iconUrl ? (
                        <img src={opt.iconUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        icon ?? opt.label.charAt(0).toUpperCase()
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-brand-900">{opt.label}</span>
                      {opt.subtitle && (
                        <span className="block truncate text-xs text-brand-400">{opt.subtitle}</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
          </ul>

          {footerLabel && (
            <div className="mt-1 border-t border-brand-100 pt-2">
              <button
                type="button"
                onClick={() => {
                  onFooterClick?.();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-brand-600 hover:bg-brand-50"
              >
                {icon}
                {footerLabel}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}