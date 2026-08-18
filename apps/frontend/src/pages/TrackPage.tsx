import { useEffect, useState } from 'react';
import { trackOrder } from '../lib/queries';
import { apiErrorMessage } from '../lib/api';
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  formatMAD,
  orderStatusColor,
} from '../lib/format';
import {
  getLocalOrderHistory,
  saveOrderToHistory,
  removeOrderFromHistory,
  type LocalOrderReference,
} from '../lib/orderHistory';
import { Alert, Badge, Button, Card, Field, Input, Spinner } from '../components/ui';
import { SupportCTA } from '../components/SupportCTA';
import type { Order } from '../lib/types';

function StatusTimeline({ order }: { order: Order }) {
  if (order.status === 'CANCELLED') {
    return (
      <div className="space-y-3">
        <Badge className={orderStatusColor('CANCELLED')}>
          Commande annulée
        </Badge>

        <p className="text-sm text-brand-500">
          Cette commande a été annulée.
        </p>
      </div>
    );
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(order.status);

  return (
    <ol className="space-y-4">
      {ORDER_STATUS_FLOW.map((status, idx) => {
        const done = idx <= currentIndex;
        const current = status === order.status;

        return (
          <li key={status} className="flex items-center gap-3">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done
                  ? 'bg-brand-500 text-white'
                  : 'bg-brand-100 text-brand-400'
                } ${current ? 'ring-4 ring-brand-100' : ''}`}
            >
              {done ? '✓' : idx + 1}
            </span>

            <span
              className={
                done
                  ? 'font-semibold text-brand-800'
                  : 'text-brand-400'
              }
            >
              {ORDER_STATUS_LABELS[status]}
            </span>

            {current && (
              <Badge className={orderStatusColor(status)}>
                En cours
              </Badge>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function OrderCard({
  order,
  onRemove,
}: {
  order: Order;
  onRemove: (orderId: string) => void;
}) {
  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-brand-500">Commande</p>

          <p className="text-lg font-bold text-brand-800">
            {order.orderNumber}
          </p>

          <p className="mt-1 text-sm text-brand-500">
            {new Intl.DateTimeFormat('fr-MA', {
              dateStyle: 'medium',
            }).format(new Date(order.createdAt))}
          </p>
        </div>

        <Badge className={orderStatusColor(order.status)}>
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </div>

      <div className="mt-6">
        <StatusTimeline order={order} />
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-brand-100 pt-4">
        <span className="font-bold text-brand-800">
          Total
        </span>

        <span className="font-bold text-brand-800">
          {formatMAD(order.totalAmount)}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onRemove(order.id)}
        className="mt-4 text-sm text-brand-400 underline hover:text-brand-700"
      >
        Retirer de cet appareil
      </button>
    </Card>
  );
}

export function TrackPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      const history = getLocalOrderHistory();

      if (history.length === 0) {
        setLoadingHistory(false);
        return;
      }

      const results = await Promise.allSettled(
        history.map((item) =>
          trackOrder(item.orderNumber, item.customerPhone),
        ),
      );

      const validOrders: Order[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          validOrders.push(result.value);
          return;
        }

        const item: LocalOrderReference = history[index];

        // Si une ancienne référence n'est plus valide,
        // on peut la retirer de l'historique local.
        removeOrderFromHistory(item.orderId);
      });

      setOrders(validOrders);
      setLoadingHistory(false);
    };

    loadHistory();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');

    setLoading(true);

    try {
      const result = await trackOrder(
        orderNumber.trim(),
        phone.trim(),
      );

      saveOrderToHistory(result);

      setOrders((current) => {
        const exists = current.some(
          (order) => order.id === result.id,
        );

        if (exists) {
          return current.map((order) =>
            order.id === result.id ? result : order,
          );
        }

        return [result, ...current];
      });

      setOrderNumber('');
      setPhone('');
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          'Commande introuvable. Vérifiez le numéro et le téléphone.',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (orderId: string) => {
    removeOrderFromHistory(orderId);

    setOrders((current) =>
      current.filter((order) => order.id !== orderId),
    );
  };

  const hasHistory = orders.length > 0;

  if (loadingHistory) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-900">
          Suivi de commande
        </h1>

        <p className="text-brand-600">
          {hasHistory
            ? 'Retrouvez ici vos commandes récentes.'
            : 'Retrouvez votre commande avec son numéro et votre téléphone.'}
        </p>
      </div>

      {hasHistory && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-brand-800">
            Mes commandes
          </h2>

          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {!hasHistory && (
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Numéro de commande">
              <Input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="ELC-2026-000123"
                required
              />
            </Field>

            <Field label="Téléphone">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0612345678"
                required
              />
            </Field>

            {error && <Alert>{error}</Alert>}

            <Button type="submit" disabled={loading}>
              {loading ? 'Recherche…' : 'Suivre'}
            </Button>
          </form>
        </Card>
      )}

      {loading && (
        <div className="flex justify-center">
          <Spinner />
        </div>
      )}

      {hasHistory && (
        <Card>
          <h2 className="font-bold text-brand-800">
            Vous avez une autre commande ?
          </h2>

          <p className="mt-1 text-sm text-brand-500">
            Vous pouvez également retrouver une commande
            qui n'est pas encore enregistrée sur cet appareil.
          </p>

          <form onSubmit={submit} className="mt-4 space-y-4">
            <Field label="Numéro de commande">
              <Input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="ELC-2026-000123"
                required
              />
            </Field>

            <Field label="Téléphone">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0612345678"
                required
              />
            </Field>

            {error && <Alert>{error}</Alert>}

            <Button type="submit" disabled={loading}>
              {loading ? 'Recherche…' : 'Ajouter ma commande'}
            </Button>
          </form>
        </Card>
      )}

      {orders.length > 0 && (
        <SupportCTA
          message={`Bonjour, je souhaite de l'aide concernant ma commande ${orders[0].orderNumber}.`}
        />
      )}
    </div>
  );
}