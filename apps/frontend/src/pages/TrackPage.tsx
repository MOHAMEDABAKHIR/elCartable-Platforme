import { useState } from 'react';
import { trackOrder } from '../lib/queries';
import { apiErrorMessage } from '../lib/api';
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  formatMAD,
  orderStatusColor,
} from '../lib/format';
import { Alert, Badge, Button, Card, Field, Input, Spinner } from '../components/ui';
import { SupportCTA } from '../components/SupportCTA';
import type { Order } from '../lib/types';

function StatusTimeline({ order }: { order: Order }) {
  if (order.status === 'CANCELLED') {
    return <Badge className={orderStatusColor('CANCELLED')}>Commande annulée</Badge>;
  }
  const currentIndex = ORDER_STATUS_FLOW.indexOf(order.status);
  return (
    <ol className="space-y-3">
      {ORDER_STATUS_FLOW.map((status, idx) => {
        const done = idx <= currentIndex;
        return (
          <li key={status} className="flex items-center gap-3">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                done ? 'bg-brand-500 text-white' : 'bg-brand-100 text-brand-400'
              }`}
            >
              {done ? '✓' : idx + 1}
            </span>
            <span className={done ? 'font-semibold text-brand-800' : 'text-brand-400'}>
              {ORDER_STATUS_LABELS[status]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function TrackPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOrder(null);
    setLoading(true);
    try {
      const result = await trackOrder(orderNumber.trim(), phone.trim());
      setOrder(result);
    } catch (err) {
      setError(apiErrorMessage(err, 'Commande introuvable. Vérifiez le numéro et le téléphone.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-900">Suivi de commande</h1>
        <p className="text-brand-600">Entrez votre numéro de commande et votre téléphone.</p>
      </div>

      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Numéro de commande">
            <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="ELC-2026-000123" required />
          </Field>
          <Field label="Téléphone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0612345678" required />
          </Field>
          {error && <Alert>{error}</Alert>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Recherche…' : 'Suivre'}
          </Button>
        </form>
      </Card>

      {loading && <Spinner />}

      {order && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-500">Commande</p>
              <p className="text-lg font-bold text-brand-800">{order.orderNumber}</p>
            </div>
            <Badge className={orderStatusColor(order.status)}>{ORDER_STATUS_LABELS[order.status]}</Badge>
          </div>
          <div className="mt-6">
            <StatusTimeline order={order} />
          </div>
          <div className="mt-6 flex justify-between border-t border-brand-100 pt-4 font-bold text-brand-800">
            <span>Total</span>
            <span>{formatMAD(order.totalAmount)}</span>
          </div>
        </Card>
      )}

      {order && (
        <SupportCTA
          message={`Bonjour, je souhaite de l'aide concernant ma commande ${order.orderNumber}.`}
        />
      )}
    </div>
  );
}
