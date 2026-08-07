import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBarBySchool({
  value,
  onChange,
  placeholder = 'Rechercher...',
  className = '',
}: SearchBarProps) {
  return (
    <div className={`relative max-w-md ${className}`}>
      <Search
        size={18}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-400"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border bg-white py-2.5 pl-10 pr-4 text-sm text-brand-900 outline-none focus:ring-2 focus:ring-brand-300"
      />
    </div>
  );
}