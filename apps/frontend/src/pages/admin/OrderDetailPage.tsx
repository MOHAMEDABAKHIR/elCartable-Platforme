import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiErrorMessage } from '../../lib/api';
import { fetchOrder } from '../../lib/queries';
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  formatDate,
  formatMAD,
  orderStatusColor,
} from '../../lib/format';
import { Alert, Badge, Button, Card, Field, Input, Select, Spinner } from '../../components/ui';
import type { Order, OrderStatus } from '../../lib/types';

export function OrderDetailPage() {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrder(id),
    enabled: Boolean(id),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['order', id] });
  const wrap = <T,>(fn: () => Promise<T>) => async () => {
    setError('');
    try {
      await fn();
      invalidate();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => api.patch(`/orders/${id}/status`, { status }),
    onSuccess: invalidate,
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [commercialId, setCommercialId] = useState('');
  const [itemLabel, setItemLabel] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);

  if (isLoading || !order) return <Spinner label="Chargement de la commande…" />;

  const downloadPdf = async () => {
    setError('');
    try {
      const { data } = await api.get(`/orders/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(data as Blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const updateQty = (itemId: string, quantity: number) =>
    wrap(() => api.patch(`/orders/${id}/items/${itemId}`, { quantity: Math.max(1, quantity) }))();
  const removeItem = (itemId: string) => wrap(() => api.delete(`/orders/${id}/items/${itemId}`))();
  const addItem = wrap(async () => {
    await api.post(`/orders/${id}/items`, { label: itemLabel, quantity: itemQty, unitPrice: itemPrice });
    setItemLabel('');
    setItemQty(1);
    setItemPrice(0);
  });
  const assign = wrap(() => api.patch(`/orders/${id}/assign`, { commercialId }));

  return (
    <div className="space-y-6">
      <Link to="/admin/commandes" className="text-sm text-brand-500 hover:underline">
        ← Toutes les commandes
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-900">{order.orderNumber}</h1>
          <p className="text-brand-500">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={orderStatusColor(order.status)}>{ORDER_STATUS_LABELS[order.status]}</Badge>
          <Button variant="outline" onClick={downloadPdf}>
            Fiche PDF
          </Button>
        </div>
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ItemsCard
            order={order}
            onUpdateQty={updateQty}
            onRemove={removeItem}
            itemLabel={itemLabel}
            setItemLabel={setItemLabel}
            itemQty={itemQty}
            setItemQty={setItemQty}
            itemPrice={itemPrice}
            setItemPrice={setItemPrice}
            onAdd={addItem}
          />

          {order.history && order.history.length > 0 && (
            <Card>
              <h2 className="font-bold text-brand-800">Historique</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {order.history.map((h) => (
                  <li key={h.id} className="flex justify-between border-b border-brand-50 pb-2">
                    <span className="text-brand-700">{h.action}</span>
                    <span className="text-xs text-brand-400">{formatDate(h.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="font-bold text-brand-800">Client</h2>
            <dl className="mt-3 space-y-1 text-sm">
              <Row label="Nom" value={order.customerName} />
              <Row label="Téléphone" value={order.customerPhone} />
              {order.customerEmail && <Row label="Email" value={order.customerEmail} />}
              {order.deliveryAddress && <Row label="Adresse" value={order.deliveryAddress} />}
              {order.school && <Row label="École" value={order.school.name} />}
              {order.grade && <Row label="Niveau" value={order.grade.name} />}
            </dl>
          </Card>

          <Card>
            <h2 className="font-bold text-brand-800">Changer le statut</h2>
            <div className="mt-3 flex gap-2">
              <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value as OrderStatus)}>
                <option value="">Choisir…</option>
                {[...ORDER_STATUS_FLOW, 'CANCELLED' as OrderStatus].map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
              <Button
                onClick={() => newStatus && statusMutation.mutate(newStatus)}
                disabled={!newStatus || statusMutation.isPending}
              >
                OK
              </Button>
            </div>
          </Card>

          <Card>
            <h2 className="font-bold text-brand-800">Assigner un commercial</h2>
            <div className="mt-3 space-y-2">
              <Input
                placeholder="ID du commercial"
                value={commercialId}
                onChange={(e) => setCommercialId(e.target.value)}
              />
              <Button variant="outline" className="w-full" onClick={assign} disabled={!commercialId}>
                Assigner
              </Button>
              {order.commercial && (
                <p className="text-xs text-brand-500">Assigné à {order.commercial.fullName}</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-brand-500">{label}</dt>
      <dd className="text-right font-medium text-brand-800">{value}</dd>
    </div>
  );
}

interface ItemsCardProps {
  order: Order;
  onUpdateQty: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  itemLabel: string;
  setItemLabel: (v: string) => void;
  itemQty: number;
  setItemQty: (v: number) => void;
  itemPrice: number;
  setItemPrice: (v: number) => void;
  onAdd: () => void;
}

function ItemsCard({
  order,
  onUpdateQty,
  onRemove,
  itemLabel,
  setItemLabel,
  itemQty,
  setItemQty,
  itemPrice,
  setItemPrice,
  onAdd,
}: ItemsCardProps) {
  return (
    <Card>
      <h2 className="font-bold text-brand-800">Articles</h2>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="border-b border-brand-100 text-left text-brand-500">
            <th className="py-2">Article</th>
            <th className="py-2 text-center">Qté</th>
            <th className="py-2 text-right">PU</th>
            <th className="py-2 text-right">Total</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-brand-50">
              <td className="py-2 text-brand-800">{item.label}</td>
              <td className="py-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                    className="h-6 w-6 rounded border border-brand-200"
                  >
                    −
                  </button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                    className="h-6 w-6 rounded border border-brand-200"
                  >
                    +
                  </button>
                </div>
              </td>
              <td className="py-2 text-right">{formatMAD(item.unitPrice)}</td>
              <td className="py-2 text-right font-medium">
                {formatMAD(Number(item.unitPrice) * item.quantity)}
              </td>
              <td className="py-2 text-right">
                <button onClick={() => onRemove(item.id)} className="text-red-500 hover:underline">
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-between border-t border-brand-100 pt-3 text-lg font-bold text-brand-800">
        <span>Total</span>
        <span>{formatMAD(order.totalAmount)}</span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 rounded-xl bg-brand-50 p-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <Field label="Ajouter un article">
          <Input value={itemLabel} onChange={(e) => setItemLabel(e.target.value)} placeholder="Libellé" />
        </Field>
        <Field label="Qté">
          <Input
            type="number"
            min={1}
            value={itemQty}
            onChange={(e) => setItemQty(Number(e.target.value))}
            className="w-20"
          />
        </Field>
        <Field label="PU (MAD)">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={itemPrice}
            onChange={(e) => setItemPrice(Number(e.target.value))}
            className="w-24"
          />
        </Field>
        <div className="flex items-end">
          <Button onClick={onAdd} disabled={!itemLabel}>
            Ajouter
          </Button>
        </div>
      </div>
    </Card>
  );
}
