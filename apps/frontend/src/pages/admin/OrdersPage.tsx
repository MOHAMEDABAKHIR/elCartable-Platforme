import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchOrders } from '../../lib/queries';
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  formatDate,
  formatMAD,
  orderStatusColor,
} from '../../lib/format';
import { Alert, Badge, Card, EmptyState, Input, Select, Spinner } from '../../components/ui';
import type { OrderStatus } from '../../lib/types';

export function OrdersPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['orders', status, search],
    queryFn: () => fetchOrders({ status: status || undefined, search: search || undefined }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-brand-900">Commandes</h1>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Rechercher (nom, téléphone, numéro)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:flex-1"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-56">
          <option value="">Tous les statuts</option>
          {[...ORDER_STATUS_FLOW, 'CANCELLED' as OrderStatus].map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <Alert>Impossible de charger les commandes.</Alert>
      ) : data && data.length > 0 ? (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-100 text-left text-brand-500">
                <th className="px-4 py-3">Numéro</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((order) => (
                <tr key={order.id} className="border-b border-brand-50 hover:bg-brand-50">
                  <td className="px-4 py-3">
                    <Link to={`/admin/commandes/${order.id}`} className="font-semibold text-brand-700 hover:underline">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-brand-800">{order.customerName}</p>
                    <p className="text-xs text-brand-500">{order.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-brand-500">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Badge className={orderStatusColor(order.status)}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-brand-800">
                    {formatMAD(order.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <EmptyState title="Aucune commande" description="Aucune commande ne correspond à ces filtres." />
      )}
    </div>
  );
}
