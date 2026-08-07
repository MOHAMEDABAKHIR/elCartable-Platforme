import { Card } from '../ui';
import { formatMAD, ORDER_STATUS_LABELS } from '../../lib/format';

interface LatestOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  total: number;
  createdAt: string;
}

interface LatestOrdersTableProps {
  orders: LatestOrder[];
}

export function LatestOrdersTable({
  orders,
}: LatestOrdersTableProps) {

  return (
    <Card>

      <h2 className="mb-5 text-lg font-bold text-brand-900">
        Dernières commandes
      </h2>


      {orders.length === 0 ? (

        <p className="text-sm text-brand-500">
          Aucune commande récente.
        </p>

      ) : (

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead>

              <tr className="border-b border-brand-100 text-left">

                <th className="pb-3 text-brand-500">
                  Numéro
                </th>

                <th className="pb-3 text-brand-500">
                  Client
                </th>

                <th className="pb-3 text-brand-500">
                  Statut
                </th>

                <th className="pb-3 text-right text-brand-500">
                  Total
                </th>

              </tr>

            </thead>


            <tbody>

              {orders.map((order) => (

                <tr
                  key={order.id}
                  className="border-b border-brand-50"
                >

                  <td className="py-3 font-semibold text-brand-900">
                    {order.orderNumber}
                  </td>


                  <td className="py-3">
                    {order.customerName}
                  </td>


                  <td className="py-3">

                    <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">

                      {ORDER_STATUS_LABELS[
                        order.status as keyof typeof ORDER_STATUS_LABELS
                      ] ?? order.status}

                    </span>

                  </td>


                  <td className="py-3 text-right font-semibold">

                    {formatMAD(order.total)}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </Card>
  );
}