import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Card } from '../components/ui';
import { useCart } from '../store/cart';
import { formatMAD } from '../lib/format';
import type { Order } from '../lib/types';

export function OrderConfirmationPage() {
  const { state } = useLocation() as { state?: { order?: Order } };
  const order = state?.order;
  const { clear } = useCart();

  useEffect(() => {
    if (order) clear();
  }, [order, clear]);

  return (
    <div className="mx-auto max-w-lg text-center">
      <Card>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✓
        </div>
        <h1 className="text-2xl font-extrabold text-brand-900">Commande enregistrée !</h1>
        <p className="mt-2 text-brand-600">
          Merci. Un conseiller vous appellera pour confirmer votre commande et la livraison.
        </p>

        {order && (
          <div className="mt-6 space-y-2 rounded-xl bg-brand-50 p-4 text-left text-sm">
            <div className="flex justify-between">
              <span className="text-brand-500">Numéro</span>
              <span className="font-bold text-brand-800">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-500">Total estimé</span>
              <span className="font-semibold text-brand-800">{formatMAD(order.totalAmount)}</span>
            </div>
            <p className="pt-2 text-xs text-brand-500">
              Conservez votre numéro et votre téléphone pour suivre la commande.
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <Link to="/suivi">
            <Button variant="accent">Suivre ma commande</Button>
          </Link>
          <Link to="/catalogue">
            <Button variant="outline">Continuer mes achats</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
