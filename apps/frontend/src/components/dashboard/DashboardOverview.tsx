import {
  ShoppingCart,
  Wallet,
  Users,
  Percent,
  Package,
  Truck,
  XCircle,
  Clock3,
} from 'lucide-react';

import { formatMAD } from '../../lib/format';
import { DashboardStatCard } from './DashboardStatCard';

interface DashboardOverviewProps {
  data: {
    orders: {
      totalOrders: number;
      totalRevenue: number;
      averageCartValue: number;
      byStatus: Record<string, number>;
    };

    visitors: {
      sessionsCount: number;
      convertedSessions: number;
      newVisitorsCount: number;
    };
  };
}

export function DashboardOverview({
  data,
}: DashboardOverviewProps) {
  const conversion =
    data.visitors.sessionsCount === 0
      ? 0
      : Math.round(
          (data.visitors.convertedSessions /
            data.visitors.sessionsCount) *
            100
        );

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

      <DashboardStatCard
        title="Chiffre d'affaires"
        value={formatMAD(data.orders.totalRevenue)}
        icon={<Wallet size={24} />}
        color="bg-green-100 text-green-700"
      />

      <DashboardStatCard
        title="Commandes"
        value={data.orders.totalOrders}
        icon={<ShoppingCart size={24} />}
        color="bg-blue-100 text-blue-700"
      />

      <DashboardStatCard
        title="Panier moyen"
        value={formatMAD(data.orders.averageCartValue)}
        icon={<Package size={24} />}
        color="bg-purple-100 text-purple-700"
      />

      <DashboardStatCard
        title="Conversion"
        value={`${conversion}%`}
        subtitle={`${data.visitors.convertedSessions} conversions`}
        icon={<Percent size={24} />}
        color="bg-orange-100 text-orange-700"
      />

      <DashboardStatCard
        title="Visiteurs"
        value={data.visitors.sessionsCount}
        subtitle={`${data.visitors.newVisitorsCount} nouveaux`}
        icon={<Users size={24} />}
      />

      <DashboardStatCard
        title="En attente d'appel"
        value={
          data.orders.byStatus.AWAITING_CALL ??
          0
        }
        icon={<Clock3 size={24} />}
        color="bg-yellow-100 text-yellow-700"
      />

      <DashboardStatCard
        title="Livrées"
        value={
          data.orders.byStatus.DELIVERED ??
          0
        }
        icon={<Truck size={24} />}
        color="bg-emerald-100 text-emerald-700"
      />

      <DashboardStatCard
        title="Annulées"
        value={
          data.orders.byStatus.CANCELLED ??
          0
        }
        icon={<XCircle size={24} />}
        color="bg-red-100 text-red-700"
      />
    </div>
  );
}