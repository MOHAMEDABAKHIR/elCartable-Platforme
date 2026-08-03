import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '../lib/types';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { page, totalPages, total } = meta;

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-brand-100 px-4 py-3 sm:flex-row">
      <span className="text-xs text-brand-500">
        Page {page} sur {totalPages} — {total} résultat{total > 1 ? 's' : ''}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex items-center gap-1 rounded-lg border border-brand-200 px-3 py-1.5 text-sm text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:bg-brand-50"
        >
          <ChevronLeft size={16} />
          Précédent
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex items-center gap-1 rounded-lg border border-brand-200 px-3 py-1.5 text-sm text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 hover:enabled:bg-brand-50"
        >
          Suivant
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
