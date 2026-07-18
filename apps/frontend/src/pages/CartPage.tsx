import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../store/cart';
import { formatMAD } from '../lib/format';
import { Button, Card, EmptyState } from '../components/ui';

export function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, totalAmount, clear } = useCart();

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold text-brand-900">Mon panier</h1>
        <EmptyState title="Votre panier est vide" description="Ajoutez des articles depuis le catalogue ou une liste scolaire." />
        <Link to="/catalogue">
          <Button variant="accent">Parcourir le catalogue</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-brand-900">Mon panier</h1>
        <button onClick={clear} className="text-sm font-semibold text-red-600 hover:underline">
          Vider le panier
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <ul className="divide-y divide-brand-50">
            {items.map((item, index) => (
              <li key={`${item.productId ?? item.label}-${index}`} className="flex items-center gap-4 py-4">
                <div className="flex-1">
                  <p className="font-medium text-brand-800">{item.label}</p>
                  <p className="text-sm text-brand-500">{formatMAD(item.unitPrice)} / unité</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(index, item.quantity - 1)}
                    className="h-8 w-8 rounded-lg border border-brand-200 text-brand-700 hover:bg-brand-50"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(index, item.quantity + 1)}
                    className="h-8 w-8 rounded-lg border border-brand-200 text-brand-700 hover:bg-brand-50"
                  >
                    +
                  </button>
                </div>
                <span className="w-24 text-right font-semibold text-brand-800">
                  {formatMAD(item.unitPrice * item.quantity)}
                </span>
                <button
                  onClick={() => removeItem(index)}
                  className="text-sm text-red-500 hover:underline"
                  aria-label="Retirer"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="h-fit">
          <h2 className="font-bold text-brand-800">Récapitulatif</h2>
          <div className="mt-4 flex justify-between text-sm text-brand-600">
            <span>Sous-total</span>
            <span>{formatMAD(totalAmount)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm text-brand-600">
            <span>Livraison</span>
            <span>À confirmer</span>
          </div>
          <div className="mt-4 flex justify-between border-t border-brand-100 pt-4 text-lg font-bold text-brand-800">
            <span>Total</span>
            <span>{formatMAD(totalAmount)}</span>
          </div>
          <Button variant="accent" className="mt-6 w-full" onClick={() => navigate('/commande')}>
            Commander
          </Button>
          <p className="mt-3 text-center text-xs text-brand-500">Paiement à la livraison</p>
        </Card>
      </div>
    </div>
  );
}
