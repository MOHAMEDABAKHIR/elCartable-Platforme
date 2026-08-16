import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../store/cart';
import { formatMAD } from '../lib/format';
import { Button, Card, EmptyState } from './ui';

export function CartPanel() {
  const { items, updateQuantity, removeItem, totalItems, totalAmount } = useCart();

  return (
    <Card className="flex max-h-[calc(100vh-7rem)] flex-col mt-36">
      <div className="mb-4 flex items-center gap-2">
        <ShoppingBag className="h-5 w-5 text-brand-700" />
        <h2 className="font-bold text-brand-900">
          Votre commande{totalItems > 0 && <span className="ml-1 font-normal text-brand-500">· {totalItems} produit{totalItems > 1 ? 's' : ''}</span>}
        </h2>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Panier vide" description="Ajoutez des articles pour commencer." />
      ) : (
        <>
          <ul className="flex-1 space-y-4 overflow-y-auto pr-1">
            {items.map((item, index) => (
              <li key={`${item.productId ?? item.label}-${index}`} className="flex gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.label} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-xl">🛒</span>
                  )}
                </div>

                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-semibold text-brand-800">{item.label}</p>
                    <span className="shrink-0 text-sm font-bold text-brand-700">
                      {formatMAD(item.unitPrice * item.quantity)}
                    </span>
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
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      aria-label="Retirer l'article"
                      className="rounded-full p-1.5 text-brand-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-brand-100 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold text-brand-700">Total</span>
              <span className="text-lg font-extrabold text-brand-900">{formatMAD(totalAmount)}</span>
            </div>
            <Link to="/panier">
              <Button variant="accent" className="w-full">
                Passer à la caisse · {formatMAD(totalAmount)}
              </Button>
            </Link>
          </div>
        </>
      )}
    </Card>
  );
}