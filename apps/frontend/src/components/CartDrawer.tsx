import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '../store/cart';
import { useCartDrawer } from '../store/cartDrawer';
import { formatMAD } from '../lib/format';
import { Button } from './ui';

export function CartDrawer() {
  const { isOpen, close } = useCartDrawer();
  const { items, updateQuantity, removeItem, totalItems, totalAmount } = useCart();

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        onClick={close}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-brand-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Panier"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-out sm:max-w-md ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-brand-700" />
            <h2 className="font-bold text-brand-900">
              Mon panier{totalItems > 0 && <span className="ml-1 text-brand-500">({totalItems})</span>}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Fermer le panier"
            className="rounded-full p-2 text-brand-600 hover:bg-brand-50 hover:text-brand-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="text-4xl">🛒</span>
              <p className="mt-3 font-semibold text-brand-800">Votre panier est vide</p>
              <p className="mt-1 text-sm text-brand-500">Ajoutez des articles depuis le catalogue.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item, index) => (
                <li key={`${item.productId ?? item.label}-${index}`} className="flex gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.label} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl">🛒</span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-semibold text-brand-800">{item.label}</p>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        aria-label="Retirer l'article"
                        className="shrink-0 rounded-full p-1 text-brand-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-full border border-brand-200 px-1 py-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Diminuer la quantité"
                          className="rounded-full p-1 text-brand-600 hover:bg-brand-50 disabled:opacity-30"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-brand-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          aria-label="Augmenter la quantité"
                          className="rounded-full p-1 text-brand-600 hover:bg-brand-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-brand-700">
                        {formatMAD(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-brand-100 px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold text-brand-700">Total</span>
              <span className="text-lg font-extrabold text-brand-900">{formatMAD(totalAmount)}</span>
            </div>
            <Link to="/panier" onClick={close}>
              <Button variant="accent" className="w-full">
                Commander
              </Button>
            </Link>
          </div>
        )}
      </aside>
    </Fragment>
  );
}