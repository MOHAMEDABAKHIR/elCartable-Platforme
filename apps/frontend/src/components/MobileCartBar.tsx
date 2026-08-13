import { useState } from 'react';
import { X } from 'lucide-react';
import { useCart } from '../store/cart';
import { formatMAD } from '../lib/format';
import { CartPanel } from './CartPanel';

export function MobileCartBar() {
  const { totalItems, totalAmount } = useCart();
  const [open, setOpen] = useState(false);

  if (totalItems === 0) return null;

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-between rounded-2xl bg-brand-700 px-5 py-4 text-white shadow-xl"
      >
        <span className="text-sm font-semibold">{totalItems} article{totalItems > 1 ? 's' : ''}</span>
        <span className="font-bold">{formatMAD(totalAmount)}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          <div onClick={() => setOpen(false)} className="absolute inset-0 bg-brand-900/40" />
          <div className="relative z-10 max-h-[85vh] rounded-t-3xl bg-white p-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-brand-500 hover:bg-brand-50"
            >
              <X className="h-5 w-5" />
            </button>
            <CartPanel />
          </div>
        </div>
      )}
    </div>
  );
}